import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    allLeads,
    byStatus,
    bySource,
    byOriginType,
    bySalesRep,
    bySegment,
    byLanguage,
    byImportedYear,
    creditAppCount,
    optOutCount,
    totalCount,
  ] = await Promise.all([
    // All leads with fields needed for geo + demographics
    db.lead.findMany({
      select: {
        address: true,
        dob: true,
        score: true,
        daysOld: true,
      },
    }),
    db.lead.groupBy({ by: ["status"], _count: { id: true } }),
    db.lead.groupBy({ by: ["source"], _count: { id: true } }),
    db.lead.groupBy({ by: ["originType"], _count: { id: true } }),
    db.lead.groupBy({
      by: ["salesRep"],
      _count: { id: true },
      _avg: { score: true },
      where: { salesRep: { not: null } },
    }),
    db.lead.groupBy({ by: ["segment"], _count: { id: true } }),
    db.lead.groupBy({ by: ["language"], _count: { id: true } }),
    db.lead.groupBy({
      by: ["importedYear"],
      _count: { id: true },
      where: { importedYear: { not: null } },
    }),
    db.lead.count({ where: { creditApp: true } }),
    db.lead.count({ where: { optedOut: true } }),
    db.lead.count(),
  ]);

  // --- Geo: parse addresses client-side ---
  const FL_PATTERN =
    /^(.*?),?\s+([A-Za-z][A-Za-z\s]*?)\s+(FL|Florida)\s+(\d{5})(?:-\d{4})?$/i;
  const ZIP_ONLY = /(\d{5})(?:-\d{4})?/;

  const cityMap = new Map<string, { city: string; zip: string; count: number }>();
  const zipMap = new Map<string, number>();
  let withAddress = 0;
  let unknownAddress = 0;

  for (const lead of allLeads) {
    if (!lead.address?.trim()) {
      unknownAddress++;
      continue;
    }
    withAddress++;
    const flMatch = lead.address.trim().match(FL_PATTERN);
    if (flMatch) {
      const city = flMatch[2].trim();
      const zip = flMatch[4];
      const key = `${city}|${zip}`;
      const existing = cityMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        cityMap.set(key, { city, zip, count: 1 });
      }
      zipMap.set(zip, (zipMap.get(zip) || 0) + 1);
    } else {
      const zipMatch = lead.address.match(ZIP_ONLY);
      if (zipMatch) {
        zipMap.set(zipMatch[1], (zipMap.get(zipMatch[1]) || 0) + 1);
      }
    }
  }

  const byCityState = Array.from(cityMap.values())
    .sort((a, b) => b.count - a.count);
  const topZips = Array.from(zipMap.entries())
    .map(([zip, count]) => ({ zip, count }))
    .sort((a, b) => b.count - a.count);

  // --- Demographics ---
  const now = new Date();
  const ageGroups: Record<string, number> = {
    "18-25": 0,
    "26-35": 0,
    "36-50": 0,
    "51-65": 0,
    "65+": 0,
    Unknown: 0,
  };

  const scoreRanges: Record<string, number> = {
    "0-25": 0,
    "26-50": 0,
    "51-75": 0,
    "76-100": 0,
    "101-120": 0,
  };

  let totalScore = 0;
  let totalDaysOld = 0;
  let daysOldCount = 0;

  for (const lead of allLeads) {
    totalScore += lead.score;

    if (lead.daysOld != null) {
      totalDaysOld += lead.daysOld;
      daysOldCount++;
    }

    if (lead.dob) {
      const age = Math.floor(
        (now.getTime() - new Date(lead.dob).getTime()) / (365.25 * 86400000),
      );
      if (age < 18) ageGroups["18-25"]++;
      else if (age <= 25) ageGroups["18-25"]++;
      else if (age <= 35) ageGroups["26-35"]++;
      else if (age <= 50) ageGroups["36-50"]++;
      else if (age <= 65) ageGroups["51-65"]++;
      else ageGroups["65+"]++;
    } else {
      ageGroups["Unknown"]++;
    }

    const s = lead.score;
    if (s <= 25) scoreRanges["0-25"]++;
    else if (s <= 50) scoreRanges["26-50"]++;
    else if (s <= 75) scoreRanges["51-75"]++;
    else if (s <= 100) scoreRanges["76-100"]++;
    else scoreRanges["101-120"]++;
  }

  // --- Build response ---
  const segments: Record<string, number> = {};
  for (const s of bySegment) {
    segments[s.segment] = s._count.id;
  }

  const languages: Record<string, number> = {};
  for (const l of byLanguage) {
    languages[l.language] = l._count.id;
  }

  return NextResponse.json({
    geo: {
      byCityState,
      topZips,
      total: totalCount,
      withAddress,
      unknownAddress,
    },
    demographics: {
      byAgeGroup: Object.entries(ageGroups).map(([group, count]) => ({
        group,
        count,
      })),
      byImportedYear: byImportedYear
        .filter((y) => y.importedYear != null)
        .map((y) => ({ year: y.importedYear, count: y._count.id }))
        .sort((a, b) => (a.year ?? 0) - (b.year ?? 0)),
      byScoreRange: Object.entries(scoreRanges).map(([range, count]) => ({
        range,
        count,
      })),
      avgScore: totalCount > 0 ? Math.round(totalScore / totalCount) : 0,
      avgDaysOld: daysOldCount > 0 ? Math.round(totalDaysOld / daysOldCount) : 0,
    },
    pipeline: {
      byStatus: byStatus.map((s) => ({
        label: s.status || "Unknown",
        count: s._count.id,
      })),
      bySource: bySource
        .filter((s) => s.source)
        .map((s) => ({ label: s.source!, count: s._count.id }))
        .sort((a, b) => b.count - a.count),
      byOriginType: byOriginType
        .filter((o) => o.originType)
        .map((o) => ({ label: o.originType!, count: o._count.id }))
        .sort((a, b) => b.count - a.count),
      bySalesRep: bySalesRep
        .map((r) => ({
          label: r.salesRep!,
          count: r._count.id,
          avgScore: Math.round(r._avg.score ?? 0),
        }))
        .sort((a, b) => b.count - a.count),
      creditAppRate:
        totalCount > 0 ? Math.round((creditAppCount / totalCount) * 100) : 0,
      optOutRate:
        totalCount > 0 ? Math.round((optOutCount / totalCount) * 100) : 0,
    },
    segments,
    languages,
  });
}

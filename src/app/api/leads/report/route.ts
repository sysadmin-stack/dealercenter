import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Prisma, Segment, Language } from "@/generated/prisma/client";

const NATIVE_GROUP_FIELDS = [
  "salesRep",
  "source",
  "segment",
  "language",
  "status",
  "originType",
  "importedYear",
] as const;

type NativeField = (typeof NATIVE_GROUP_FIELDS)[number];

function isNativeField(field: string): field is NativeField {
  return (NATIVE_GROUP_FIELDS as readonly string[]).includes(field);
}

const FL_PATTERN =
  /^(.*?),?\s+([A-Za-z][A-Za-z\s]*?)\s+(FL|Florida)\s+(\d{5})(?:-\d{4})?$/i;
const ZIP_ONLY = /(\d{5})(?:-\d{4})?/;

function buildWhere(params: URLSearchParams): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};

  const segment = params.get("segment");
  if (segment) {
    const values = segment.split(",") as Segment[];
    if (values.length === 1) {
      where.segment = values[0];
    } else {
      where.segment = { in: values };
    }
  }

  const language = params.get("language");
  if (language) {
    const values = language.split(",") as Language[];
    if (values.length === 1) {
      where.language = values[0];
    } else {
      where.language = { in: values };
    }
  }

  const status = params.get("status");
  if (status) where.status = { contains: status, mode: "insensitive" };

  const salesRep = params.get("salesRep");
  if (salesRep) where.salesRep = { contains: salesRep, mode: "insensitive" };

  const source = params.get("source");
  if (source) where.source = { contains: source, mode: "insensitive" };

  const creditApp = params.get("creditApp");
  if (creditApp) where.creditApp = creditApp === "true";

  const optedOut = params.get("optedOut");
  if (optedOut) where.optedOut = optedOut === "true";

  const scoreMin = params.get("scoreMin");
  const scoreMax = params.get("scoreMax");
  if (scoreMin || scoreMax) {
    where.score = {};
    if (scoreMin) where.score.gte = Number(scoreMin);
    if (scoreMax) where.score.lte = Number(scoreMax);
  }

  const daysOldMin = params.get("daysOldMin");
  const daysOldMax = params.get("daysOldMax");
  if (daysOldMin || daysOldMax) {
    where.daysOld = {};
    if (daysOldMin) where.daysOld.gte = Number(daysOldMin);
    if (daysOldMax) where.daysOld.lte = Number(daysOldMax);
  }

  const importedYear = params.get("importedYear");
  if (importedYear) where.importedYear = Number(importedYear);

  return where;
}

interface ReportRow {
  label: string;
  count: number;
  avgScore: number;
  avgDaysOld: number;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const groupBy = params.get("groupBy") || "segment";
  const where = buildWhere(params);

  // Native Prisma groupBy fields
  if (isNativeField(groupBy)) {
    const results = await db.lead.groupBy({
      by: [groupBy],
      where,
      _count: { id: true },
      _avg: { score: true, daysOld: true },
    });

    const rows: ReportRow[] = results.map((r) => ({
      label: String(r[groupBy] ?? "Unknown"),
      count: r._count.id,
      avgScore: Math.round(r._avg.score ?? 0),
      avgDaysOld: Math.round(r._avg.daysOld ?? 0),
    }));

    rows.sort((a, b) => b.count - a.count);
    return NextResponse.json({ data: rows, groupBy });
  }

  // Derived fields need full scan
  const leads = await db.lead.findMany({
    where,
    select: {
      address: true,
      dob: true,
      score: true,
      daysOld: true,
    },
  });

  const buckets = new Map<
    string,
    { count: number; totalScore: number; totalDaysOld: number; daysOldCount: number }
  >();

  const now = new Date();

  for (const lead of leads) {
    let key = "Unknown";

    if (groupBy === "city") {
      if (lead.address) {
        const m = lead.address.trim().match(FL_PATTERN);
        if (m) key = m[2].trim();
      }
    } else if (groupBy === "zip") {
      if (lead.address) {
        const m = lead.address.trim().match(FL_PATTERN);
        if (m) {
          key = m[4];
        } else {
          const zm = lead.address.match(ZIP_ONLY);
          if (zm) key = zm[1];
        }
      }
    } else if (groupBy === "scoreRange") {
      const s = lead.score;
      if (s <= 25) key = "0-25";
      else if (s <= 50) key = "26-50";
      else if (s <= 75) key = "51-75";
      else if (s <= 100) key = "76-100";
      else key = "101-120";
    } else if (groupBy === "ageGroup") {
      if (lead.dob) {
        const age = Math.floor(
          (now.getTime() - new Date(lead.dob).getTime()) / (365.25 * 86400000),
        );
        if (age <= 25) key = "18-25";
        else if (age <= 35) key = "26-35";
        else if (age <= 50) key = "36-50";
        else if (age <= 65) key = "51-65";
        else key = "65+";
      }
    }

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count++;
      bucket.totalScore += lead.score;
      if (lead.daysOld != null) {
        bucket.totalDaysOld += lead.daysOld;
        bucket.daysOldCount++;
      }
    } else {
      buckets.set(key, {
        count: 1,
        totalScore: lead.score,
        totalDaysOld: lead.daysOld ?? 0,
        daysOldCount: lead.daysOld != null ? 1 : 0,
      });
    }
  }

  const rows: ReportRow[] = Array.from(buckets.entries()).map(([label, b]) => ({
    label,
    count: b.count,
    avgScore: b.count > 0 ? Math.round(b.totalScore / b.count) : 0,
    avgDaysOld: b.daysOldCount > 0 ? Math.round(b.totalDaysOld / b.daysOldCount) : 0,
  }));

  rows.sort((a, b) => b.count - a.count);
  return NextResponse.json({ data: rows, groupBy });
}

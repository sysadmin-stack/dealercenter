import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * GET /api/analytics/ab-results
 * Returns latest A/B test results grouped by channel+segment.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await db.abResult.findMany({
    orderBy: { analyzedAt: "desc" },
    take: 50,
  });

  // Group by channel+segment, keep only latest per group
  const latest: Record<string, (typeof results)[0]> = {};
  for (const r of results) {
    const key = `${r.channel}:${r.segment}`;
    if (!latest[key]) latest[key] = r;
  }

  return NextResponse.json({
    results: Object.values(latest),
    total: results.length,
  });
}

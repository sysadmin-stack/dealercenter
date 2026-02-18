import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * GET /api/analytics/best-times
 * Returns best sending times per channel+segment.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bestTimes = await db.bestTime.findMany({
    orderBy: { calculatedAt: "desc" },
    distinct: ["channel", "segment"],
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return NextResponse.json({
    bestTimes: bestTimes.map((bt) => ({
      ...bt,
      dayName: dayNames[bt.bestDayOfWeek],
      hourFormatted: `${bt.bestHour}:00 ET`,
      engagementPercent: `${(bt.engagementRate * 100).toFixed(1)}%`,
    })),
  });
}

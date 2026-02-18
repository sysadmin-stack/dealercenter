import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    touchesByChannel,
    touchesByStatus,
    eventsByType,
    leadsBySegment,
  ] = await Promise.all([
    db.touch.groupBy({ by: ["channel"], _count: true }),
    db.touch.groupBy({ by: ["channel", "status"], _count: true }),
    db.touchEvent.groupBy({ by: ["eventType"], _count: true }),
    db.lead.groupBy({ by: ["segment"], _count: true }),
  ]);

  // Build per-channel conversion rates
  const channelStats: Record<string, Record<string, number>> = {};
  for (const t of touchesByStatus) {
    if (!channelStats[t.channel]) channelStats[t.channel] = {};
    channelStats[t.channel][t.status] = t._count;
  }

  // Total touches per channel
  const channelTotals: Record<string, number> = {};
  for (const t of touchesByChannel) channelTotals[t.channel] = t._count;

  // Events summary
  const events: Record<string, number> = {};
  for (const e of eventsByType) events[e.eventType] = e._count;

  // Segment breakdown
  const segments: Record<string, number> = {};
  for (const s of leadsBySegment) segments[s.segment] = s._count;

  // A/B variant stats from touch events
  const variantEvents = await db.touchEvent.findMany({
    where: { eventType: "sent" },
    select: { payload: true },
    take: 5000,
  });

  const variantCounts = { A: 0, B: 0, ai: 0, fallback: 0 };
  for (const ve of variantEvents) {
    const payload = ve.payload as Record<string, string> | null;
    if (!payload) continue;
    if (payload.variant === "A") variantCounts.A++;
    if (payload.variant === "B") variantCounts.B++;
    if (payload.source === "ai") variantCounts.ai++;
    if (payload.source === "fallback") variantCounts.fallback++;
  }

  return NextResponse.json({
    channelStats,
    channelTotals,
    events,
    segments,
    variantCounts,
  });
}

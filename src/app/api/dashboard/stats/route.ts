import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalLeads,
    optedOut,
    activeCampaigns,
    totalTouchesSent,
    touchesByStatus,
    recentEvents,
  ] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { optedOut: true } }),
    db.campaign.count({ where: { status: "active" } }),
    db.touch.count({ where: { status: { not: "pending" } } }),
    db.touch.groupBy({ by: ["status"], _count: true }),
    db.touchEvent.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        touch: {
          include: { lead: { select: { name: true } } },
        },
      },
    }),
  ]);

  // Build funnel from touch statuses
  const statusCounts: Record<string, number> = {};
  for (const s of touchesByStatus) statusCounts[s.status] = s._count;

  const sent = (statusCounts.sent ?? 0) +
    (statusCounts.delivered ?? 0) +
    (statusCounts.opened ?? 0) +
    (statusCounts.clicked ?? 0) +
    (statusCounts.replied ?? 0);
  const delivered = (statusCounts.delivered ?? 0) +
    (statusCounts.opened ?? 0) +
    (statusCounts.clicked ?? 0) +
    (statusCounts.replied ?? 0);
  const opened = (statusCounts.opened ?? 0) +
    (statusCounts.clicked ?? 0) +
    (statusCounts.replied ?? 0);
  const replied = statusCounts.replied ?? 0;

  const funnel = { sent, delivered, opened, replied };

  const activity = recentEvents.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    channel: (e.payload as Record<string, string>)?.channel ?? "unknown",
    leadName: e.touch.lead.name,
    createdAt: e.createdAt.toISOString(),
  }));

  return NextResponse.json({
    totalLeads,
    optedOut,
    activeCampaigns,
    totalTouchesSent,
    funnel,
    activity,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || "";

/**
 * GET /api/analytics/daily-summary
 * Returns a summary of the last 24h activity for N8N daily report workflow.
 * Auth: Bearer token or session.
 */
export async function GET(req: NextRequest) {
  // Auth via N8N secret or session
  if (N8N_WEBHOOK_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${N8N_WEBHOOK_SECRET}`) {
      // Fall back to session auth
      const { auth } = await import("@/auth");
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    touchesSent,
    touchesByChannel,
    touchesByStatus,
    newLeads,
    optOuts,
    conversations,
    handoffs,
  ] = await Promise.all([
    db.touch.count({
      where: { sentAt: { gte: since } },
    }),
    db.touch.groupBy({
      by: ["channel"],
      where: { sentAt: { gte: since } },
      _count: true,
    }),
    db.touch.groupBy({
      by: ["status"],
      where: { sentAt: { gte: since } },
      _count: true,
    }),
    db.lead.count({
      where: { createdAt: { gte: since } },
    }),
    db.lead.count({
      where: { optedOut: true, updatedAt: { gte: since } },
    }),
    db.conversation.count({
      where: { createdAt: { gte: since } },
    }),
    db.conversation.count({
      where: { status: "human", updatedAt: { gte: since } },
    }),
  ]);

  const byChannel: Record<string, number> = {};
  for (const t of touchesByChannel) byChannel[t.channel] = t._count;

  const byStatus: Record<string, number> = {};
  for (const t of touchesByStatus) byStatus[t.status] = t._count;

  // Calculate delivery rate
  const delivered = (byStatus.delivered ?? 0) + (byStatus.opened ?? 0) + (byStatus.clicked ?? 0) + (byStatus.replied ?? 0);
  const deliveryRate = touchesSent > 0 ? ((delivered / touchesSent) * 100).toFixed(1) : "0.0";

  // Build text summary for WhatsApp
  const summary = [
    `Daily Report — ${new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`,
    "",
    `Touches sent: ${touchesSent}`,
    `  WhatsApp: ${byChannel.whatsapp ?? 0}`,
    `  Email: ${byChannel.email ?? 0}`,
    `  SMS: ${byChannel.sms ?? 0}`,
    "",
    `Delivery rate: ${deliveryRate}%`,
    `Replies: ${byStatus.replied ?? 0}`,
    `Bounced: ${byStatus.bounced ?? 0}`,
    "",
    `New leads: ${newLeads}`,
    `Opt-outs: ${optOuts}`,
    `Conversations: ${conversations}`,
    `Handoffs: ${handoffs}`,
  ].join("\n");

  return NextResponse.json({
    period: "24h",
    since: since.toISOString(),
    touchesSent,
    byChannel,
    byStatus,
    deliveryRate: Number(deliveryRate),
    newLeads,
    optOuts,
    conversations,
    handoffs,
    textSummary: summary,
  });
}

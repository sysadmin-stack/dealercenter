import { db } from "@/lib/db";

interface VariantMetrics {
  sent: number;
  delivered: number;
  opened: number;
  replied: number;
}

interface ABResult {
  channel: string;
  segment: string;
  campaignId: string | null;
  winner: string | null;
  lift: number | null;
  reason: string;
  sampleSizeA: number;
  sampleSizeB: number;
  rateA: number;
  rateB: number;
}

const MIN_SAMPLE = 100;
const MIN_LIFT = 0.1; // 10%

function determineWinner(
  a: VariantMetrics,
  b: VariantMetrics,
): { winner: string | null; lift: number | null; reason: string } {
  if (a.sent < MIN_SAMPLE || b.sent < MIN_SAMPLE) {
    return { winner: null, lift: null, reason: "insufficient_data" };
  }

  // Reply rate is the primary metric (bottom of funnel)
  const aRate = a.replied / a.sent;
  const bRate = b.replied / b.sent;

  // If both are zero, check open rate instead
  if (aRate === 0 && bRate === 0) {
    const aOpen = a.opened / a.sent;
    const bOpen = b.opened / b.sent;
    if (aOpen === 0 && bOpen === 0) {
      return { winner: null, lift: null, reason: "no_engagement" };
    }
    const minOpen = Math.min(aOpen, bOpen);
    const openLift = minOpen > 0 ? Math.abs(aOpen - bOpen) / minOpen : 0;
    if (openLift < MIN_LIFT) {
      return { winner: null, lift: openLift, reason: "no_significant_difference" };
    }
    return {
      winner: aOpen > bOpen ? "A" : "B",
      lift: openLift,
      reason: "open_rate_winner",
    };
  }

  const minRate = Math.min(aRate, bRate);
  const lift = minRate > 0 ? Math.abs(aRate - bRate) / minRate : 0;

  if (lift < MIN_LIFT) {
    return { winner: null, lift, reason: "no_significant_difference" };
  }

  return {
    winner: aRate > bRate ? "A" : "B",
    lift,
    reason: "reply_rate_winner",
  };
}

/**
 * Run A/B analysis across all channels and segments.
 * Groups touch events by variant and compares performance.
 */
export async function analyzeAB(): Promise<ABResult[]> {
  const results: ABResult[] = [];

  // Get all sent events with variant info
  const sentEvents = await db.touchEvent.findMany({
    where: { eventType: "sent" },
    select: {
      touchId: true,
      payload: true,
      touch: {
        select: {
          channel: true,
          campaignId: true,
          lead: { select: { segment: true } },
        },
      },
    },
  });

  // Group by channel+segment → variant → metrics
  const groups: Record<
    string,
    { campaignId: string | null; A: VariantMetrics; B: VariantMetrics }
  > = {};

  for (const ev of sentEvents) {
    const payload = ev.payload as Record<string, string> | null;
    if (!payload?.variant) continue;

    const channel = ev.touch.channel;
    const segment = ev.touch.lead.segment;
    const key = `${channel}:${segment}`;

    if (!groups[key]) {
      groups[key] = {
        campaignId: ev.touch.campaignId,
        A: { sent: 0, delivered: 0, opened: 0, replied: 0 },
        B: { sent: 0, delivered: 0, opened: 0, replied: 0 },
      };
    }

    const variant = payload.variant === "A" ? "A" : "B";
    groups[key][variant].sent++;
  }

  // Now get delivery/open/reply events and map to variants
  const allTouchIds = sentEvents.map((e) => e.touchId);
  const followupEvents = await db.touchEvent.findMany({
    where: {
      touchId: { in: allTouchIds },
      eventType: { in: ["delivered", "opened", "replied"] },
    },
    select: { touchId: true, eventType: true },
  });

  // Build touchId → variant mapping
  const touchVariant: Record<string, string> = {};
  const touchGroup: Record<string, string> = {};
  for (const ev of sentEvents) {
    const payload = ev.payload as Record<string, string> | null;
    if (!payload?.variant) continue;
    touchVariant[ev.touchId] = payload.variant;
    touchGroup[ev.touchId] = `${ev.touch.channel}:${ev.touch.lead.segment}`;
  }

  for (const ev of followupEvents) {
    const variant = touchVariant[ev.touchId];
    const key = touchGroup[ev.touchId];
    if (!variant || !key || !groups[key]) continue;

    const v = variant === "A" ? "A" : "B";
    if (ev.eventType === "delivered") groups[key][v].delivered++;
    if (ev.eventType === "opened") groups[key][v].opened++;
    if (ev.eventType === "replied") groups[key][v].replied++;
  }

  // Analyze each group
  for (const [key, group] of Object.entries(groups)) {
    const [channel, segment] = key.split(":");
    const { winner, lift, reason } = determineWinner(group.A, group.B);

    const result: ABResult = {
      channel,
      segment,
      campaignId: group.campaignId,
      winner,
      lift,
      reason,
      sampleSizeA: group.A.sent,
      sampleSizeB: group.B.sent,
      rateA: group.A.sent > 0 ? group.A.replied / group.A.sent : 0,
      rateB: group.B.sent > 0 ? group.B.replied / group.B.sent : 0,
    };

    results.push(result);

    // Persist
    await db.abResult.create({ data: result });
  }

  console.log(`[Analytics] A/B analysis: ${results.length} groups analyzed`);
  return results;
}

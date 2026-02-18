import { db } from "@/lib/db";

interface CadenceSuggestionInput {
  segment: string;
  channel: string;
  suggestedHour: number;
  reason: string;
}

/**
 * Generate cadence adjustment suggestions based on Best Time data.
 * Does NOT apply automatically — saves as pending for admin approval.
 */
export async function generateSuggestions(): Promise<number> {
  // Get latest best times
  const bestTimes = await db.bestTime.findMany({
    orderBy: { calculatedAt: "desc" },
    distinct: ["channel", "segment"],
  });

  if (bestTimes.length === 0) {
    console.log("[Cadence] No best time data available for suggestions");
    return 0;
  }

  // Default sending hours per channel
  const defaultHours: Record<string, number> = {
    whatsapp: 10,
    email: 9,
    sms: 10,
  };

  const suggestions: CadenceSuggestionInput[] = [];

  for (const bt of bestTimes) {
    const currentHour = defaultHours[bt.channel] ?? 10;

    // Only suggest if best hour differs from current by 1+ hours
    if (Math.abs(bt.bestHour - currentHour) < 1) continue;

    // Only suggest if we have meaningful engagement data
    if (bt.engagementRate < 0.05 || bt.sampleSize < 100) continue;

    suggestions.push({
      segment: bt.segment,
      channel: bt.channel,
      suggestedHour: bt.bestHour,
      reason: `Best engagement rate ${(bt.engagementRate * 100).toFixed(1)}% at ${bt.bestHour}:00 ET (${bt.sampleSize} samples). Current: ${currentHour}:00.`,
    });
  }

  // Clear old pending suggestions for the same channel+segment
  for (const s of suggestions) {
    await db.cadenceSuggestion.updateMany({
      where: {
        channel: s.channel,
        segment: s.segment,
        status: "pending",
      },
      data: { status: "rejected" }, // superseded
    });

    await db.cadenceSuggestion.create({
      data: {
        segment: s.segment,
        channel: s.channel,
        suggestedHour: s.suggestedHour,
        currentHour: defaultHours[s.channel] ?? 10,
        reason: s.reason,
      },
    });
  }

  console.log(`[Cadence] Generated ${suggestions.length} suggestions`);
  return suggestions.length;
}

/**
 * Approve a cadence suggestion.
 */
export async function approveSuggestion(id: string): Promise<void> {
  await db.cadenceSuggestion.update({
    where: { id },
    data: { status: "approved" },
  });
  console.log(`[Cadence] Suggestion ${id} approved`);
}

/**
 * Reject a cadence suggestion.
 */
export async function rejectSuggestion(id: string): Promise<void> {
  await db.cadenceSuggestion.update({
    where: { id },
    data: { status: "rejected" },
  });
  console.log(`[Cadence] Suggestion ${id} rejected`);
}

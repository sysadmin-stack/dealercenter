import { db } from "@/lib/db";

const SUPER_HOT_TAG = "super_hot";
const SCORE_BONUS = 30;

/**
 * Identify and tag leads that have completed a credit application
 * but haven't purchased. These high-intent leads get a special tag
 * and score bonus for priority treatment.
 *
 * Returns the number of leads tagged.
 */
export async function tagSuperHotLeads(): Promise<number> {
  // Find eligible leads: credit app completed, not sold, not opted out
  const eligible = await db.lead.findMany({
    where: {
      creditApp: true,
      optedOut: false,
      AND: [
        { NOT: { status: "SOLD" } },
        { NOT: { tags: { has: SUPER_HOT_TAG } } },
      ],
    },
    select: { id: true, score: true },
  });

  if (eligible.length === 0) {
    console.log("[SuperHot] No new leads to tag");
    return 0;
  }

  // Tag each lead and add score bonus
  let tagged = 0;
  for (const lead of eligible) {
    await db.lead.update({
      where: { id: lead.id },
      data: {
        tags: { push: SUPER_HOT_TAG },
        score: lead.score + SCORE_BONUS,
      },
    });
    tagged++;
  }

  console.log(`[SuperHot] Tagged ${tagged} leads as super_hot (+${SCORE_BONUS} score)`);
  return tagged;
}

/**
 * Get count and breakdown of super_hot leads.
 */
export async function getSuperHotStats() {
  const [total, bySegment, contacted, replied, handoffs] = await Promise.all([
    db.lead.count({ where: { tags: { has: SUPER_HOT_TAG }, optedOut: false } }),
    db.lead.groupBy({
      by: ["segment"],
      where: { tags: { has: SUPER_HOT_TAG }, optedOut: false },
      _count: true,
    }),
    db.touch.count({
      where: {
        status: { in: ["sent", "delivered", "opened", "clicked", "replied"] },
        lead: { tags: { has: SUPER_HOT_TAG } },
      },
    }),
    db.touch.count({
      where: {
        status: "replied",
        lead: { tags: { has: SUPER_HOT_TAG } },
      },
    }),
    db.conversation.count({
      where: {
        status: "human",
        lead: { tags: { has: SUPER_HOT_TAG } },
      },
    }),
  ]);

  const segments: Record<string, number> = {};
  for (const s of bySegment) segments[s.segment] = s._count;

  return {
    total,
    segments,
    contacted,
    replied,
    handoffs,
    expectedConversion: Math.round(total * 0.209),
  };
}

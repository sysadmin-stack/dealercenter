import { db } from "@/lib/db";

interface TimeSlot {
  hour: number;
  dayOfWeek: number;
  engagements: number;
  total: number;
  rate: number;
}

interface BestTimeResult {
  channel: string;
  segment: string;
  bestHour: number;
  bestDayOfWeek: number;
  engagementRate: number;
  sampleSize: number;
}

const MIN_EVENTS_PER_SLOT = 50;

/**
 * Convert a UTC date to ET hour and day of week.
 */
function toET(date: Date): { hour: number; dayOfWeek: number } {
  const et = new Date(
    date.toLocaleString("en-US", { timeZone: "America/New_York" }),
  );
  return { hour: et.getHours(), dayOfWeek: et.getDay() };
}

/**
 * Detect best sending times by analyzing when engagement events occur.
 * Groups opened/replied events by hour and day of week.
 */
export async function detectBestTimes(): Promise<BestTimeResult[]> {
  const results: BestTimeResult[] = [];

  // Get all engagement events with their touch info
  const events = await db.touchEvent.findMany({
    where: { eventType: { in: ["opened", "replied"] } },
    select: {
      createdAt: true,
      touch: {
        select: {
          channel: true,
          lead: { select: { segment: true } },
        },
      },
    },
  });

  // Get total sent per channel+segment for rate calculation
  const sentEvents = await db.touchEvent.findMany({
    where: { eventType: "sent" },
    select: {
      createdAt: true,
      touch: {
        select: {
          channel: true,
          lead: { select: { segment: true } },
        },
      },
    },
  });

  // Group by channel+segment → hour slots
  const engagementSlots: Record<string, Record<string, number>> = {};
  const sentSlots: Record<string, Record<string, number>> = {};

  for (const ev of events) {
    const key = `${ev.touch.channel}:${ev.touch.lead.segment}`;
    const { hour, dayOfWeek } = toET(ev.createdAt);
    const slotKey = `${dayOfWeek}:${hour}`;

    if (!engagementSlots[key]) engagementSlots[key] = {};
    engagementSlots[key][slotKey] = (engagementSlots[key][slotKey] || 0) + 1;
  }

  for (const ev of sentEvents) {
    const key = `${ev.touch.channel}:${ev.touch.lead.segment}`;
    const { hour, dayOfWeek } = toET(ev.createdAt);
    const slotKey = `${dayOfWeek}:${hour}`;

    if (!sentSlots[key]) sentSlots[key] = {};
    sentSlots[key][slotKey] = (sentSlots[key][slotKey] || 0) + 1;
  }

  // Find best slot per channel+segment
  for (const [key, slots] of Object.entries(engagementSlots)) {
    const [channel, segment] = key.split(":");
    const sent = sentSlots[key] || {};

    let bestSlot: TimeSlot | null = null;
    let totalSample = 0;

    for (const [slotKey, engagements] of Object.entries(slots)) {
      const [dStr, hStr] = slotKey.split(":");
      const dayOfWeek = parseInt(dStr);
      const hour = parseInt(hStr);
      const total = sent[slotKey] || engagements;
      totalSample += total;

      if (total < MIN_EVENTS_PER_SLOT) continue;

      const rate = engagements / total;
      if (!bestSlot || rate > bestSlot.rate) {
        bestSlot = { hour, dayOfWeek, engagements, total, rate };
      }
    }

    if (bestSlot) {
      const result: BestTimeResult = {
        channel,
        segment,
        bestHour: bestSlot.hour,
        bestDayOfWeek: bestSlot.dayOfWeek,
        engagementRate: Math.round(bestSlot.rate * 1000) / 1000,
        sampleSize: totalSample,
      };

      results.push(result);

      // Persist
      await db.bestTime.create({ data: result });
    }
  }

  console.log(`[Analytics] Best times: ${results.length} slots detected`);
  return results;
}

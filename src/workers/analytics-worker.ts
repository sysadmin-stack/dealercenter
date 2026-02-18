import { Worker, Queue, Job } from "bullmq";
import IORedis from "bullmq/node_modules/ioredis";
import { db } from "./utils";

// Worker-local imports (relative paths, no @/ aliases)
// These services use @/lib/db, but we run analytics in the app context via API
// For the worker, we implement the logic directly using the worker db instance.

interface AnalyticsJobData {
  type: "daily" | "weekly";
}

async function runDailyAnalysis() {
  console.log("[Analytics] Starting daily analysis...");

  // 1. A/B Analysis
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

  const groups: Record<
    string,
    {
      campaignId: string | null;
      A: { sent: number; replied: number; opened: number };
      B: { sent: number; replied: number; opened: number };
    }
  > = {};

  const touchVariant: Record<string, string> = {};
  const touchGroup: Record<string, string> = {};

  for (const ev of sentEvents) {
    const payload = ev.payload as Record<string, string> | null;
    if (!payload?.variant) continue;

    const channel = ev.touch.channel;
    const segment = ev.touch.lead.segment;
    const key = `${channel}:${segment}`;

    if (!groups[key]) {
      groups[key] = {
        campaignId: ev.touch.campaignId,
        A: { sent: 0, replied: 0, opened: 0 },
        B: { sent: 0, replied: 0, opened: 0 },
      };
    }

    const v = payload.variant === "A" ? "A" : "B";
    groups[key][v].sent++;
    touchVariant[ev.touchId] = payload.variant;
    touchGroup[ev.touchId] = key;
  }

  // Get followup events
  const allTouchIds = sentEvents.map((e) => e.touchId);
  if (allTouchIds.length > 0) {
    const followups = await db.touchEvent.findMany({
      where: {
        touchId: { in: allTouchIds },
        eventType: { in: ["opened", "replied"] },
      },
      select: { touchId: true, eventType: true },
    });

    for (const ev of followups) {
      const variant = touchVariant[ev.touchId];
      const key = touchGroup[ev.touchId];
      if (!variant || !key || !groups[key]) continue;
      const v = variant === "A" ? "A" : "B";
      if (ev.eventType === "opened") groups[key][v].opened++;
      if (ev.eventType === "replied") groups[key][v].replied++;
    }
  }

  let abCount = 0;
  for (const [key, group] of Object.entries(groups)) {
    const [channel, segment] = key.split(":");
    const aRate = group.A.sent > 0 ? group.A.replied / group.A.sent : 0;
    const bRate = group.B.sent > 0 ? group.B.replied / group.B.sent : 0;

    let winner: string | null = null;
    let lift: number | null = null;
    let reason = "insufficient_data";

    if (group.A.sent >= 100 && group.B.sent >= 100) {
      const minRate = Math.min(aRate, bRate);
      lift = minRate > 0 ? Math.abs(aRate - bRate) / minRate : 0;
      if (lift >= 0.1) {
        winner = aRate > bRate ? "A" : "B";
        reason = "reply_rate_winner";
      } else {
        reason = "no_significant_difference";
      }
    }

    await db.abResult.create({
      data: {
        campaignId: group.campaignId,
        channel,
        segment,
        winner,
        lift,
        sampleSizeA: group.A.sent,
        sampleSizeB: group.B.sent,
        rateA: aRate,
        rateB: bRate,
        reason,
      },
    });
    abCount++;
  }

  console.log(`[Analytics] A/B: ${abCount} groups analyzed`);

  // 2. Best Time Detection
  const engagementEvents = await db.touchEvent.findMany({
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

  const slots: Record<string, Record<string, number>> = {};

  for (const ev of engagementEvents) {
    const et = new Date(
      ev.createdAt.toLocaleString("en-US", { timeZone: "America/New_York" }),
    );
    const key = `${ev.touch.channel}:${ev.touch.lead.segment}`;
    const hour = et.getHours();
    const dow = et.getDay();
    const slotKey = `${dow}:${hour}`;

    if (!slots[key]) slots[key] = {};
    slots[key][slotKey] = (slots[key][slotKey] || 0) + 1;
  }

  let btCount = 0;
  for (const [key, slotMap] of Object.entries(slots)) {
    const [channel, segment] = key.split(":");
    let bestSlot: { hour: number; dow: number; count: number } | null = null;
    let total = 0;

    for (const [slotKey, count] of Object.entries(slotMap)) {
      total += count;
      if (count < 50) continue;
      if (!bestSlot || count > bestSlot.count) {
        const [d, h] = slotKey.split(":");
        bestSlot = { hour: parseInt(h), dow: parseInt(d), count };
      }
    }

    if (bestSlot && total > 0) {
      await db.bestTime.create({
        data: {
          channel,
          segment,
          bestHour: bestSlot.hour,
          bestDayOfWeek: bestSlot.dow,
          engagementRate: Math.round((bestSlot.count / total) * 1000) / 1000,
          sampleSize: total,
        },
      });
      btCount++;
    }
  }

  console.log(`[Analytics] Best times: ${btCount} slots detected`);

  // 3. Generate cadence suggestions
  const bestTimes = await db.bestTime.findMany({
    orderBy: { calculatedAt: "desc" },
    distinct: ["channel", "segment"],
  });

  const defaultHours: Record<string, number> = {
    whatsapp: 10,
    email: 9,
    sms: 10,
  };

  let sugCount = 0;
  for (const bt of bestTimes) {
    const currentHour = defaultHours[bt.channel] ?? 10;
    if (Math.abs(bt.bestHour - currentHour) < 1) continue;
    if (bt.engagementRate < 0.05 || bt.sampleSize < 100) continue;

    // Supersede old pending suggestions
    await db.cadenceSuggestion.updateMany({
      where: { channel: bt.channel, segment: bt.segment, status: "pending" },
      data: { status: "rejected" },
    });

    await db.cadenceSuggestion.create({
      data: {
        segment: bt.segment,
        channel: bt.channel,
        suggestedHour: bt.bestHour,
        currentHour,
        reason: `Best engagement ${(bt.engagementRate * 100).toFixed(1)}% at ${bt.bestHour}:00 ET (${bt.sampleSize} samples)`,
      },
    });
    sugCount++;
  }

  console.log(`[Analytics] Cadence suggestions: ${sugCount} generated`);
  console.log("[Analytics] Daily analysis complete.");
}

async function processAnalytics(job: Job<AnalyticsJobData>) {
  if (job.data.type === "daily") {
    await runDailyAnalysis();
  }
  // Weekly insights are triggered via the app's API (needs Claude client with @/ imports)
}

export function createAnalyticsWorker(connection: IORedis) {
  const worker = new Worker<AnalyticsJobData>("analytics", processAnalytics, {
    connection,
    concurrency: 1,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  });

  worker.on("completed", (job) => {
    console.log(`[Analytics] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Analytics] Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}

/**
 * Schedule recurring analytics jobs.
 */
export async function scheduleAnalyticsJobs(connection: IORedis) {
  const queue = new Queue("analytics", { connection });

  // Daily analysis at 2:00 AM ET
  await queue.upsertJobScheduler(
    "daily-analysis",
    { pattern: "0 2 * * *", tz: "America/New_York" },
    { name: "daily-analysis", data: { type: "daily" } },
  );

  console.log("[Analytics] Scheduled: daily analysis at 2:00 AM ET");
}

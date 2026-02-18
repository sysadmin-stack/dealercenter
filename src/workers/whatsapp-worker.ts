import { Worker, Job } from "bullmq";
import IORedis from "bullmq/node_modules/ioredis";
import { db, getWindowDelay, TokenBucket, dncPreFlight } from "./utils";
import { sendWhatsApp } from "../lib/clients/waha";
import { generateMessage } from "../lib/services/copywriter";

interface TouchJobData {
  touchId: string;
  leadId: string;
  campaignId: string;
  channel: string;
  templateType: string;
  scheduledAt: string;
}

// Rate limit: 10/min (conservative first week)
const rateLimiter = new TokenBucket(10, 10 / 60);

async function processWhatsApp(job: Job<TouchJobData>) {
  const { touchId, leadId, templateType } = job.data;

  // 1. Check time window: 8h-20h ET
  const delay = getWindowDelay(8, 20);
  if (delay > 0) {
    // Reschedule outside window
    await job.moveToDelayed(Date.now() + delay);
    return;
  }

  // 2. Check touch hasn't already been sent (dedup)
  const touch = await db.touch.findUnique({ where: { id: touchId } });
  if (!touch || touch.status !== "pending") {
    return; // Already processed or cancelled
  }

  // 3. DNC pre-flight check
  const dnc = await dncPreFlight(leadId, "whatsapp");
  if (!dnc.allowed) {
    await db.touch.update({
      where: { id: touchId },
      data: { status: "failed" },
    });
    console.log(`[WA] Blocked by DNC: ${dnc.reason} for lead ${leadId}`);
    return;
  }

  // 4. Get lead
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || !lead.phone) return;

  // 5. Rate limit
  await rateLimiter.take();

  // 6. Generate message (AI with fallback)
  const { text, variant, source } = await generateMessage(lead, "whatsapp", templateType);

  // 7. Send via WAHA
  try {
    await sendWhatsApp(lead.phone, text);

    await db.touch.update({
      where: { id: touchId },
      data: { status: "sent", sentAt: new Date(), content: text },
    });

    await db.touchEvent.create({
      data: { touchId, eventType: "sent", payload: { channel: "whatsapp", variant, source } },
    });

    console.log(`[WA] Sent to ${lead.name} (${lead.phone})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[WA] Failed for ${lead.name}: ${message}`);

    // Let BullMQ retry via backoff
    throw err;
  }
}

export function createWhatsAppWorker(connection: IORedis) {
  const worker = new Worker<TouchJobData>("whatsapp", processWhatsApp, {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  });

  worker.on("completed", (job) => {
    console.log(`[WA] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[WA] Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}

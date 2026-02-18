import { Worker, Job } from "bullmq";
import IORedis from "bullmq/node_modules/ioredis";
import Twilio from "twilio";
import { db, getWindowDelay, TokenBucket, dncPreFlight } from "./utils";
import { generateMessage } from "../lib/services/copywriter";

interface TouchJobData {
  touchId: string;
  leadId: string;
  campaignId: string;
  channel: string;
  templateType: string;
  scheduledAt: string;
}

let _twilioClient: ReturnType<typeof Twilio> | null = null;
function getTwilio() {
  if (!_twilioClient) {
    _twilioClient = Twilio(
      process.env.TWILIO_ACCOUNT_SID || "placeholder",
      process.env.TWILIO_AUTH_TOKEN || "placeholder",
    );
  }
  return _twilioClient;
}
const twilioFrom = process.env.TWILIO_PHONE_NUMBER || "";

// Rate limit: 1/sec (long code throughput)
const rateLimiter = new TokenBucket(1, 1);

async function processSms(job: Job<TouchJobData>) {
  const { touchId, leadId, templateType } = job.data;

  // 1. TCPA window: 9h-20h ET
  const delay = getWindowDelay(9, 20);
  if (delay > 0) {
    await job.moveToDelayed(Date.now() + delay);
    return;
  }

  // 2. Check touch hasn't already been sent
  const touch = await db.touch.findUnique({ where: { id: touchId } });
  if (!touch || touch.status !== "pending") return;

  // 3. DNC pre-flight check
  const dnc = await dncPreFlight(leadId, "sms");
  if (!dnc.allowed) {
    await db.touch.update({
      where: { id: touchId },
      data: { status: "failed" },
    });
    console.log(`[SMS] Blocked by DNC: ${dnc.reason} for lead ${leadId}`);
    return;
  }

  // 4. Get lead
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || !lead.phone) return;

  // 5. Rate limit
  await rateLimiter.take();

  // 6. Generate message (AI with fallback)
  const { text, variant, source } = await generateMessage(lead, "sms", templateType);

  // 7. Send via Twilio
  try {
    await getTwilio().messages.create({
      to: lead.phone,
      from: twilioFrom,
      body: text,
    });

    await db.touch.update({
      where: { id: touchId },
      data: { status: "sent", sentAt: new Date(), content: text },
    });

    await db.touchEvent.create({
      data: { touchId, eventType: "sent", payload: { channel: "sms", variant, source } },
    });

    console.log(`[SMS] Sent to ${lead.name} (${lead.phone})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[SMS] Failed for ${lead.name}: ${message}`);
    throw err;
  }
}

export function createSmsWorker(connection: IORedis) {
  const worker = new Worker<TouchJobData>("sms", processSms, {
    connection,
    concurrency: 3,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  });

  worker.on("completed", (job) => {
    console.log(`[SMS] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[SMS] Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}

import { Worker, Job } from "bullmq";
import IORedis from "bullmq/node_modules/ioredis";
import { Resend } from "resend";
import { db, TokenBucket } from "./utils";
import { generateMessage } from "../lib/services/message-content";

interface TouchJobData {
  touchId: string;
  leadId: string;
  campaignId: string;
  channel: string;
  templateType: string;
  scheduledAt: string;
}

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
  return _resend;
}
const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@floridautocenter.com";

// Rate limit: 10 req/s
const rateLimiter = new TokenBucket(10, 10);

async function processEmail(job: Job<TouchJobData>) {
  const { touchId, leadId, campaignId, templateType } = job.data;

  // 1. Check touch hasn't already been sent
  const touch = await db.touch.findUnique({ where: { id: touchId } });
  if (!touch || touch.status !== "pending") return;

  // 2. Get lead
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || !lead.email || lead.optedOut) {
    await db.touch.update({
      where: { id: touchId },
      data: { status: "failed" },
    });
    return;
  }

  // 3. Rate limit
  await rateLimiter.take();

  // 4. Generate message
  const { subject, text, html } = generateMessage(lead, "email", templateType);

  // 5. Send via Resend
  try {
    await getResend().emails.send({
      from: fromEmail,
      to: lead.email,
      subject: subject || "Florida Auto Center",
      text,
      html,
      tags: [
        { name: "campaign", value: campaignId },
        { name: "lead", value: leadId },
      ],
    });

    await db.touch.update({
      where: { id: touchId },
      data: { status: "sent", sentAt: new Date(), content: text },
    });

    await db.touchEvent.create({
      data: { touchId, eventType: "sent", payload: { channel: "email" } },
    });

    console.log(`[Email] Sent to ${lead.name} (${lead.email})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Email] Failed for ${lead.name}: ${message}`);
    throw err;
  }
}

export function createEmailWorker(connection: IORedis) {
  const worker = new Worker<TouchJobData>("email", processEmail, {
    connection,
    concurrency: 10,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  });

  worker.on("completed", (job) => {
    console.log(`[Email] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Email] Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}

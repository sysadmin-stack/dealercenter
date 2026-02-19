import { Worker, Job } from "bullmq";
import IORedis from "bullmq/node_modules/ioredis";
import { Resend } from "resend";
import { db, TokenBucket, dncPreFlight } from "./utils";
import { generateMessage } from "../lib/services/copywriter";
import { getSetting, DEFAULTS } from "../lib/config/settings";

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

// Rate limit: 10 req/s
const rateLimiter = new TokenBucket(10, 10);

async function processEmail(job: Job<TouchJobData>) {
  const { touchId, leadId, campaignId, templateType } = job.data;

  // 1. Check touch hasn't already been sent
  const touch = await db.touch.findUnique({ where: { id: touchId } });
  if (!touch || touch.status !== "pending") return;

  // 2. DNC pre-flight check
  const dnc = await dncPreFlight(leadId, "email");
  if (!dnc.allowed) {
    await db.touch.update({
      where: { id: touchId },
      data: { status: "failed" },
    });
    console.log(`[Email] Blocked by DNC: ${dnc.reason} for lead ${leadId}`);
    return;
  }

  // 3. Get lead
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || !lead.email) return;

  // 4. Rate limit
  await rateLimiter.take();

  // 5. Generate message (AI with fallback)
  const { subject, text, html, variant, source } = await generateMessage(lead, "email", templateType);

  // 6. Read email sender config from DB
  const resendConfig = await getSetting("integration.resend", DEFAULTS["integration.resend"]);
  const identity = await getSetting("dealer.identity", DEFAULTS["dealer.identity"]);
  const fromAddress = `${resendConfig.fromName} <${resendConfig.fromEmail}>`;

  // 7. Send via Resend
  try {
    await getResend().emails.send({
      from: fromAddress,
      to: lead.email,
      subject: subject || identity.name,
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
      data: { touchId, eventType: "sent", payload: { channel: "email", variant, source } },
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

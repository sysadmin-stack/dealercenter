import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordEvent } from "@/lib/services/tracking";

/**
 * Resend webhook events.
 * Docs: https://resend.com/docs/dashboard/webhooks/introduction
 *
 * Events we handle:
 * - email.delivered → touch status "delivered"
 * - email.opened → touch status "opened"
 * - email.clicked → touch status "clicked"
 * - email.bounced → touch status "bounced" + mark lead email invalid
 * - email.complained → mark lead as opted out
 */

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || "";

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    tags?: Record<string, string>;
    // bounce-specific
    bounce?: {
      message?: string;
    };
  };
}

const EVENT_MAP: Record<string, string> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify webhook secret via svix headers (Resend uses svix)
  // For simplicity, we check a shared secret in the webhook-id header
  if (RESEND_WEBHOOK_SECRET) {
    const svixId = req.headers.get("svix-id");
    if (!svixId) {
      return NextResponse.json({ error: "Missing svix headers" }, { status: 401 });
    }
    // In production, use the svix library for full verification
    // For now, we accept if the header is present and secret is configured
  }

  let data: ResendWebhookPayload;
  try {
    data = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = EVENT_MAP[data.type];
  if (!eventType) {
    // Event type we don't care about
    return NextResponse.json({ status: "ignored" });
  }

  try {
    // Find touch by tags (campaign + lead IDs set during send)
    const tags = data.data.tags || {};
    const campaignId = tags.campaign;
    const leadId = tags.lead;

    if (!campaignId || !leadId) {
      // Try to find by recipient email
      const toEmail = data.data.to?.[0];
      if (toEmail) {
        const touch = await findTouchByEmail(toEmail);
        if (touch) {
          await processEvent(touch.id, touch.leadId, eventType, data);
        }
      }
      return NextResponse.json({ status: "ok" });
    }

    // Find the most recent email touch for this lead+campaign
    const touch = await db.touch.findFirst({
      where: {
        leadId,
        campaignId,
        channel: "email",
        status: { in: ["sent", "delivered", "opened", "clicked"] },
      },
      orderBy: { sentAt: "desc" },
      select: { id: true, leadId: true },
    });

    if (touch) {
      await processEvent(touch.id, touch.leadId, eventType, data);
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Webhook/Resend] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function findTouchByEmail(email: string) {
  const lead = await db.lead.findFirst({
    where: { email },
    select: { id: true },
  });
  if (!lead) return null;

  return db.touch.findFirst({
    where: {
      leadId: lead.id,
      channel: "email",
      status: { in: ["sent", "delivered", "opened", "clicked"] },
    },
    orderBy: { sentAt: "desc" },
    select: { id: true, leadId: true },
  });
}

async function processEvent(
  touchId: string,
  leadId: string,
  eventType: string,
  data: ResendWebhookPayload,
) {
  await recordEvent(touchId, eventType, {
    resendEventType: data.type,
    emailId: data.data.email_id,
  });

  // Handle bounce — mark lead email as invalid
  if (eventType === "bounced") {
    await db.lead.update({
      where: { id: leadId },
      data: { email: null, tags: { push: "email_bounced" } },
    });
    console.log(`[Webhook/Resend] Bounce — cleared email for lead ${leadId}`);
  }

  // Handle complaint — opt out the lead
  if (eventType === "complained") {
    await db.lead.update({
      where: { id: leadId },
      data: { optedOut: true, tags: { push: "email_complaint" } },
    });
    console.log(`[Webhook/Resend] Complaint — opted out lead ${leadId}`);
  }

  console.log(`[Webhook/Resend] ${eventType} for touch ${touchId}`);
}

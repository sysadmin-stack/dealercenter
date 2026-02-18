import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { recordEvent, findTouchByPhone } from "@/lib/services/tracking";
import { handleIncomingMessage } from "@/lib/services/conversation-trigger";

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";

/**
 * Verify Twilio request signature.
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null,
): boolean {
  if (!TWILIO_AUTH_TOKEN) return true; // No token — skip verification
  if (!signature) return false;

  // Build the data string: URL + sorted params
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  const expected = createHmac("sha1", TWILIO_AUTH_TOKEN)
    .update(data)
    .digest("base64");

  return signature === expected;
}

function normalizePhone(phone: string): string {
  // Twilio sends +1XXXXXXXXXX format already
  if (phone.startsWith("+")) return phone;
  return `+${phone}`;
}

/**
 * Twilio SMS webhook handler.
 * Handles two types of callbacks:
 * 1. Status callbacks (delivery reports) — from our outgoing messages
 * 2. Incoming messages — when a lead replies or texts STOP
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });

  // Verify Twilio signature
  const signature = req.headers.get("x-twilio-signature");
  const url = req.url;
  if (!verifyTwilioSignature(url, params, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    // Determine if this is a status callback or incoming message
    const messageSid = params.MessageSid || params.SmsSid;
    const messageStatus = params.MessageStatus || params.SmsStatus;
    const from = params.From;
    const to = params.To;
    const body = params.Body;

    // ─── Status callback (delivery report) ───
    if (messageStatus && !body) {
      const phone = normalizePhone(to || "");
      const touchId = await findTouchByPhone(phone, "sms");

      if (touchId) {
        const eventMap: Record<string, string> = {
          delivered: "delivered",
          sent: "sent",
          failed: "failed",
          undelivered: "failed",
        };

        const eventType = eventMap[messageStatus];
        if (eventType) {
          await recordEvent(touchId, eventType, {
            messageSid,
            twilioStatus: messageStatus,
            errorCode: params.ErrorCode,
          });
          console.log(`[Webhook/Twilio] ${messageStatus} for touch ${touchId}`);
        }
      }

      return new NextResponse("", { status: 204 });
    }

    // ─── Incoming message from lead ───
    if (from && body) {
      const phone = normalizePhone(from);
      const text = body.trim();

      // Check for STOP/opt-out keywords
      const optOutKeywords = ["stop", "parar", "unsubscribe", "cancel", "quit"];
      if (optOutKeywords.includes(text.toLowerCase())) {
        await handleOptOut(phone);

        // Respond with confirmation (TwiML)
        const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been unsubscribed. Reply START to re-subscribe.</Message></Response>`;
        return new NextResponse(twiml, {
          status: 200,
          headers: { "Content-Type": "text/xml" },
        });
      }

      // Handle as incoming conversation message
      await handleIncomingMessage({
        leadPhone: phone,
        channel: "sms",
        text,
        externalId: messageSid,
      });

      // Empty TwiML response (no auto-reply)
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { status: 200, headers: { "Content-Type": "text/xml" } },
      );
    }

    return new NextResponse("", { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Webhook/Twilio] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleOptOut(phone: string): Promise<void> {
  const lead = await db.lead.findFirst({
    where: {
      OR: [{ phone }, { phoneSecondary: phone }],
    },
  });

  if (!lead) {
    console.log(`[Webhook/Twilio] STOP from unknown phone: ${phone}`);
    return;
  }

  // Mark as opted out
  await db.lead.update({
    where: { id: lead.id },
    data: { optedOut: true, tags: { push: "sms_stop" } },
  });

  // Create DNC entry
  await db.dncList.create({
    data: {
      leadId: lead.id,
      reason: "SMS STOP received",
    },
  });

  // Cancel any pending touches for this lead
  const pendingTouches = await db.touch.updateMany({
    where: { leadId: lead.id, status: "pending" },
    data: { status: "failed" },
  });

  console.log(
    `[Webhook/Twilio] STOP from ${lead.name} (${phone}) — opted out, cancelled ${pendingTouches.count} pending touches`,
  );
}

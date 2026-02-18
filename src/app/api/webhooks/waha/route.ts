import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { recordEvent, findTouchByPhone } from "@/lib/services/tracking";
import { handleIncomingMessage } from "@/lib/services/conversation-trigger";
import { processConversation } from "@/lib/services/conversation-service";

const WAHA_WEBHOOK_SECRET = process.env.WAHA_WEBHOOK_SECRET || "";

// Dedup: track processed webhook IDs (in-memory, cleared on restart)
const processedIds = new Set<string>();
const MAX_DEDUP_SIZE = 10_000;

function verifySignature(body: string, signature: string | null): boolean {
  if (!WAHA_WEBHOOK_SECRET) return true; // No secret configured — skip verification
  if (!signature) return false;

  const expected = createHmac("sha256", WAHA_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  return signature === expected;
}

function normalizePhone(chatId: string): string {
  // Convert 14075774133@c.us → +14075774133
  const num = chatId.replace(/@.*$/, "");
  return num.startsWith("+") ? num : `+${num}`;
}

interface WahaWebhookPayload {
  event: string;
  session: string;
  payload: {
    id?: string;
    from?: string;
    to?: string;
    body?: string;
    timestamp?: number;
    ack?: number; // 0=error, 1=pending, 2=server, 3=device, 4=read
    ackName?: string;
    fromMe?: boolean;
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // 1. Verify HMAC signature
  const signature = req.headers.get("x-waha-signature");
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let data: WahaWebhookPayload;
  try {
    data = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, payload } = data;
  const webhookId = payload.id;

  // 2. Dedup check
  if (webhookId && processedIds.has(webhookId)) {
    return NextResponse.json({ status: "duplicate" });
  }
  if (webhookId) {
    processedIds.add(webhookId);
    // Prevent memory leak
    if (processedIds.size > MAX_DEDUP_SIZE) {
      const first = processedIds.values().next().value;
      if (first) processedIds.delete(first);
    }
  }

  try {
    switch (event) {
      case "message": {
        // Incoming message from lead (not from us)
        if (payload.fromMe) break;
        if (!payload.from || !payload.body) break;

        const phone = normalizePhone(payload.from);

        // Record message and get/create conversation
        const conversationId = await handleIncomingMessage({
          leadPhone: phone,
          channel: "whatsapp",
          text: payload.body,
          externalId: webhookId,
          timestamp: payload.timestamp
            ? new Date(payload.timestamp * 1000)
            : undefined,
        });

        // Trigger AI conversation handler (non-blocking)
        if (conversationId) {
          processConversation(conversationId, phone, payload.body).catch(
            (err) =>
              console.error(
                `[Webhook/WAHA] Conversation processing failed: ${err}`,
              ),
          );
        }

        break;
      }

      case "message.ack": {
        // Delivery/read acknowledgment for our outgoing messages
        if (!payload.to) break;

        const phone = normalizePhone(payload.to);
        const touchId = await findTouchByPhone(phone, "whatsapp");
        if (!touchId) break;

        // ack levels: 2=server, 3=device(delivered), 4=read(opened)
        if (payload.ack && payload.ack >= 3) {
          await recordEvent(touchId, "delivered", {
            ack: payload.ack,
            ackName: payload.ackName,
          });
        }
        if (payload.ack && payload.ack >= 4) {
          await recordEvent(touchId, "opened", {
            ack: payload.ack,
            ackName: payload.ackName,
          });
        }

        break;
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Webhook/WAHA] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

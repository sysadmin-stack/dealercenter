import { NextRequest, NextResponse } from "next/server";
import { processConversation } from "@/lib/services/conversation-service";
import { handleIncomingMessage } from "@/lib/services/conversation-trigger";

const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || "";

/**
 * N8N-triggered conversation endpoint.
 * Alternative to direct WAHA webhook → conversation flow.
 * Allows N8N to orchestrate additional logic before/after conversation processing.
 *
 * POST /api/n8n/conversation
 * Body: { phone, text, channel?, externalId? }
 */
export async function POST(req: NextRequest) {
  // Verify secret
  if (N8N_WEBHOOK_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${N8N_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: {
    phone: string;
    text: string;
    channel?: string;
    externalId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.phone || !body.text) {
    return NextResponse.json(
      { error: "Missing required fields: phone, text" },
      { status: 400 },
    );
  }

  const channel = (body.channel === "sms" ? "sms" : "whatsapp") as "whatsapp" | "sms";

  try {
    // 1. Record the incoming message and get/create conversation
    const conversationId = await handleIncomingMessage({
      leadPhone: body.phone,
      channel,
      text: body.text,
      externalId: body.externalId,
    });

    if (!conversationId) {
      return NextResponse.json(
        { error: "Lead not found for phone number" },
        { status: 404 },
      );
    }

    // 2. Process with AI conversation service
    await processConversation(conversationId, body.phone, body.text);

    return NextResponse.json({
      status: "ok",
      conversationId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[N8N/Conversation] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

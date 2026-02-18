import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/clients/waha";

const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || "";
const SALES_REP_PHONE = process.env.SALES_REP_PHONE || "";

/**
 * POST /api/n8n/handoff
 * Called by N8N when a handoff is created (alternative to direct notification).
 * Sends a WhatsApp notification to the sales rep.
 *
 * Body: { leadName, leadPhone, reason, segment, score, conversationId, chatwootUrl? }
 */
export async function POST(req: NextRequest) {
  if (N8N_WEBHOOK_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${N8N_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: {
    leadName: string;
    leadPhone?: string;
    reason: string;
    segment?: string;
    score?: number;
    conversationId?: string;
    chatwootUrl?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.leadName || !body.reason) {
    return NextResponse.json(
      { error: "Missing required fields: leadName, reason" },
      { status: 400 },
    );
  }

  // Build notification message
  const lines = [
    `Lead handoff: ${body.leadName}`,
    `Reason: ${body.reason}`,
  ];

  if (body.segment || body.score) {
    lines.push(
      `${body.segment ? `Segment: ${body.segment}` : ""}${body.score ? ` | Score: ${body.score}` : ""}`.trim(),
    );
  }

  if (body.leadPhone) lines.push(`Phone: ${body.leadPhone}`);
  if (body.chatwootUrl) lines.push(`Chatwoot: ${body.chatwootUrl}`);

  const message = lines.join("\n");

  // Send to sales rep
  const targetPhone = SALES_REP_PHONE;
  if (!targetPhone) {
    return NextResponse.json(
      { error: "SALES_REP_PHONE not configured" },
      { status: 500 },
    );
  }

  try {
    await sendWhatsApp(targetPhone, message);

    return NextResponse.json({
      status: "ok",
      notifiedPhone: targetPhone,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[N8N/Handoff] Failed to send notification: ${errMsg}`);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

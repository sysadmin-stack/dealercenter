import type { Lead, Channel } from "@/generated/prisma/client";
import * as chatwoot from "@/lib/clients/chatwoot";
import { sendWhatsApp } from "@/lib/clients/waha";

const SALES_REP_PHONE = process.env.SALES_REP_PHONE || "";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

interface ConversationMessage {
  role: "lead" | "assistant";
  text: string;
  timestamp: string;
}

interface HandoffParams {
  lead: Lead;
  conversationId: string;
  channel: Channel;
  messages: ConversationMessage[];
  reason: string;
}

/**
 * Hand off a conversation to a human agent via Chatwoot.
 * Creates contact + conversation with full history, assigns agent, notifies sales rep.
 */
export async function handoffToHuman(params: HandoffParams): Promise<void> {
  const { lead, conversationId, channel, messages, reason } = params;

  try {
    // 1. Create or find contact in Chatwoot
    const contact = await chatwoot.createContact({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
    });

    // 2. Create conversation
    const conversation = await chatwoot.createConversation(contact.id);

    // 3. Replay message history
    for (const msg of messages) {
      const messageType = msg.role === "lead" ? 0 : 1; // 0=incoming, 1=outgoing
      await chatwoot.sendMessage(
        conversation.id,
        msg.text,
        messageType as 0 | 1,
      );
    }

    // 4. Add private note with context
    const noteLines = [
      `**Handoff from AI Agent**`,
      `Reason: ${reason}`,
      `Channel: ${channel}`,
      `Segment: ${lead.segment}`,
      `Language: ${lead.language}`,
      `Score: ${lead.score}`,
      lead.creditApp ? "Has credit application on file" : "",
      lead.source ? `Source: ${lead.source}` : "",
      `Internal conversation ID: ${conversationId}`,
    ].filter(Boolean);

    await chatwoot.addNote(conversation.id, noteLines.join("\n"));

    console.log(
      `[Handoff] Created Chatwoot conversation #${conversation.id} for ${lead.name}`,
    );

    // 5. Notify sales rep via WhatsApp
    if (SALES_REP_PHONE) {
      const firstName = lead.name.split(" ")[0];
      const notifText = [
        `New lead handoff: ${firstName}`,
        `Reason: ${reason}`,
        `Segment: ${lead.segment} | Score: ${lead.score}`,
        lead.phone ? `Phone: ${lead.phone}` : "",
        `Chatwoot: ${APP_URL}`,
      ]
        .filter(Boolean)
        .join("\n");

      try {
        await sendWhatsApp(SALES_REP_PHONE, notifText);
        console.log(`[Handoff] Notified sales rep at ${SALES_REP_PHONE}`);
      } catch (err) {
        console.error(`[Handoff] Failed to notify sales rep: ${err}`);
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Handoff] Chatwoot handoff failed: ${errMsg}`);

    // Fallback: notify sales rep directly even if Chatwoot fails
    if (SALES_REP_PHONE) {
      const fallbackText = [
        `URGENT: Lead handoff failed (Chatwoot down)`,
        `Lead: ${lead.name}`,
        `Phone: ${lead.phone || "N/A"}`,
        `Reason: ${reason}`,
        `Please follow up manually.`,
      ].join("\n");

      try {
        await sendWhatsApp(SALES_REP_PHONE, fallbackText);
      } catch {
        // Last resort failed — logged above
      }
    }

    throw err;
  }
}

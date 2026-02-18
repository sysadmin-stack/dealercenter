import { db } from "@/lib/db";
import type { Conversation, Lead } from "@/generated/prisma/client";
import { generateWithClaude } from "@/lib/clients/claude";
import { buildConversationSystemPrompt } from "@/lib/prompts/copywriter";
import { sendWhatsApp } from "@/lib/clients/waha";
import { isOptOutMessage, processOptOut } from "./optout-service";
import { handoffToHuman } from "./handoff-service";

interface ConversationMessage {
  role: "lead" | "assistant";
  text: string;
  timestamp: string;
  externalId?: string;
}

const MAX_AI_EXCHANGES = 5;

/**
 * Process an incoming message from a lead and generate an AI response.
 * Handles opt-out detection, AI response generation, and handoff triggers.
 */
export async function processConversation(
  conversationId: string,
  leadPhone: string,
  incomingText: string,
): Promise<void> {
  // 1. Load conversation with lead
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: { lead: true },
  });

  if (!conversation || !conversation.lead) {
    console.error(`[ConvoService] Conversation ${conversationId} not found`);
    return;
  }

  const lead = conversation.lead;
  const messages = (conversation.messages as unknown as ConversationMessage[]) || [];

  // 2. Check opt-out
  if (isOptOutMessage(incomingText)) {
    await processOptOut(leadPhone, conversation.channel);
    return;
  }

  // 3. If conversation is already handed off to human, don't respond
  if (conversation.status === "human" || conversation.status === "closed") {
    console.log(`[ConvoService] Conversation ${conversationId} is ${conversation.status}, skipping AI`);
    return;
  }

  // 4. Check exchange count — auto-escalate after MAX_AI_EXCHANGES
  const aiExchanges = messages.filter((m) => m.role === "assistant").length;
  if (aiExchanges >= MAX_AI_EXCHANGES) {
    console.log(`[ConvoService] Max AI exchanges reached, escalating`);
    await escalateToHuman(conversation, lead, "Max AI exchanges reached");
    return;
  }

  // 5. Generate AI response
  try {
    const systemPrompt = buildConversationSystemPrompt(lead.language);
    const userPrompt = buildConversationHistory(messages, lead);

    const { text: aiResponse } = await generateWithClaude(systemPrompt, userPrompt, {
      maxTokens: 256,
      temperature: 0.7,
    });

    // 6. Check for escalation trigger
    if (aiResponse.includes("[ESCALATE]")) {
      const cleanResponse = aiResponse.replace("[ESCALATE]", "").trim();

      // Send the response before escalating
      if (cleanResponse && lead.phone) {
        await sendWhatsApp(lead.phone, cleanResponse);
        appendMessage(messages, "assistant", cleanResponse);
      }

      await escalateToHuman(conversation, lead, "AI detected escalation trigger");
      return;
    }

    // 7. Send AI response via WhatsApp
    if (lead.phone) {
      await sendWhatsApp(lead.phone, aiResponse);
    }

    // 8. Save response to conversation
    appendMessage(messages, "assistant", aiResponse);
    await db.conversation.update({
      where: { id: conversationId },
      data: { messages: messages as unknown as string },
    });

    console.log(`[ConvoService] AI replied to ${lead.name} in conversation ${conversationId}`);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[ConvoService] AI generation failed: ${errMsg}`);

    // On AI failure, escalate to human
    await escalateToHuman(conversation, lead, `AI error: ${errMsg}`);
  }
}

function appendMessage(
  messages: ConversationMessage[],
  role: "lead" | "assistant",
  text: string,
): void {
  messages.push({
    role,
    text,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Build conversation history as a Claude-compatible user prompt.
 */
function buildConversationHistory(
  messages: ConversationMessage[],
  lead: Lead,
): string {
  const firstName = lead.name.split(" ")[0];
  const parts: string[] = [
    `Customer name: ${firstName}`,
    `Segment: ${lead.segment}`,
    `Language: ${lead.language}`,
    "",
    "Conversation history:",
  ];

  for (const msg of messages) {
    const label = msg.role === "lead" ? firstName : "You (assistant)";
    parts.push(`${label}: ${msg.text}`);
  }

  parts.push("", "Respond to the customer's latest message.");

  return parts.join("\n");
}

/**
 * Escalate conversation to a human agent.
 */
async function escalateToHuman(
  conversation: Conversation,
  lead: Lead,
  reason: string,
): Promise<void> {
  // 1. Update conversation status
  await db.conversation.update({
    where: { id: conversation.id },
    data: { status: "human" },
  });

  // 2. Trigger handoff to Chatwoot
  const messages = (conversation.messages as unknown as ConversationMessage[]) || [];

  try {
    await handoffToHuman({
      lead,
      conversationId: conversation.id,
      channel: conversation.channel,
      messages,
      reason,
    });
  } catch (err) {
    console.error(`[ConvoService] Handoff failed: ${err}`);
  }

  console.log(
    `[ConvoService] Escalated conversation ${conversation.id} for ${lead.name}: ${reason}`,
  );
}

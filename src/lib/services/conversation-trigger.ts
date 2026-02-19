import { db } from "@/lib/db";
import type { Channel } from "@/generated/prisma/client";
import { cancelPendingTouchesForLead } from "./touch-scheduler";

interface IncomingMessage {
  leadPhone: string;
  channel: Channel;
  text: string;
  externalId?: string;
  timestamp?: Date;
}

/**
 * Handle an incoming message from a lead.
 * Finds or creates a conversation and appends the message.
 * Returns the conversation ID if found/created.
 */
export async function handleIncomingMessage(
  msg: IncomingMessage,
): Promise<string | null> {
  // 1. Find lead by phone
  const lead = await db.lead.findFirst({
    where: {
      OR: [{ phone: msg.leadPhone }, { phoneSecondary: msg.leadPhone }],
      optedOut: false,
    },
    select: { id: true, name: true },
  });

  if (!lead) {
    console.log(`[ConvoTrigger] Unknown phone: ${msg.leadPhone}`);
    return null;
  }

  // 2. Find or create conversation
  let conversation = await db.conversation.findFirst({
    where: {
      leadId: lead.id,
      channel: msg.channel,
      status: { in: ["ai", "human"] },
    },
    orderBy: { updatedAt: "desc" },
  });

  const messageEntry = {
    role: "lead" as const,
    text: msg.text,
    externalId: msg.externalId,
    timestamp: (msg.timestamp ?? new Date()).toISOString(),
  };

  if (conversation) {
    // Append message to existing conversation
    const messages = (conversation.messages as unknown[]) || [];
    messages.push(messageEntry);

    await db.conversation.update({
      where: { id: conversation.id },
      data: { messages: messages as unknown as string },
    });

    console.log(
      `[ConvoTrigger] Appended to conversation ${conversation.id} for ${lead.name}`,
    );
  } else {
    // Create new conversation
    conversation = await db.conversation.create({
      data: {
        leadId: lead.id,
        channel: msg.channel,
        status: "ai",
        messages: [messageEntry] as unknown as string,
      },
    });

    console.log(
      `[ConvoTrigger] New conversation ${conversation.id} for ${lead.name}`,
    );
  }

  // 3. Mark the most recent touch as "replied"
  const recentTouch = await db.touch.findFirst({
    where: {
      leadId: lead.id,
      channel: msg.channel,
      status: { in: ["sent", "delivered", "opened", "clicked"] },
    },
    orderBy: { sentAt: "desc" },
    select: { id: true },
  });

  if (recentTouch) {
    await db.touch.update({
      where: { id: recentTouch.id },
      data: { status: "replied" },
    });

    await db.touchEvent.create({
      data: {
        touchId: recentTouch.id,
        eventType: "replied",
        payload: { conversationId: conversation.id },
      },
    });
  }

  // 4. Cancel ALL pending touches for this lead (all campaigns, all channels).
  //    When a lead responds, the cadence should stop — continuing to send
  //    automated messages while a conversation is active feels spammy.
  const cancelled = await cancelPendingTouchesForLead(lead.id);
  if (cancelled > 0) {
    console.log(
      `[ConvoTrigger] Cancelled ${cancelled} pending touches for ${lead.name} (lead responded)`,
    );
  }

  return conversation.id;
}

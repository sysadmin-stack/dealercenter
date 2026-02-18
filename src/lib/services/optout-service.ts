import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/clients/waha";
import type { Channel, Language } from "@/generated/prisma/client";

/**
 * Multilingual opt-out keyword detection.
 */
const OPT_OUT_PATTERNS: RegExp[] = [
  // English
  /\b(stop|unsubscribe|opt.?out|remove me|don'?t contact|no more)\b/i,
  // Portuguese
  /\b(parar|não quero|nao quero|chega|sair|cancelar|remover)\b/i,
  // Spanish
  /\b(parar|no quiero|salir|cancelar|detener|remover)\b/i,
];

/**
 * Check if a message contains opt-out intent.
 */
export function isOptOutMessage(text: string): boolean {
  return OPT_OUT_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Opt-out confirmation messages by language.
 */
const OPT_OUT_RESPONSES: Record<Language, string> = {
  EN: "You've been unsubscribed from Florida Auto Center messages. If you change your mind, just text us back anytime. Have a great day!",
  PT: "Voce foi removido das mensagens da Florida Auto Center. Se mudar de ideia, e so nos mandar uma mensagem. Tenha um otimo dia!",
  ES: "Has sido eliminado de los mensajes de Florida Auto Center. Si cambias de opinion, solo envianos un mensaje. Que tengas un buen dia!",
};

/**
 * Process an opt-out request from a lead.
 * Marks lead as opted out, creates DNC entry, cancels pending touches,
 * closes active conversations, and sends confirmation.
 */
export async function processOptOut(
  leadPhone: string,
  channel: Channel,
): Promise<boolean> {
  // 1. Find lead
  const lead = await db.lead.findFirst({
    where: {
      OR: [{ phone: leadPhone }, { phoneSecondary: leadPhone }],
    },
  });

  if (!lead) {
    console.log(`[OptOut] Unknown phone: ${leadPhone}`);
    return false;
  }

  if (lead.optedOut) {
    console.log(`[OptOut] Already opted out: ${lead.name}`);
    return true;
  }

  // 2. Mark as opted out
  await db.lead.update({
    where: { id: lead.id },
    data: {
      optedOut: true,
      tags: { push: `${channel}_optout` },
    },
  });

  // 3. Create DNC entry
  await db.dncList.create({
    data: {
      leadId: lead.id,
      reason: `Opt-out via ${channel}`,
    },
  });

  // 4. Cancel pending touches
  const cancelled = await db.touch.updateMany({
    where: { leadId: lead.id, status: "pending" },
    data: { status: "failed" },
  });

  // 5. Close active conversations
  await db.conversation.updateMany({
    where: {
      leadId: lead.id,
      status: { in: ["ai", "human"] },
    },
    data: { status: "closed" },
  });

  // 6. Send confirmation message
  const confirmText = OPT_OUT_RESPONSES[lead.language] ?? OPT_OUT_RESPONSES.EN;

  if (channel === "whatsapp" && lead.phone) {
    try {
      await sendWhatsApp(lead.phone, confirmText);
    } catch (err) {
      console.error(`[OptOut] Failed to send confirmation: ${err}`);
    }
  }

  console.log(
    `[OptOut] ${lead.name} opted out via ${channel}. Cancelled ${cancelled.count} pending touches.`,
  );

  return true;
}

import type { Channel, Language, Segment } from "@/generated/prisma/client";

const LANGUAGE_NAMES: Record<Language, string> = {
  EN: "English",
  PT: "Brazilian Portuguese",
  ES: "Spanish",
};

const SEGMENT_CONTEXT: Record<Segment | "NURTURE", string> = {
  HOT: "This lead visited recently (< 90 days). They are likely still in buying mode. Be enthusiastic and action-oriented.",
  WARM: "This lead visited 3-12 months ago. They may still be interested but need a gentle reminder. Be warm and helpful.",
  COLD: "This lead visited 1-2 years ago. They need re-engagement. Focus on what's new and different.",
  FROZEN: "This lead visited over 2 years ago. This is a long-shot reactivation. Be brief and low-pressure.",
  NURTURE: "This lead completed their initial cadence without responding. This is a long-term nurture touch. Be very low-pressure, informational, and never pushy. Keep the door open.",
};

const CHANNEL_RULES: Record<Channel, string> = {
  whatsapp: `
- Keep it conversational and friendly, like texting a friend
- Max 300 characters
- No formal greetings like "Dear" — use "Hi" or "Hey"
- One clear question or call-to-action
- Do NOT use emojis excessively (max 1)
- Do NOT include any links
- Sign off with "- Antonio, Florida Auto Center" only if it's the first message`,
  email: `
- Professional but warm tone
- Subject line: max 60 characters, compelling, personalized
- Body: 3-5 short paragraphs
- Include a clear call-to-action
- Sign off as "Antonio Sanches, Florida Auto Center"
- Return JSON with "subject", "text", and "html" fields
- The HTML should be simple inline-styled HTML (no external CSS)`,
  sms: `
- Max 160 characters (single SMS segment)
- Very concise and direct
- Always end with "Reply STOP to opt out" (EN) / "Responda PARAR para cancelar" (PT/ES)
- No emojis
- No links`,
};

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  personal_intro:
    "First contact. Introduce yourself personally and ask about their car needs.",
  stock_offer:
    "Share excitement about new inventory. Create curiosity about specific vehicles.",
  short_followup:
    "Quick check-in. Keep it brief and low-pressure.",
  quick_checkin:
    "Ultra-brief check-in. Very low pressure, just a quick hello to stay on their radar. One sentence max for SMS.",
  last_touch:
    "Final message in the sequence. Leave the door open without being pushy.",
  last_touch_email:
    "Final email in the sequence. Acknowledge you don't want to overwhelm their inbox. Leave the door wide open, express genuine goodwill, no pressure at all.",
  value_message:
    "Share something valuable (tip, info, offer) without directly selling.",
  value_proposition:
    "Highlight why buying from us is a great choice. Mention free CARFAX, flexible financing, no-pressure experience, quality vehicles. Make them feel confident about choosing us.",
  pattern_break:
    "Something unexpected that stands out. Acknowledge the process is stressful.",
  reintroduction:
    "Re-introduce yourself after time has passed. Reference their previous visit.",
  social_proof:
    "Share customer satisfaction, reviews, or success stories.",
  special_offer:
    "Mention a limited-time deal or incentive.",
  financing_options:
    "Share excitement about flexible financing options. Mention we work with multiple lenders, options for all credit levels. Make financing feel accessible and stress-free.",
  inventory_update:
    "New vehicles just arrived that might interest them. Create curiosity about fresh inventory without being pushy. Offer to share specific options.",
  new_arrivals:
    "Showcase the latest additions to our inventory. Focus on variety, fresh options, and great deals on new stock.",
  newsletter:
    "Monthly update with what's new. Informational, not salesy.",
  single_reactivation:
    "One-shot attempt to re-engage a very old lead. Brief and intriguing.",
  long_time_reconnect:
    "It's been a very long time since last contact. Gentle reconnection acknowledging the time gap. Mention what's changed (new inventory, better options). Very low pressure.",
  // ─── Super Hot ───
  super_hot_intro:
    "First contact for a high-intent lead. Create excitement about new inventory opportunities. Do NOT mention credit applications or past visits. Make it feel like a fresh, exclusive opportunity.",
  super_hot_offer:
    "Email with special/exclusive offer framing. Focus on new arrivals, limited-time financing, or reserved vehicles. Never mention previous interactions. Tone: exclusive and time-sensitive.",
  super_hot_sms:
    "Brief SMS with urgency. Mention exclusive conditions available for a limited time. Ask them to reply for details. Never reference past history.",
  super_hot_human_touch:
    "Warm, personal follow-up. Mention wanting to personally help them find the right vehicle. Offer to call or schedule a visit. This is the last automated message before human contact.",
  // ─── Nurture ───
  nurture_new_inventory:
    "Long-term nurture: inform about new inventory additions. No pressure, just keeping them in the loop. Informational and friendly tone.",
  nurture_market_update:
    "Long-term nurture: share auto market trends or news. Position as helpful information, not a sales pitch. Make them feel informed.",
  nurture_checkin:
    "Long-term nurture: very brief quarterly check-in via SMS. Just a friendly hello, reminding we're here. Ultra low-pressure.",
  nurture_seasonal:
    "Long-term nurture: seasonal promotion or special. Tie to the time of year (holidays, tax season, summer, etc). Low-key mention of deals.",
  nurture_reconnect:
    "Long-term nurture: semi-annual reconnection. Friendly, warm tone. Mention that inventory changes regularly. No urgency, just maintaining the relationship.",
  nurture_annual:
    "Long-term nurture: annual check-in. It's been a long time — express genuine warmth. Brief, friendly, leave the door open for whenever they're ready.",
};

interface CopywriterPromptInput {
  leadName: string;
  channel: Channel;
  language: Language;
  segment: Segment;
  templateType: string;
  variant: "A" | "B";
  source?: string | null;
  creditApp?: boolean;
}

/**
 * Build the system prompt for the copywriter.
 */
export function buildSystemPrompt(input: CopywriterPromptInput): string {
  const lang = LANGUAGE_NAMES[input.language];
  const channelRules = CHANNEL_RULES[input.channel];
  const segmentCtx = SEGMENT_CONTEXT[input.segment] ?? SEGMENT_CONTEXT.COLD;

  return `You are a copywriter for Florida Auto Center, a used car dealership in Orlando, FL.

Your job is to write a single ${input.channel} message for a lead.

IMPORTANT RULES:
- Write in ${lang}
- ${segmentCtx}
${channelRules}

DEALERSHIP INFO:
- Name: Florida Auto Center
- Location: Orlando, FL
- Specialty: Quality used vehicles, flexible financing, no-pressure experience
- Salesperson: Antonio Sanches

COMPLIANCE:
- Never make promises about specific prices or financing terms
- Never mention competitor dealerships
- Never use ALL CAPS for emphasis
- For SMS, always include opt-out language

OUTPUT FORMAT:
${input.channel === "email" ? 'Return ONLY valid JSON: {"subject": "...", "text": "...", "html": "..."}' : "Return ONLY the message text, nothing else. No quotes, no labels, no explanation."}`;
}

/**
 * Build the user prompt for the copywriter.
 */
export function buildUserPrompt(input: CopywriterPromptInput): string {
  const templateDesc =
    TEMPLATE_DESCRIPTIONS[input.templateType] ?? "General outreach message.";

  const parts = [
    `Lead name: ${input.leadName}`,
    `Message type: ${input.templateType} — ${templateDesc}`,
    `Variant: ${input.variant} (${input.variant === "A" ? "more direct and action-oriented" : "more casual and relationship-focused"})`,
  ];

  if (input.source) parts.push(`Lead source: ${input.source}`);
  if (input.creditApp) parts.push("Note: This lead has a credit application on file.");

  return parts.join("\n");
}

/**
 * System prompt for the conversational AI agent (Plan 008).
 */
export function buildConversationSystemPrompt(language: Language): string {
  const lang = LANGUAGE_NAMES[language];

  return `You are a helpful sales assistant for Florida Auto Center, a used car dealership in Orlando, FL.

You are chatting with a customer who has responded to a marketing message.

RULES:
- Respond in ${lang}
- Be friendly, helpful, and conversational
- Answer questions about inventory, financing, and the buying process
- If asked about specific prices, say you'll check and get back to them
- Try to schedule an appointment or test drive
- If the customer seems frustrated or wants to talk to a human, say you'll connect them with Antonio
- Never make up vehicle details — say you'll check availability
- Keep responses concise (2-3 sentences max)

ESCALATION TRIGGERS (respond with "[ESCALATE]" prefix):
- Customer explicitly asks for a human
- Customer is angry or frustrated
- Customer asks about trade-in values
- Customer wants to negotiate price
- Conversation goes beyond 5 exchanges`;
}

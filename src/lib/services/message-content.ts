import type { Lead, Channel } from "@/generated/prisma/client";

interface MessageContent {
  subject?: string; // email only
  text: string;
  html?: string; // email only
}

/**
 * Stub message generator. Will be replaced by AI Copywriter (Plan 006).
 * Generates simple template-based messages per channel and template type.
 */
export function generateMessage(
  lead: Lead,
  channel: Channel,
  templateType: string,
): MessageContent {
  const firstName = lead.name.split(" ")[0];
  const name =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  switch (channel) {
    case "whatsapp":
      return { text: whatsappTemplate(name, templateType) };
    case "email":
      return emailTemplate(name, templateType);
    case "sms":
      return { text: smsTemplate(name, templateType) };
  }
}

function whatsappTemplate(name: string, templateType: string): string {
  switch (templateType) {
    case "personal_intro":
      return `Hi ${name}! This is Antonio from Florida Auto Center. I noticed you were looking at our inventory recently. Is there a specific vehicle you're interested in? I'd love to help you find the perfect car! 🚗`;
    case "stock_offer":
      return `Hey ${name}, we just got some amazing new arrivals! Would you like me to send you some options that match what you're looking for?`;
    case "short_followup":
      return `Hi ${name}, just checking in! Still looking for a car? Let me know if I can help. - Antonio, Florida Auto Center`;
    case "last_touch":
      return `${name}, I don't want to bother you, but wanted to make sure you know we're here whenever you're ready. Feel free to reach out anytime! 🙌`;
    case "value_message":
      return `Hi ${name}! Quick tip: we offer free CARFAX reports on all our vehicles and flexible financing options. Let me know if you'd like to explore your options!`;
    case "pattern_break":
      return `${name}, I know car shopping can be stressful. We pride ourselves on a no-pressure experience. When you're ready, I'm here to help. 😊`;
    case "single_reactivation":
      return `Hi ${name}! It's been a while since we connected. We have some great deals right now. Interested in taking a look?`;
    default:
      return `Hi ${name}, this is Florida Auto Center. We'd love to help you find your next car! Reply to chat with us.`;
  }
}

function emailTemplate(
  name: string,
  templateType: string,
): MessageContent {
  switch (templateType) {
    case "stock_offer":
      return {
        subject: `${name}, check out our latest inventory!`,
        text: `Hi ${name},\n\nWe have some exciting new vehicles in stock that might be perfect for you.\n\nVisit us at Florida Auto Center or reply to this email to learn more.\n\nBest,\nAntonio Sanches\nFlorida Auto Center`,
        html: `<p>Hi ${name},</p><p>We have some exciting new vehicles in stock that might be perfect for you.</p><p>Visit us at <strong>Florida Auto Center</strong> or reply to this email to learn more.</p><p>Best,<br>Antonio Sanches<br>Florida Auto Center</p>`,
      };
    case "reintroduction":
      return {
        subject: `${name}, we'd love to reconnect!`,
        text: `Hi ${name},\n\nIt's been a while since we last spoke. We have new inventory and great financing options available.\n\nLet us know if we can help!\n\nBest,\nAntonio Sanches\nFlorida Auto Center`,
        html: `<p>Hi ${name},</p><p>It's been a while since we last spoke. We have new inventory and great financing options available.</p><p>Let us know if we can help!</p><p>Best,<br>Antonio Sanches<br>Florida Auto Center</p>`,
      };
    case "social_proof":
      return {
        subject: `See why customers love Florida Auto Center`,
        text: `Hi ${name},\n\nOur customers love the experience at Florida Auto Center. Join hundreds of happy car owners!\n\nReply to get started.\n\nBest,\nAntonio Sanches`,
        html: `<p>Hi ${name},</p><p>Our customers love the experience at Florida Auto Center. Join hundreds of happy car owners!</p><p>Reply to get started.</p><p>Best,<br>Antonio Sanches</p>`,
      };
    case "special_offer":
      return {
        subject: `${name}, special offer just for you!`,
        text: `Hi ${name},\n\nWe have a limited-time offer that might interest you. Contact us to learn more!\n\nBest,\nAntonio Sanches\nFlorida Auto Center`,
        html: `<p>Hi ${name},</p><p>We have a <strong>limited-time offer</strong> that might interest you. Contact us to learn more!</p><p>Best,<br>Antonio Sanches<br>Florida Auto Center</p>`,
      };
    case "newsletter":
      return {
        subject: `Florida Auto Center — Monthly Update`,
        text: `Hi ${name},\n\nHere's what's new at Florida Auto Center this month.\n\nNew arrivals, financing specials, and more!\n\nBest,\nFlorida Auto Center`,
        html: `<p>Hi ${name},</p><p>Here's what's new at Florida Auto Center this month.</p><p>New arrivals, financing specials, and more!</p><p>Best,<br>Florida Auto Center</p>`,
      };
    default:
      return {
        subject: `Florida Auto Center — We're here to help!`,
        text: `Hi ${name},\n\nWe'd love to help you find your next car. Reply to get started.\n\nBest,\nFlorida Auto Center`,
        html: `<p>Hi ${name},</p><p>We'd love to help you find your next car. Reply to get started.</p><p>Best,<br>Florida Auto Center</p>`,
      };
  }
}

function smsTemplate(name: string, templateType: string): string {
  switch (templateType) {
    case "short_followup":
      return `Hi ${name}, still looking for a car? Florida Auto Center has great options. Reply STOP to opt out.`;
    case "last_touch":
      return `${name}, we're here when you're ready! Florida Auto Center - Reply STOP to opt out.`;
    default:
      return `Hi ${name}, Florida Auto Center here. We'd love to help you find your next car! Reply STOP to opt out.`;
  }
}

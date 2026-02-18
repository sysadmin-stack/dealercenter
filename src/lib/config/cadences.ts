import type { Channel, Segment } from "@/generated/prisma/client";

export interface CadenceStep {
  day: number;
  channel: Channel | "task";
  hour: number;
  templateType: string;
}

/**
 * Super HOT cadence for leads with credit app completed.
 * More aggressive (3 days) with faster human escalation.
 */
export const SUPER_HOT_CADENCE: CadenceStep[] = [
  { day: 0, channel: "whatsapp", hour: 9, templateType: "super_hot_intro" },
  { day: 0, channel: "email", hour: 14, templateType: "super_hot_offer" },
  { day: 1, channel: "sms", hour: 10, templateType: "super_hot_sms" },
  { day: 3, channel: "whatsapp", hour: 10, templateType: "super_hot_human_touch" },
  { day: 3, channel: "task", hour: 10, templateType: "assign_to_rep" },
];

export const CADENCES: Record<Segment, CadenceStep[]> = {
  HOT: [
    { day: 0, channel: "whatsapp", hour: 9, templateType: "personal_intro" },
    { day: 0, channel: "email", hour: 14, templateType: "stock_offer" },
    { day: 2, channel: "sms", hour: 10, templateType: "short_followup" },
    { day: 6, channel: "whatsapp", hour: 10, templateType: "last_touch" },
  ],
  WARM: [
    { day: 0, channel: "email", hour: 9, templateType: "reintroduction" },
    { day: 3, channel: "whatsapp", hour: 10, templateType: "value_message" },
    { day: 9, channel: "email", hour: 9, templateType: "social_proof" },
    { day: 20, channel: "sms", hour: 10, templateType: "last_touch" },
  ],
  COLD: [
    { day: 0, channel: "email", hour: 9, templateType: "reintroduction" },
    { day: 6, channel: "whatsapp", hour: 10, templateType: "pattern_break" },
    { day: 19, channel: "email", hour: 9, templateType: "special_offer" },
  ],
  FROZEN: [
    { day: 0, channel: "email", hour: 9, templateType: "newsletter" },
    {
      day: 7,
      channel: "whatsapp",
      hour: 10,
      templateType: "single_reactivation",
    },
  ],
};

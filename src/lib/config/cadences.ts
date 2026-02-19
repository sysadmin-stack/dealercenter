import type { Channel, Segment } from "@/generated/prisma/client";
import { getSetting } from "@/lib/config/settings";

export interface CadenceStep {
  day: number;
  channel: Channel | "task";
  hour: number;
  templateType: string;
}

/**
 * Super HOT cadence for leads with credit app / walk-in recente.
 * 5 touches in 3 days — aggressive with fast human escalation.
 */
export const SUPER_HOT_CADENCE: CadenceStep[] = [
  { day: 0, channel: "whatsapp", hour: 9, templateType: "super_hot_intro" },
  { day: 0, channel: "email", hour: 14, templateType: "super_hot_offer" },
  { day: 1, channel: "sms", hour: 10, templateType: "super_hot_sms" },
  { day: 3, channel: "whatsapp", hour: 10, templateType: "super_hot_human_touch" },
  { day: 3, channel: "task", hour: 10, templateType: "assign_to_rep" },
];

/**
 * Segment-based cadences aligned with automotive industry best practices.
 *
 * HOT  (< 90 days):   10 touches in 30 days
 * WARM (90-365 days):   7 touches in 45 days
 * COLD (365-730 days):  5 touches in 75 days
 * FROZEN (730+ days):   3 touches in 90 days
 */
export const CADENCES: Record<Segment, CadenceStep[]> = {
  HOT: [
    { day: 0, channel: "whatsapp", hour: 9, templateType: "personal_intro" },
    { day: 0, channel: "email", hour: 14, templateType: "stock_offer" },
    { day: 1, channel: "sms", hour: 10, templateType: "quick_checkin" },
    { day: 3, channel: "whatsapp", hour: 9, templateType: "value_proposition" },
    { day: 5, channel: "email", hour: 14, templateType: "financing_options" },
    { day: 7, channel: "sms", hour: 10, templateType: "short_followup" },
    { day: 10, channel: "email", hour: 9, templateType: "social_proof" },
    { day: 14, channel: "whatsapp", hour: 10, templateType: "inventory_update" },
    { day: 21, channel: "email", hour: 9, templateType: "special_offer" },
    { day: 30, channel: "whatsapp", hour: 10, templateType: "last_touch" },
  ],
  WARM: [
    { day: 0, channel: "email", hour: 9, templateType: "reintroduction" },
    { day: 3, channel: "whatsapp", hour: 10, templateType: "value_message" },
    { day: 7, channel: "email", hour: 14, templateType: "new_arrivals" },
    { day: 14, channel: "sms", hour: 10, templateType: "short_followup" },
    { day: 21, channel: "email", hour: 9, templateType: "social_proof" },
    { day: 30, channel: "whatsapp", hour: 10, templateType: "pattern_break" },
    { day: 45, channel: "email", hour: 9, templateType: "last_touch_email" },
  ],
  COLD: [
    { day: 0, channel: "email", hour: 9, templateType: "reintroduction" },
    { day: 7, channel: "whatsapp", hour: 10, templateType: "pattern_break" },
    { day: 21, channel: "email", hour: 9, templateType: "special_offer" },
    { day: 45, channel: "sms", hour: 10, templateType: "short_followup" },
    { day: 75, channel: "email", hour: 9, templateType: "last_touch_email" },
  ],
  FROZEN: [
    { day: 0, channel: "email", hour: 9, templateType: "newsletter" },
    { day: 30, channel: "whatsapp", hour: 10, templateType: "single_reactivation" },
    { day: 90, channel: "email", hour: 9, templateType: "long_time_reconnect" },
  ],
};

/**
 * NURTURE cadence — post-cadence drip for leads that completed their
 * initial cadence without responding. Low-pressure, long-term.
 * 6 touches over 360 days (roughly monthly → quarterly → semi-annual).
 */
export const NURTURE_CADENCE: CadenceStep[] = [
  { day: 0, channel: "email", hour: 9, templateType: "nurture_new_inventory" },
  { day: 30, channel: "email", hour: 9, templateType: "nurture_market_update" },
  { day: 60, channel: "sms", hour: 10, templateType: "nurture_checkin" },
  { day: 90, channel: "email", hour: 9, templateType: "nurture_seasonal" },
  { day: 180, channel: "email", hour: 9, templateType: "nurture_reconnect" },
  { day: 360, channel: "email", hour: 9, templateType: "nurture_annual" },
];

// ─── Dynamic getters (read from DB, fallback to hardcoded) ─

/**
 * Get cadence for a segment from DB, falling back to hardcoded constants.
 */
export async function getCadence(segment: Segment): Promise<CadenceStep[]> {
  return getSetting(`cadence.${segment}`, CADENCES[segment] ?? CADENCES.COLD);
}

/**
 * Get SUPER_HOT cadence from DB.
 */
export async function getSuperHotCadence(): Promise<CadenceStep[]> {
  return getSetting("cadence.SUPER_HOT", SUPER_HOT_CADENCE);
}

/**
 * Get NURTURE cadence from DB.
 */
export async function getNurtureCadence(): Promise<CadenceStep[]> {
  return getSetting("cadence.NURTURE", NURTURE_CADENCE);
}

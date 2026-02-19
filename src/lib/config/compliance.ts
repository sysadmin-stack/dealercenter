/**
 * Florida compliance rules for telephone solicitation.
 *
 * Florida Telephone Solicitation Act is more restrictive than federal TCPA:
 * - Federal allows calls until 9 PM; Florida restricts to 8 PM.
 * - We add a 15-minute buffer on both ends for safety.
 */

import { getSetting, DEFAULTS } from "@/lib/config/settings";

export const COMPLIANCE = {
  // Florida Telephone Solicitation Act (with safety buffers)
  sendWindow: {
    startHour: 8,
    startMinute: 15,
    endHour: 19,
    endMinute: 45,
    timezone: "America/New_York",
  },

  // Frequency caps to avoid over-contacting
  frequencyCaps: {
    perChannelPerWeek: 3,
    totalPerDay: 2,
    totalPerWeek: 7,
    minHoursBetweenSameChannel: 24,
  },

  // Opt-out language (required for SMS)
  smsOptOutText: {
    EN: "Reply STOP to opt out",
    PT: "Responda PARAR para cancelar",
    ES: "Responde PARAR para cancelar",
  },
} as const;

// ─── Dynamic getters ──────────────────────────────────────

interface SendWindow {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  timezone: string;
}

interface FrequencyCaps {
  perChannelPerWeek: number;
  totalPerDay: number;
  totalPerWeek: number;
  minHoursBetweenSameChannel: number;
}

export async function getSendWindow(): Promise<SendWindow> {
  return getSetting("compliance.sendWindow", DEFAULTS["compliance.sendWindow"]);
}

export async function getFrequencyCaps(): Promise<FrequencyCaps> {
  return getSetting("compliance.frequencyCaps", DEFAULTS["compliance.frequencyCaps"]);
}

// ─── Time functions ───────────────────────────────────────

/**
 * Get the current hour and minute in the configured timezone from a Date.
 */
function getTimeInZone(date: Date, timezone: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  return {
    hour: parseInt(parts.find((p) => p.type === "hour")!.value, 10),
    minute: parseInt(parts.find((p) => p.type === "minute")!.value, 10),
  };
}

/**
 * Check whether a given date/time falls within the send window.
 * Uses static COMPLIANCE constant (sync) — for backward compat.
 */
export function isWithinSendWindow(date: Date): boolean {
  const { startHour, startMinute, endHour, endMinute, timezone } =
    COMPLIANCE.sendWindow;
  const { hour, minute } = getTimeInZone(date, timezone);

  const timeInMinutes = hour * 60 + minute;
  const startInMinutes = startHour * 60 + startMinute;
  const endInMinutes = endHour * 60 + endMinute;

  return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
}

/**
 * Adjust a scheduled date to the next valid send window if it falls outside.
 * Uses static COMPLIANCE constant (sync) — for backward compat.
 */
export function adjustToSendWindow(date: Date): Date {
  if (isWithinSendWindow(date)) return date;

  const { startHour, startMinute, endHour, endMinute, timezone } =
    COMPLIANCE.sendWindow;
  const { hour, minute } = getTimeInZone(date, timezone);

  const timeInMinutes = hour * 60 + minute;
  const endInMinutes = endHour * 60 + endMinute;
  const startInMinutes = startHour * 60 + startMinute;

  const adjusted = new Date(date);

  if (timeInMinutes > endInMinutes) {
    // Past today's window — move to start of tomorrow's window
    const diffMinutes = (24 * 60 - timeInMinutes) + startInMinutes;
    adjusted.setTime(adjusted.getTime() + diffMinutes * 60_000);
  } else {
    // Before today's window — move forward to window start
    const diffMinutes = startInMinutes - timeInMinutes;
    adjusted.setTime(adjusted.getTime() + diffMinutes * 60_000);
  }

  // Zero out seconds/ms
  adjusted.setSeconds(0, 0);
  return adjusted;
}

/**
 * Async version that reads send window from DB.
 */
export async function adjustToSendWindowAsync(date: Date): Promise<Date> {
  const sw = await getSendWindow();
  const { hour, minute } = getTimeInZone(date, sw.timezone);

  const timeInMinutes = hour * 60 + minute;
  const startInMinutes = sw.startHour * 60 + sw.startMinute;
  const endInMinutes = sw.endHour * 60 + sw.endMinute;

  if (timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes) {
    return date;
  }

  const adjusted = new Date(date);

  if (timeInMinutes > endInMinutes) {
    const diffMinutes = (24 * 60 - timeInMinutes) + startInMinutes;
    adjusted.setTime(adjusted.getTime() + diffMinutes * 60_000);
  } else {
    const diffMinutes = startInMinutes - timeInMinutes;
    adjusted.setTime(adjusted.getTime() + diffMinutes * 60_000);
  }

  adjusted.setSeconds(0, 0);
  return adjusted;
}

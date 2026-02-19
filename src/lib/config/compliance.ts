/**
 * Florida compliance rules for telephone solicitation.
 *
 * Florida Telephone Solicitation Act is more restrictive than federal TCPA:
 * - Federal allows calls until 9 PM; Florida restricts to 8 PM.
 * - We add a 15-minute buffer on both ends for safety.
 */

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

/**
 * Get the current hour and minute in Eastern Time from a Date.
 */
function getEasternTime(date: Date): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: COMPLIANCE.sendWindow.timezone,
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
 * Check whether a given date/time falls within the Florida send window.
 */
export function isWithinSendWindow(date: Date): boolean {
  const { startHour, startMinute, endHour, endMinute } =
    COMPLIANCE.sendWindow;
  const { hour, minute } = getEasternTime(date);

  const timeInMinutes = hour * 60 + minute;
  const startInMinutes = startHour * 60 + startMinute;
  const endInMinutes = endHour * 60 + endMinute;

  return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
}

/**
 * Adjust a scheduled date to the next valid send window if it falls outside.
 * If before the window, pushes to window start same day.
 * If after the window, pushes to window start next day.
 * Returns the original date if already within the window.
 */
export function adjustToSendWindow(date: Date): Date {
  if (isWithinSendWindow(date)) return date;

  const { startHour, startMinute, endHour, endMinute } =
    COMPLIANCE.sendWindow;
  const { hour, minute } = getEasternTime(date);

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

import { db } from "@/lib/db";

/**
 * Check if a lead is on the Do Not Contact list.
 * Returns true if the lead should NOT be contacted.
 */
export async function checkDNC(leadId: string): Promise<boolean> {
  // 1. Check if lead is opted out
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    select: { optedOut: true, phone: true, email: true },
  });

  if (!lead) return true; // Lead not found — don't contact
  if (lead.optedOut) return true;

  // 2. Check DNC list entries
  const dncEntry = await db.dncList.findFirst({
    where: { leadId },
  });

  return !!dncEntry;
}

/**
 * Check DNC by phone number (for incoming webhook scenarios).
 */
export async function checkDNCByPhone(phone: string): Promise<boolean> {
  const lead = await db.lead.findFirst({
    where: {
      OR: [{ phone }, { phoneSecondary: phone }],
    },
    select: { id: true, optedOut: true },
  });

  if (!lead) return false; // Unknown phone — not on DNC
  if (lead.optedOut) return true;

  const dncEntry = await db.dncList.findFirst({
    where: { leadId: lead.id },
  });

  return !!dncEntry;
}

/**
 * Add a lead to the DNC list.
 */
export async function addToDNC(
  leadId: string,
  reason: string,
): Promise<void> {
  // Mark lead as opted out
  await db.lead.update({
    where: { id: leadId },
    data: { optedOut: true },
  });

  // Check if DNC entry already exists
  const existing = await db.dncList.findFirst({
    where: { leadId },
  });

  if (!existing) {
    await db.dncList.create({
      data: { leadId, reason },
    });
  }

  // Cancel any pending touches
  await db.touch.updateMany({
    where: { leadId, status: "pending" },
    data: { status: "failed" },
  });
}

/**
 * Remove a lead from the DNC list (re-subscribe).
 */
export async function removeFromDNC(leadId: string): Promise<void> {
  await db.lead.update({
    where: { id: leadId },
    data: { optedOut: false },
  });

  await db.dncList.deleteMany({
    where: { leadId },
  });
}

/**
 * Pre-flight DNC check for workers. Returns true if safe to send.
 */
export async function preFlight(
  leadId: string,
  channel: "whatsapp" | "email" | "sms",
): Promise<{ allowed: boolean; reason?: string }> {
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    select: { id: true, optedOut: true, phone: true, email: true },
  });

  if (!lead) return { allowed: false, reason: "lead_not_found" };
  if (lead.optedOut) return { allowed: false, reason: "opted_out" };

  // Channel-specific checks
  if (channel === "email" && !lead.email) {
    return { allowed: false, reason: "no_email" };
  }
  if ((channel === "whatsapp" || channel === "sms") && !lead.phone) {
    return { allowed: false, reason: "no_phone" };
  }

  // DNC list check
  const dncEntry = await db.dncList.findFirst({
    where: { leadId },
  });
  if (dncEntry) return { allowed: false, reason: "dnc_listed" };

  return { allowed: true };
}

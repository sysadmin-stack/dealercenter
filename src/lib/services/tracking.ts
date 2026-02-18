import { db } from "@/lib/db";
import type { TouchStatus } from "@/generated/prisma/client";

/**
 * Status progression — a touch can only move forward in this hierarchy.
 * This prevents race conditions where e.g. "opened" arrives after "clicked".
 */
const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
  clicked: 4,
  replied: 5,
  bounced: 1, // same level as sent (terminal)
  failed: 0, // terminal
};

const EVENT_TO_STATUS: Record<string, TouchStatus> = {
  sent: "sent",
  delivered: "delivered",
  opened: "opened",
  clicked: "clicked",
  replied: "replied",
  bounced: "bounced",
  failed: "failed",
};

/**
 * Record a tracking event for a touch.
 * Updates Touch.status if the new event represents forward progress.
 * Creates a TouchEvent record for every event (immutable log).
 */
export async function recordEvent(
  touchId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  // 1. Create the event record (always — immutable log)
  await db.touchEvent.create({
    data: {
      touchId,
      eventType,
      payload: (metadata ?? {}) as Record<string, string>,
    },
  });

  // 2. Update touch status if applicable
  const newStatus = EVENT_TO_STATUS[eventType];
  if (!newStatus) return; // Unknown event type — log only

  const touch = await db.touch.findUnique({
    where: { id: touchId },
    select: { status: true },
  });
  if (!touch) return;

  const currentOrder = STATUS_ORDER[touch.status] ?? 0;
  const newOrder = STATUS_ORDER[newStatus] ?? 0;

  // Only advance status (never go backward)
  if (newOrder > currentOrder) {
    await db.touch.update({
      where: { id: touchId },
      data: { status: newStatus },
    });
  }
}

/**
 * Find a touch by lead phone and channel, returning the most recent sent touch.
 * Used by webhooks to match incoming events to touches.
 */
export async function findTouchByPhone(
  phone: string,
  channel: "whatsapp" | "sms",
): Promise<string | null> {
  const lead = await db.lead.findFirst({
    where: {
      OR: [{ phone }, { phoneSecondary: phone }],
    },
    select: { id: true },
  });
  if (!lead) return null;

  const touch = await db.touch.findFirst({
    where: {
      leadId: lead.id,
      channel,
      status: { in: ["sent", "delivered"] },
    },
    orderBy: { sentAt: "desc" },
    select: { id: true },
  });

  return touch?.id ?? null;
}

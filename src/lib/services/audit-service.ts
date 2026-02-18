import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("audit");

/**
 * Write an immutable audit log entry.
 * Audit logs are never updated or deleted — only inserted.
 */
export async function auditLog(params: {
  entityType: string;
  entityId: string;
  action: string;
  userId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        userId: params.userId ?? null,
        payload: (params.payload ?? {}) as Record<string, string>,
      },
    });

    log.debug(
      { entity: `${params.entityType}:${params.entityId}`, action: params.action },
      "Audit logged",
    );
  } catch (err) {
    // Audit log failures should never break the main flow
    log.error({ err }, "Failed to write audit log");
  }
}

/**
 * Pre-built audit helpers for common actions.
 */
export const audit = {
  campaignCreated(campaignId: string, userId?: string) {
    return auditLog({ entityType: "campaign", entityId: campaignId, action: "created", userId });
  },

  campaignActivated(campaignId: string, userId?: string, touchCount?: number) {
    return auditLog({
      entityType: "campaign",
      entityId: campaignId,
      action: "activated",
      userId,
      payload: { touchCount },
    });
  },

  campaignPaused(campaignId: string, userId?: string) {
    return auditLog({ entityType: "campaign", entityId: campaignId, action: "paused", userId });
  },

  campaignResumed(campaignId: string, userId?: string) {
    return auditLog({ entityType: "campaign", entityId: campaignId, action: "resumed", userId });
  },

  campaignCancelled(campaignId: string, userId?: string) {
    return auditLog({ entityType: "campaign", entityId: campaignId, action: "cancelled", userId });
  },

  leadOptedOut(leadId: string, channel: string, reason: string) {
    return auditLog({
      entityType: "lead",
      entityId: leadId,
      action: "opted_out",
      payload: { channel, reason },
    });
  },

  leadImported(batchId: string, count: number, userId?: string) {
    return auditLog({
      entityType: "import",
      entityId: batchId,
      action: "leads_imported",
      userId,
      payload: { count },
    });
  },

  handoffCreated(conversationId: string, leadId: string, reason: string) {
    return auditLog({
      entityType: "conversation",
      entityId: conversationId,
      action: "handoff",
      payload: { leadId, reason },
    });
  },
};

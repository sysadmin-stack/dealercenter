import { db } from "@/lib/db";
import type {
  Campaign,
  CampaignStatus,
  Channel,
  Lead,
  Prisma,
  Segment,
} from "@/generated/prisma/client";
import {
  scheduleTouch,
  scheduleNurture,
  cancelScheduledTouches,
} from "./touch-scheduler";

// ─── Get eligible leads for a campaign ──────────────────

export async function getEligibleLeads(
  segments: Segment[],
  channels: Channel[],
): Promise<Lead[]> {
  const where: Prisma.LeadWhereInput = {
    segment: { in: segments },
    optedOut: false,
  };

  // At least one contact method for the selected channels
  const contactFilters: Prisma.LeadWhereInput[] = [];
  if (channels.includes("email")) {
    contactFilters.push({ email: { not: null } });
  }
  if (channels.includes("whatsapp") || channels.includes("sms")) {
    contactFilters.push({ phone: { not: null } });
  }
  if (contactFilters.length > 0) {
    where.OR = contactFilters;
  }

  return db.lead.findMany({ where });
}

// ─── Preview ────────────────────────────────────────────

export async function previewCampaign(campaignId: string) {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error("Campaign not found");

  const leads = await getEligibleLeads(campaign.segments, campaign.channels);

  // Count by segment
  const bySegment: Record<string, number> = {};
  for (const lead of leads) {
    bySegment[lead.segment] = (bySegment[lead.segment] ?? 0) + 1;
  }

  // Count by reachable channel
  const byChannel: Record<string, number> = {};
  for (const ch of campaign.channels) {
    byChannel[ch] = leads.filter((l) => {
      if (ch === "email") return !!l.email;
      return !!l.phone;
    }).length;
  }

  return {
    totalLeads: leads.length,
    bySegment,
    byChannel,
  };
}

// ─── Activate ───────────────────────────────────────────

export async function activateCampaign(campaignId: string) {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== "draft" && campaign.status !== "paused") {
    throw new Error(
      `Cannot activate campaign with status "${campaign.status}"`,
    );
  }

  const leads = await getEligibleLeads(campaign.segments, campaign.channels);

  // Update campaign status and start date
  const updated = await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: "active",
      startDate: campaign.startDate ?? new Date(),
    },
  });

  // Schedule all touches
  const touchCount = await scheduleTouch(updated, leads);

  return { campaign: updated, leadsCount: leads.length, touchCount };
}

// ─── Pause ──────────────────────────────────────────────

export async function pauseCampaign(campaignId: string) {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== "active") {
    throw new Error(`Cannot pause campaign with status "${campaign.status}"`);
  }

  // Cancel pending touches/jobs
  const cancelled = await cancelScheduledTouches(campaignId);

  const updated = await db.campaign.update({
    where: { id: campaignId },
    data: { status: "paused" },
  });

  return { campaign: updated, cancelledTouches: cancelled };
}

// ─── Resume (re-activate a paused campaign) ─────────────

export async function resumeCampaign(campaignId: string) {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== "paused") {
    throw new Error(`Cannot resume campaign with status "${campaign.status}"`);
  }

  return activateCampaign(campaignId);
}

// ─── Complete with Nurture ──────────────────────────────

export async function completeCampaignWithNurture(campaignId: string) {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error("Campaign not found");

  // Get all leads that were part of this campaign
  const leadIds = await db.touch.findMany({
    where: { campaignId },
    select: { leadId: true },
    distinct: ["leadId"],
  });

  const leads = await db.lead.findMany({
    where: {
      id: { in: leadIds.map((t) => t.leadId) },
      optedOut: false,
    },
  });

  // Schedule nurture for non-responsive leads
  const nurtureCount = await scheduleNurture(campaign, leads);

  const updated = await db.campaign.update({
    where: { id: campaignId },
    data: { status: "completed", endDate: new Date() },
  });

  return { campaign: updated, nurtureScheduled: nurtureCount };
}

// ─── Cancel ─────────────────────────────────────────────

export async function cancelCampaign(campaignId: string) {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "completed") {
    throw new Error("Cannot cancel a completed campaign");
  }

  const cancelled = await cancelScheduledTouches(campaignId);

  const updated = await db.campaign.update({
    where: { id: campaignId },
    data: { status: "completed", endDate: new Date() },
  });

  return { campaign: updated, cancelledTouches: cancelled };
}

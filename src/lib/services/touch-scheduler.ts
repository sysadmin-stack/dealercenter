import { db } from "@/lib/db";
import { whatsappQueue, emailQueue, smsQueue } from "@/lib/queue";
import { CADENCES, type CadenceStep } from "@/lib/config/cadences";
import type { Campaign, Lead, Channel, Segment } from "@/generated/prisma/client";

function getQueueForChannel(channel: Channel) {
  switch (channel) {
    case "whatsapp":
      return whatsappQueue;
    case "email":
      return emailQueue;
    case "sms":
      return smsQueue;
  }
}

function computeScheduledAt(
  campaignStart: Date,
  step: CadenceStep,
): Date {
  const scheduled = new Date(campaignStart);
  scheduled.setDate(scheduled.getDate() + step.day);
  scheduled.setHours(step.hour, 0, 0, 0);
  return scheduled;
}

function canReachViaChannel(lead: Lead, channel: Channel): boolean {
  switch (channel) {
    case "whatsapp":
    case "sms":
      return !!lead.phone;
    case "email":
      return !!lead.email;
  }
}

export async function scheduleTouch(
  campaign: Campaign,
  leads: Lead[],
): Promise<number> {
  const campaignStart = campaign.startDate ?? new Date();
  let touchCount = 0;

  // Filter cadence steps to only channels the campaign uses
  const campaignChannels = new Set(campaign.channels);

  for (const lead of leads) {
    // Get cadence for this lead's segment
    const steps = CADENCES[lead.segment as Segment] ?? CADENCES.COLD;

    for (const step of steps) {
      // Only schedule if campaign includes this channel
      if (!campaignChannels.has(step.channel)) continue;

      // Only schedule if lead is reachable on this channel
      if (!canReachViaChannel(lead, step.channel)) continue;

      const scheduledAt = computeScheduledAt(campaignStart, step);

      // Create Touch record
      const touch = await db.touch.create({
        data: {
          leadId: lead.id,
          campaignId: campaign.id,
          channel: step.channel,
          status: "pending",
          scheduledAt,
        },
      });

      // Enqueue job with delay
      const delay = Math.max(0, scheduledAt.getTime() - Date.now());
      const queue = getQueueForChannel(step.channel);
      await queue.add(
        `touch-${touch.id}`,
        {
          touchId: touch.id,
          leadId: lead.id,
          campaignId: campaign.id,
          channel: step.channel,
          templateType: step.templateType,
          scheduledAt: scheduledAt.toISOString(),
        },
        { delay, jobId: touch.id },
      );

      touchCount++;
    }
  }

  return touchCount;
}

export async function cancelScheduledTouches(
  campaignId: string,
): Promise<number> {
  // Get all pending touches for this campaign
  const pendingTouches = await db.touch.findMany({
    where: { campaignId, status: "pending" },
    select: { id: true, channel: true },
  });

  // Remove jobs from queues
  for (const touch of pendingTouches) {
    const queue = getQueueForChannel(touch.channel);
    const job = await queue.getJob(touch.id);
    if (job) await job.remove();
  }

  // Update touch statuses
  const result = await db.touch.updateMany({
    where: { campaignId, status: "pending" },
    data: { status: "failed" },
  });

  return result.count;
}

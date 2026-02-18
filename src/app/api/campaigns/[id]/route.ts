import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  segments: z.array(z.enum(["HOT", "WARM", "COLD", "FROZEN"])).min(1).optional(),
  channels: z.array(z.enum(["whatsapp", "email", "sms"])).min(1).optional(),
  startDate: z.coerce.date().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      touches: {
        select: { id: true, status: true, channel: true, scheduledAt: true },
        orderBy: { scheduledAt: "asc" },
        take: 100,
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json(campaign);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateCampaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const existing = await db.campaign.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Can only edit draft campaigns" },
      { status: 400 },
    );
  }

  const campaign = await db.campaign.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(campaign);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.campaign.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (existing.status === "active") {
    return NextResponse.json(
      { error: "Cannot delete an active campaign. Pause or cancel it first." },
      { status: 400 },
    );
  }

  await db.touch.deleteMany({ where: { campaignId: id } });
  await db.campaign.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}

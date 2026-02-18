import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";

const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  segments: z.array(z.enum(["HOT", "WARM", "COLD", "FROZEN"])).min(1),
  channels: z.array(z.enum(["whatsapp", "email", "sms"])).min(1),
  startDate: z.coerce.date().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const status = params.get("status") ?? undefined;

  const campaigns = await db.campaign.findMany({
    where: status ? { status: status as "draft" | "active" | "paused" | "completed" } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: campaigns });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createCampaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const campaign = await db.campaign.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      segments: parsed.data.segments,
      channels: parsed.data.channels,
      startDate: parsed.data.startDate,
      status: "draft",
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}

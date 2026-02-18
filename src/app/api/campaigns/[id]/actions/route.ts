import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod/v4";
import {
  activateCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
} from "@/lib/services/campaign-service";

const actionSchema = z.object({
  action: z.enum(["activate", "pause", "resume", "cancel"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid action. Use: activate, pause, resume, or cancel." },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    switch (parsed.data.action) {
      case "activate": {
        const result = await activateCampaign(id);
        return NextResponse.json({
          message: "Campaign activated",
          leadsCount: result.leadsCount,
          touchCount: result.touchCount,
          campaign: result.campaign,
        });
      }
      case "pause": {
        const result = await pauseCampaign(id);
        return NextResponse.json({
          message: "Campaign paused",
          cancelledTouches: result.cancelledTouches,
          campaign: result.campaign,
        });
      }
      case "resume": {
        const result = await resumeCampaign(id);
        return NextResponse.json({
          message: "Campaign resumed",
          leadsCount: result.leadsCount,
          touchCount: result.touchCount,
          campaign: result.campaign,
        });
      }
      case "cancel": {
        const result = await cancelCampaign(id);
        return NextResponse.json({
          message: "Campaign cancelled",
          cancelledTouches: result.cancelledTouches,
          campaign: result.campaign,
        });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

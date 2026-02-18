import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { previewCampaign } from "@/lib/services/campaign-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const preview = await previewCampaign(id);
    return NextResponse.json(preview);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

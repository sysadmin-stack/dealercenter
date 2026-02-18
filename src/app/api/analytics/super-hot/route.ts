import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSuperHotStats, tagSuperHotLeads } from "@/lib/services/super-hot-tagger";

/**
 * GET /api/analytics/super-hot
 * Returns stats for the super_hot lead group.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getSuperHotStats();
  return NextResponse.json(stats);
}

/**
 * POST /api/analytics/super-hot
 * Trigger re-tagging of super_hot leads (e.g., after import).
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tagged = await tagSuperHotLeads();
  return NextResponse.json({ tagged });
}

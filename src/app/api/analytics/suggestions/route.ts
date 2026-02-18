import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * GET /api/analytics/suggestions
 * Returns pending cadence suggestions for admin review.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestions = await db.cadenceSuggestion.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ suggestions });
}

/**
 * POST /api/analytics/suggestions
 * Approve or reject a cadence suggestion.
 * Body: { id: string, action: "approve" | "reject" }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, action } = body as { id: string; action: string };

  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid request. Need id and action (approve/reject)" },
      { status: 400 },
    );
  }

  const suggestion = await db.cadenceSuggestion.findUnique({ where: { id } });
  if (!suggestion) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  if (suggestion.status !== "pending") {
    return NextResponse.json(
      { error: `Suggestion already ${suggestion.status}` },
      { status: 400 },
    );
  }

  const newStatus = action === "approve" ? "approved" : "rejected";
  await db.cadenceSuggestion.update({
    where: { id },
    data: { status: newStatus },
  });

  return NextResponse.json({ id, status: newStatus });
}

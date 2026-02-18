import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { exportMetaAudience } from "@/lib/services/meta-export-service";

/**
 * GET /api/leads/export/meta-audience?segment=FROZEN
 * Exports leads as a Meta Custom Audience CSV file.
 * Auth: admin only.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const segment = req.nextUrl.searchParams.get("segment") || "FROZEN";
  const includeAll = req.nextUrl.searchParams.get("all") === "true";

  const { csv, count } = await exportMetaAudience({
    segment,
    includeAll,
  });

  // Audit log
  await db.auditLog.create({
    data: {
      action: "export_meta_audience",
      entityType: "lead",
      entityId: "batch",
      userId: session.user.id,
      payload: {
        segment: includeAll ? "ALL" : segment,
        count: String(count),
        exportedAt: new Date().toISOString(),
      },
    },
  });

  const date = new Date().toISOString().split("T")[0];
  const filename = `meta-audience-${includeAll ? "all" : segment.toLowerCase()}-${date}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

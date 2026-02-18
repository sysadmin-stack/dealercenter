import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addToDNC } from "@/lib/services/dnc-service";
import { auditLog } from "@/lib/services/audit-service";

/**
 * GET /api/unsubscribe?id=<leadId>&token=<hash>
 * Email unsubscribe endpoint. Linked in every marketing email.
 * Shows a simple confirmation page.
 */
export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("id");
  const token = req.nextUrl.searchParams.get("token");

  if (!leadId) {
    return new NextResponse(htmlPage("Invalid link", "This unsubscribe link is invalid."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Simple token validation: base64 of leadId (not cryptographic — sufficient for unsubscribe)
  const expectedToken = Buffer.from(leadId).toString("base64url");
  if (token !== expectedToken) {
    return new NextResponse(htmlPage("Invalid link", "This unsubscribe link is invalid."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Check if lead exists
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    select: { id: true, name: true, optedOut: true },
  });

  if (!lead) {
    return new NextResponse(htmlPage("Not found", "We could not find your subscription."), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (lead.optedOut) {
    return new NextResponse(
      htmlPage("Already unsubscribed", "You are already unsubscribed from our emails."),
      { headers: { "Content-Type": "text/html" } },
    );
  }

  // Process unsubscribe
  await addToDNC(leadId, "Email unsubscribe link");

  await auditLog({
    entityType: "lead",
    entityId: leadId,
    action: "email_unsubscribe",
    payload: { method: "link" },
  });

  return new NextResponse(
    htmlPage(
      "Unsubscribed",
      `You have been unsubscribed from Florida Auto Center emails. If you change your mind, contact us anytime.`,
    ),
    { headers: { "Content-Type": "text/html" } },
  );
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Florida Auto Center</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
    .card { max-width: 420px; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
    h1 { font-size: 1.25rem; margin: 0 0 0.75rem; }
    p { color: #6b7280; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

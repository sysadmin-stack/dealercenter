const APP_URL = process.env.APP_URL || "http://localhost:3000";

/**
 * Generate an unsubscribe link for a lead.
 */
export function getUnsubscribeLink(leadId: string): string {
  const token = Buffer.from(leadId).toString("base64url");
  return `${APP_URL}/api/unsubscribe?id=${leadId}&token=${token}`;
}

/**
 * Generate unsubscribe footer HTML for emails.
 */
export function getUnsubscribeFooterHtml(leadId: string): string {
  const link = getUnsubscribeLink(leadId);
  return `<p style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;">If you no longer wish to receive emails from Florida Auto Center, <a href="${link}" style="color:#9ca3af;">unsubscribe here</a>.</p>`;
}

/**
 * Generate unsubscribe footer text for emails.
 */
export function getUnsubscribeFooterText(leadId: string): string {
  const link = getUnsubscribeLink(leadId);
  return `\n\n---\nTo unsubscribe: ${link}`;
}

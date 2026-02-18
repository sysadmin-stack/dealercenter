import { createHash } from "crypto";
import { db } from "@/lib/db";

const META_CSV_HEADERS = "email,phone,fn,ln,ct,st,zip,country";

/**
 * SHA-256 hash for Meta Custom Audience format.
 * Meta requires lowercase, trimmed values.
 */
function hashForMeta(value: string): string {
  return createHash("sha256")
    .update(value.toLowerCase().trim())
    .digest("hex");
}

/**
 * Normalize phone to Meta format: digits only, no + prefix.
 * E.164 "+14075774133" → "14075774133"
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Split a full name into first and last name.
 */
function splitName(name: string): { fn: string; ln: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return { fn: parts[0] || "", ln: "" };
  return { fn: parts[0], ln: parts.slice(1).join(" ") };
}

interface ExportOptions {
  segment?: string;
  includeAll?: boolean; // If true, export all non-opted-out leads (not just FROZEN)
}

interface ExportResult {
  csv: string;
  count: number;
}

/**
 * Export leads as a Meta Custom Audience CSV.
 * By default exports FROZEN leads that have not opted out.
 * All PII fields are SHA-256 hashed per Meta requirements.
 */
export async function exportMetaAudience(
  options: ExportOptions = {},
): Promise<ExportResult> {
  const segment = options.segment ?? "FROZEN";

  const where = options.includeAll
    ? { optedOut: false, OR: [{ email: { not: null } }, { phone: { not: null } }] }
    : {
        segment: segment as "HOT" | "WARM" | "COLD" | "FROZEN",
        optedOut: false,
        OR: [{ email: { not: null } }, { phone: { not: null } }],
      };

  const leads = await db.lead.findMany({
    where,
    select: {
      name: true,
      email: true,
      phone: true,
      address: true,
    },
  });

  const rows: string[] = [META_CSV_HEADERS];

  for (const lead of leads) {
    const { fn, ln } = splitName(lead.name);

    const email = lead.email ? hashForMeta(lead.email) : "";
    const phone = lead.phone ? hashForMeta(normalizePhone(lead.phone)) : "";
    const fnHash = fn ? hashForMeta(fn) : "";
    const lnHash = ln ? hashForMeta(ln) : "";

    // City and state from address (best effort parse)
    let ct = "";
    let st = "";
    if (lead.address) {
      // Try to extract state abbreviation (last 2-letter word)
      const stMatch = lead.address.match(/\b([A-Z]{2})\b/);
      if (stMatch) st = hashForMeta(stMatch[1]);
      // City: try to grab word before state
      const parts = lead.address.split(",").map((p) => p.trim());
      if (parts.length >= 2) ct = hashForMeta(parts[parts.length - 2] || "");
    }

    // country: US = "us" hashed, or use ISO numeric 840
    const country = "us";

    rows.push(
      `${email},${phone},${fnHash},${lnHash},${ct},${st},,${country}`,
    );
  }

  return { csv: rows.join("\n"), count: leads.length };
}

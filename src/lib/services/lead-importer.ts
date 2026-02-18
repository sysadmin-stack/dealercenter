import { db } from "@/lib/db";
import type { Lead } from "@/generated/prisma/client";
import type { RawLead } from "@/lib/parsers/dealercenter-xlsx";
import { parseDealerCenterXlsx } from "@/lib/parsers/dealercenter-xlsx";
import { getSegment, getScore, detectLanguage } from "./lead-segmenter";
import type { ImportResult } from "@/types";

// ─── Date Parsing ───────────────────────────────────────

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const [, month, day, year] = match;
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return isNaN(d.getTime()) ? null : d;
}

// ─── Process a single raw lead ──────────────────────────

function buildLeadData(raw: RawLead, year: number) {
  const isSold = raw.status?.toUpperCase() === "SOLD";
  const segment = getSegment(raw.daysOld);
  const score = getScore(segment, raw.creditApp, raw.originType, raw.email);
  const language = detectLanguage(raw.name);
  const isDnc = raw.lostReason?.toUpperCase().includes("DNC") ?? false;
  const tags: string[] = isSold ? ["sold"] : [];
  const createdDate = parseDate(raw.createdDate);
  const dob = raw.dob ? parseDate(raw.dob) : null;

  return {
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    phoneSecondary: raw.phoneSecondary,
    address: raw.address || null,
    dob,
    salesRep: raw.salesRep,
    source: raw.source,
    originType: raw.originType,
    status: raw.status,
    lostReason: raw.lostReason,
    creditApp: raw.creditApp,
    segment,
    language,
    score,
    daysOld: raw.daysOld,
    optedOut: isDnc,
    tags,
    importedYear: year,
    dealerCreatedAt: createdDate,
    _isDnc: isDnc,
  };
}

// ─── Import from file path ──────────────────────────────

export async function importLeadsFromFile(
  filePath: string,
  year: number,
): Promise<ImportResult> {
  const rawLeads = parseDealerCenterXlsx(filePath);
  return importLeads(rawLeads, year);
}

// ─── Import from buffer (for API upload) ────────────────

export async function importLeadsFromBuffer(
  buffer: Buffer,
  year: number,
): Promise<ImportResult> {
  // xlsx.read accepts a buffer
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const range = XLSX.utils.decode_range(ws["!ref"]!);

  // Reuse the same parsing logic via a temp approach:
  // We import the internal parse function
  const rawLeads = parseWorksheet(ws, range);
  return importLeads(rawLeads, year);
}

// ─── Parse worksheet (shared logic) ─────────────────────

function cell(
  ws: import("xlsx").WorkSheet,
  row: number,
  col: number,
): string | undefined {
  const XLSX = require("xlsx");
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const c = ws[addr];
  if (!c) return undefined;
  return (c.w ?? String(c.v)).trim();
}

function parsePhones(raw: string): [string | null, string | null] {
  const homeMatch = raw.match(/H:\s*(\(?\d{3}\)?\s*[\d-]+)/);
  const cellMatch = raw.match(/C:\s*(\(?\d{3}\)?\s*[\d-]+)/);

  const normalize = (s: string): string | null => {
    const digits = s.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    if (digits.length >= 7) return `+1${digits}`;
    return null;
  };

  const home = homeMatch ? normalize(homeMatch[1]) : null;
  const cellPhone = cellMatch ? normalize(cellMatch[1]) : null;
  const primary = cellPhone ?? home;
  const secondary = cellPhone && home && cellPhone !== home ? home : null;
  return [primary, secondary];
}

function parseDob(raw: string): string | null {
  const match = raw.match(/DOB:\s*(\d{2}\/\d{2}\/\d{4})/);
  return match ? match[1] : null;
}

function cleanSalesRep(raw: string): string {
  const idx = raw.indexOf(" - ");
  return idx > 0 ? raw.substring(0, idx).trim() : raw.trim();
}

function parseWorksheet(
  ws: import("xlsx").WorkSheet,
  range: import("xlsx").Range,
): RawLead[] {
  const leads: RawLead[] = [];
  let r = 0;

  while (r <= range.e.r) {
    const bVal = cell(ws, r, 1);
    if (bVal !== "Sales Rep") {
      r++;
      continue;
    }
    const row2B = cell(ws, r + 1, 1);
    const row3B = cell(ws, r + 2, 1);
    if (row2B !== "Source" || row3B !== "Type") {
      r++;
      continue;
    }

    const name = cell(ws, r, 0) ?? "UNKNOWN";
    const salesRepRaw = cell(ws, r, 2);
    const createdDate = cell(ws, r, 6) ?? null;
    const emailRaw = cell(ws, r + 1, 0);
    const source = cell(ws, r + 1, 2) ?? null;
    const status = cell(ws, r + 1, 4) ?? null;
    const phonesRaw = cell(ws, r + 2, 0) ?? "";
    const originType = cell(ws, r + 2, 2) ?? null;
    const lostReason = cell(ws, r + 2, 4) ?? null;
    const daysOldRaw = cell(ws, r + 2, 6);
    const address = cell(ws, r + 3, 0)?.trim() ?? null;
    const creditAppRaw = cell(ws, r + 3, 4);
    const lastContactedRaw = cell(ws, r + 3, 6);
    const dobRaw = cell(ws, r + 4, 0) ?? "";

    const email =
      emailRaw && emailRaw.includes("@") ? emailRaw.toLowerCase() : null;
    const [phone, phoneSecondary] = parsePhones(phonesRaw);
    const dob = parseDob(dobRaw);
    const salesRep = salesRepRaw ? cleanSalesRep(salesRepRaw) : null;
    const creditApp = creditAppRaw?.toLowerCase() === "yes";
    const daysOld = daysOldRaw ? parseInt(daysOldRaw, 10) : null;
    const lastContactedDays = lastContactedRaw
      ? parseInt(lastContactedRaw, 10)
      : null;

    leads.push({
      name,
      email,
      phone,
      phoneSecondary,
      address: address || null,
      dob,
      salesRep,
      source,
      originType,
      status,
      lostReason: lostReason || null,
      creditApp,
      daysOld: isNaN(daysOld ?? NaN) ? null : daysOld,
      lastContactedDays: isNaN(lastContactedDays ?? NaN)
        ? null
        : lastContactedDays,
      createdDate,
    });

    r += 6;
  }

  return leads;
}

// ─── Core import logic ──────────────────────────────────

const BATCH_SIZE = 500;

async function importLeads(
  rawLeads: RawLead[],
  year: number,
): Promise<ImportResult> {
  let imported = 0;
  let skipped = 0;
  let dnc = 0;
  const errors: string[] = [];

  for (let i = 0; i < rawLeads.length; i += BATCH_SIZE) {
    const batch = rawLeads.slice(i, i + BATCH_SIZE);

    for (const raw of batch) {
      try {
        const data = buildLeadData(raw, year);
        const { _isDnc, ...leadData } = data;

        let lead: Lead;
        if (raw.email) {
          const existing = await db.lead.findFirst({
            where: { email: raw.email },
          });
          if (existing) {
            lead = await db.lead.update({
              where: { id: existing.id },
              data: leadData,
            });
          } else {
            lead = await db.lead.create({ data: leadData });
          }
        } else {
          lead = await db.lead.create({ data: leadData });
        }

        if (_isDnc) {
          await db.dncList.create({
            data: { leadId: lead.id, reason: raw.lostReason },
          });
          dnc++;
        }

        imported++;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : `Unknown error for ${raw.name}`;
        errors.push(msg);
        skipped++;
      }
    }
  }

  return {
    total: rawLeads.length,
    imported,
    skipped,
    dnc,
    errors,
  };
}

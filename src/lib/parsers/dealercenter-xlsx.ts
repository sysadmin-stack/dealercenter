import * as XLSX from "xlsx";

export interface RawLead {
  name: string;
  email: string | null;
  phone: string | null;
  phoneSecondary: string | null;
  address: string | null;
  dob: string | null;
  salesRep: string | null;
  source: string | null;
  originType: string | null;
  status: string | null;
  lostReason: string | null;
  creditApp: boolean;
  daysOld: number | null;
  lastContactedDays: number | null;
  createdDate: string | null;
}

function cell(
  ws: XLSX.WorkSheet,
  row: number,
  col: number,
): string | undefined {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const c = ws[addr];
  if (!c) return undefined;
  return (c.w ?? String(c.v)).trim();
}

/**
 * Parse phone string like "H: (407) 577-4133  C: (407) 577-4133"
 * Returns [primary (cell preferred), secondary (home)] in E.164 format.
 */
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

  // Primary = cell, secondary = home (only if different)
  const primary = cellPhone ?? home;
  const secondary = cellPhone && home && cellPhone !== home ? home : null;

  return [primary, secondary];
}

function parseDob(raw: string): string | null {
  const match = raw.match(/DOB:\s*(\d{2}\/\d{2}\/\d{4})/);
  return match ? match[1] : null;
}

function cleanSalesRep(raw: string): string {
  // "MATHEUS RAMOS TODISCO - MATHEWSAUTO" → "MATHEUS RAMOS TODISCO"
  const idx = raw.indexOf(" - ");
  return idx > 0 ? raw.substring(0, idx).trim() : raw.trim();
}

export function parseDealerCenterXlsx(filePath: string): RawLead[] {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const range = XLSX.utils.decode_range(ws["!ref"]!);
  const leads: RawLead[] = [];

  let r = 0;
  while (r <= range.e.r) {
    // Detect block start: column B = "Sales Rep"
    const bVal = cell(ws, r, 1); // col B = index 1
    if (bVal !== "Sales Rep") {
      r++;
      continue;
    }

    // Validate block: next rows should have Source and Type in B
    const row2B = cell(ws, r + 1, 1);
    const row3B = cell(ws, r + 2, 1);
    if (row2B !== "Source" || row3B !== "Type") {
      r++;
      continue;
    }

    // Row 1 (B="Sales Rep"): A=name, C=salesRep, G=createdDate
    const name = cell(ws, r, 0) ?? "UNKNOWN";
    const salesRepRaw = cell(ws, r, 2);
    const createdDate = cell(ws, r, 6) ?? null;

    // Row 2 (B="Source"): A=email, C=source, E=status
    const emailRaw = cell(ws, r + 1, 0);
    const source = cell(ws, r + 1, 2) ?? null;
    const status = cell(ws, r + 1, 4) ?? null;

    // Row 3 (B="Type"): A=phones, C=originType, E=lostReason, G=daysOld
    const phonesRaw = cell(ws, r + 2, 0) ?? "";
    const originType = cell(ws, r + 2, 2) ?? null;
    const lostReason = cell(ws, r + 2, 4) ?? null;
    const daysOldRaw = cell(ws, r + 2, 6);

    // Row 4 (B="Workflow"): A=address, E=creditApp (Yes/No), G=lastContactedDays
    const address = cell(ws, r + 3, 0)?.trim() ?? null;
    const creditAppRaw = cell(ws, r + 3, 4);
    const lastContactedRaw = cell(ws, r + 3, 6);

    // Row 5: A="DOB: MM/DD/YYYY"
    const dobRaw = cell(ws, r + 4, 0) ?? "";

    // Parse fields
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

    // Skip to next block (5 data rows + 1 empty)
    r += 6;
  }

  return leads;
}

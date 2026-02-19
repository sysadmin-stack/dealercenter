export interface RawDeal {
  stockNumber: string | null;
  vin: string | null;
  vehicle: string | null;
  dealType: string | null;
  dealDmsId: string | null;
  dealDate: Date | null;
  lenderName: string | null;
  customerName: string;
  sellingPrice: number | null;
}

// Parse CSV handling quoted fields with commas
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// Parse "M/D/YYYY 0:00" format
function parseDealDate(raw: string | null): Date | null {
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, month, day, year] = match;
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return isNaN(d.getTime()) ? null : d;
}

function parsePrice(raw: string | null): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return isNaN(n) ? null : n;
}

export function parseSoldDealsCSV(buffer: Buffer): RawDeal[] {
  const text = buffer.toString("utf-8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) return [];

  // Skip header line
  const deals: RawDeal[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 9) continue;

    const customerName = fields[7]?.trim();
    if (!customerName) continue;

    deals.push({
      stockNumber: fields[0] || null,
      vin: fields[1] || null,
      vehicle: fields[2] || null,
      dealType: fields[3] || null,
      dealDmsId: fields[4] || null,
      dealDate: parseDealDate(fields[5]),
      lenderName: fields[6] || null,
      customerName,
      sellingPrice: parsePrice(fields[8]),
    });
  }

  return deals;
}

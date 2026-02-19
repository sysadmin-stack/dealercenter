import { db } from "@/lib/db";
import { parseSoldDealsCSV, type RawDeal } from "@/lib/parsers/sold-deals-csv";

export interface DealsImportResult {
  total: number;
  matched: number;
  matchedExact: number;
  matchedFuzzy: number;
  unmatched: number;
  unmatchedNames: string[];
  skippedOlder: number;
  errors: string[];
}

// Words too common to use for fuzzy matching
const COMMON_WORDS = new Set([
  "JOSE", "MARIA", "SILVA", "SOUZA", "SANTOS",
  "DAVID", "VALLE", "CARLOS", "PILAR",
]);

function normalize(name: string): string {
  return name.toUpperCase().trim().replace(/\s+/g, " ");
}

function getWords(name: string): string[] {
  return normalize(name).split(" ").filter(Boolean);
}

function fuzzyMatch(dealName: string, leadName: string): boolean {
  const dealWords = getWords(dealName);
  const leadWords = getWords(leadName);

  if (dealWords.length < 2 || leadWords.length < 2) return false;

  const dealFirst = dealWords[0];
  const dealLast = dealWords[dealWords.length - 1];
  const leadFirst = leadWords[0];
  const leadLast = leadWords[leadWords.length - 1];

  // First + last name match
  if (dealFirst === leadFirst && dealLast === leadLast) return true;

  // First name + any significant shared word (>4 chars, not common)
  if (dealFirst === leadFirst) {
    for (const dw of dealWords.slice(1)) {
      if (dw.length <= 4 || COMMON_WORDS.has(dw)) continue;
      if (leadWords.includes(dw)) return true;
    }
  }

  return false;
}

// Group deals by customer, keeping only the most recent per customer
function groupByCustomer(deals: RawDeal[]): Map<string, RawDeal> {
  const map = new Map<string, RawDeal>();

  for (const deal of deals) {
    const key = normalize(deal.customerName);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, deal);
    } else if (
      deal.dealDate &&
      (!existing.dealDate || deal.dealDate > existing.dealDate)
    ) {
      map.set(key, deal);
    }
  }

  return map;
}

export async function importDealsFromBuffer(
  buffer: Buffer,
): Promise<DealsImportResult> {
  const allDeals = parseSoldDealsCSV(buffer);
  const dealsByCustomer = groupByCustomer(allDeals);

  const result: DealsImportResult = {
    total: dealsByCustomer.size,
    matched: 0,
    matchedExact: 0,
    matchedFuzzy: 0,
    unmatched: 0,
    unmatchedNames: [],
    skippedOlder: 0,
    errors: [],
  };

  // Load all leads once (id, name, dealDate) for matching
  const allLeads = await db.lead.findMany({
    select: { id: true, name: true, dealDate: true },
  });

  // Build index: normalized name → lead(s)
  const exactIndex = new Map<string, typeof allLeads>();
  for (const lead of allLeads) {
    const key = normalize(lead.name);
    const arr = exactIndex.get(key) ?? [];
    arr.push(lead);
    exactIndex.set(key, arr);
  }

  for (const [, deal] of dealsByCustomer) {
    try {
      const normalizedName = normalize(deal.customerName);

      // 1. Exact match
      const exactMatches = exactIndex.get(normalizedName);
      if (exactMatches && exactMatches.length > 0) {
        const updated = await updateLeads(exactMatches, deal, "exact", result);
        if (updated) {
          result.matched++;
          result.matchedExact++;
          continue;
        }
      }

      // 2. Fuzzy match
      let fuzzyMatched = false;
      const fuzzyLeads: typeof allLeads = [];
      for (const lead of allLeads) {
        if (fuzzyMatch(deal.customerName, lead.name)) {
          fuzzyLeads.push(lead);
        }
      }

      if (fuzzyLeads.length > 0) {
        const updated = await updateLeads(fuzzyLeads, deal, "fuzzy", result);
        if (updated) {
          result.matched++;
          result.matchedFuzzy++;
          fuzzyMatched = true;
        }
      }

      if (!fuzzyMatched) {
        result.unmatched++;
        result.unmatchedNames.push(deal.customerName);
      }
    } catch (err) {
      result.errors.push(
        err instanceof Error ? err.message : `Error for ${deal.customerName}`,
      );
    }
  }

  return result;
}

async function updateLeads(
  leads: { id: string; name: string; dealDate: Date | null }[],
  deal: RawDeal,
  matchType: string,
  result: DealsImportResult,
): Promise<boolean> {
  let anyUpdated = false;

  for (const lead of leads) {
    // Skip if existing deal is newer
    if (lead.dealDate && deal.dealDate && lead.dealDate >= deal.dealDate) {
      result.skippedOlder++;
      anyUpdated = true; // Still counts as matched
      continue;
    }

    // Build tags: add "sold" if not present
    const fullLead = await db.lead.findUnique({
      where: { id: lead.id },
      select: { tags: true },
    });
    const tags = fullLead?.tags ?? [];
    if (!tags.includes("sold")) {
      tags.push("sold");
    }

    await db.lead.update({
      where: { id: lead.id },
      data: {
        dealStockNumber: deal.stockNumber,
        dealVin: deal.vin,
        dealVehicle: deal.vehicle,
        dealType: deal.dealType,
        dealDmsId: deal.dealDmsId,
        dealDate: deal.dealDate,
        dealLender: deal.lenderName,
        dealPrice: deal.sellingPrice,
        dealMatchType: matchType,
        status: "SOLD",
        tags,
      },
    });

    anyUpdated = true;
  }

  return anyUpdated;
}

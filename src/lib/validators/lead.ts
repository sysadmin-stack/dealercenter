import { z } from "zod/v4";

// ─── Email Validation ───────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

// ─── Phone Normalization (E.164) ────────────────────────

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 7) return `+1${digits}`;
  return null;
}

// ─── Zod Schemas ────────────────────────────────────────

export const leadFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  segment: z.enum(["HOT", "WARM", "COLD", "FROZEN"]).optional(),
  language: z.enum(["EN", "PT", "ES"]).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  optedOut: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  tag: z.string().optional(),
  salesRep: z.string().optional(),
  source: z.string().optional(),
  sortBy: z
    .enum(["name", "score", "daysOld", "createdAt", "segment"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type LeadFilters = z.infer<typeof leadFiltersSchema>;

export const leadUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  phoneSecondary: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  salesRep: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  segment: z.enum(["HOT", "WARM", "COLD", "FROZEN"]).optional(),
  language: z.enum(["EN", "PT", "ES"]).optional(),
  optedOut: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export type LeadUpdate = z.infer<typeof leadUpdateSchema>;

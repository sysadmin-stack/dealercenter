import { db } from "@/lib/db";

// ─── In-memory cache with 5-minute TTL ────────────────────

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

/**
 * Get a setting from the DB with in-memory cache.
 * Falls back to defaultValue if not found — zero breaking change.
 */
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  // Check cache first
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value as T;
  }

  try {
    const row = await db.dealerSettings.findUnique({ where: { key } });
    if (row) {
      const value = row.value as T;
      cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    }
  } catch (err) {
    console.error(`[Settings] Failed to read "${key}":`, err);
  }

  // Fallback to default
  cache.set(key, { value: defaultValue, expiresAt: Date.now() + CACHE_TTL_MS });
  return defaultValue;
}

/**
 * Save a setting to the DB (upsert) and update cache.
 */
export async function setSetting<T>(key: string, value: T): Promise<void> {
  await db.dealerSettings.upsert({
    where: { key },
    update: { value: value as any },
    create: { key, value: value as any },
  });

  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Invalidate cache for a specific key or all keys.
 */
export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// ─── Default values (current hardcoded configs) ───────────

export const DEFAULTS = {
  "dealer.identity": {
    name: "Florida Auto Center",
    location: "Orlando, FL",
    salesRep: "Antonio Sanches",
    salesRepPhone: process.env.SALES_REP_PHONE || "",
    email: process.env.RESEND_FROM_EMAIL || "noreply@floridautocenter.com",
    valueProps: [
      "Free CARFAX reports on all vehicles",
      "Flexible financing for all credit levels",
      "No-pressure buying experience",
      "Quality pre-owned vehicles",
    ],
  },

  "integration.resend": {
    fromEmail: process.env.RESEND_FROM_EMAIL || "noreply@floridautocenter.com",
    fromName: "Florida Auto Center",
  },

  "integration.twilio": {
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
  },

  "integration.waha": {
    apiUrl: process.env.WAHA_API_URL || "http://localhost:3001",
    session: process.env.WAHA_SESSION || "default",
  },

  "integration.chatwoot": {
    url: process.env.CHATWOOT_URL || "http://localhost:3009",
    accountId: process.env.CHATWOOT_ACCOUNT_ID || "1",
    inboxId: process.env.CHATWOOT_INBOX_ID || "1",
  },

  "integration.claude": {
    model: "claude-sonnet-4-6-20250514",
  },

  "integration.salesRep": {
    phone: process.env.SALES_REP_PHONE || "",
  },

  "compliance.sendWindow": {
    startHour: 8,
    startMinute: 15,
    endHour: 19,
    endMinute: 45,
    timezone: "America/New_York",
  },

  "compliance.frequencyCaps": {
    perChannelPerWeek: 3,
    totalPerDay: 2,
    totalPerWeek: 7,
    minHoursBetweenSameChannel: 24,
  },

  "segmentation.thresholds": {
    hot: 90,
    warm: 365,
    cold: 730,
  },

  "segmentation.scoring": {
    baseHot: 80,
    baseWarm: 50,
    baseCold: 25,
    baseFrozen: 10,
    creditAppBonus: 20,
    walkInBonus: 15,
    emailBonus: 5,
  },
} as const;

export type SettingsKey = keyof typeof DEFAULTS;

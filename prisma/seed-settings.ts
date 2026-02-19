import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEFAULTS: Record<string, unknown> = {
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
  "cadence.SUPER_HOT": [
    { day: 0, channel: "whatsapp", hour: 9, templateType: "super_hot_intro" },
    { day: 0, channel: "email", hour: 14, templateType: "super_hot_offer" },
    { day: 1, channel: "sms", hour: 10, templateType: "super_hot_sms" },
    { day: 3, channel: "whatsapp", hour: 10, templateType: "super_hot_human_touch" },
    { day: 3, channel: "task", hour: 10, templateType: "assign_to_rep" },
  ],
  "cadence.HOT": [
    { day: 0, channel: "whatsapp", hour: 9, templateType: "personal_intro" },
    { day: 0, channel: "email", hour: 14, templateType: "stock_offer" },
    { day: 1, channel: "sms", hour: 10, templateType: "quick_checkin" },
    { day: 3, channel: "whatsapp", hour: 9, templateType: "value_proposition" },
    { day: 5, channel: "email", hour: 14, templateType: "financing_options" },
    { day: 7, channel: "sms", hour: 10, templateType: "short_followup" },
    { day: 10, channel: "email", hour: 9, templateType: "social_proof" },
    { day: 14, channel: "whatsapp", hour: 10, templateType: "inventory_update" },
    { day: 21, channel: "email", hour: 9, templateType: "special_offer" },
    { day: 30, channel: "whatsapp", hour: 10, templateType: "last_touch" },
  ],
  "cadence.WARM": [
    { day: 0, channel: "email", hour: 9, templateType: "reintroduction" },
    { day: 3, channel: "whatsapp", hour: 10, templateType: "value_message" },
    { day: 7, channel: "email", hour: 14, templateType: "new_arrivals" },
    { day: 14, channel: "sms", hour: 10, templateType: "short_followup" },
    { day: 21, channel: "email", hour: 9, templateType: "social_proof" },
    { day: 30, channel: "whatsapp", hour: 10, templateType: "pattern_break" },
    { day: 45, channel: "email", hour: 9, templateType: "last_touch_email" },
  ],
  "cadence.COLD": [
    { day: 0, channel: "email", hour: 9, templateType: "reintroduction" },
    { day: 7, channel: "whatsapp", hour: 10, templateType: "pattern_break" },
    { day: 21, channel: "email", hour: 9, templateType: "special_offer" },
    { day: 45, channel: "sms", hour: 10, templateType: "short_followup" },
    { day: 75, channel: "email", hour: 9, templateType: "last_touch_email" },
  ],
  "cadence.FROZEN": [
    { day: 0, channel: "email", hour: 9, templateType: "newsletter" },
    { day: 30, channel: "whatsapp", hour: 10, templateType: "single_reactivation" },
    { day: 90, channel: "email", hour: 9, templateType: "long_time_reconnect" },
  ],
  "cadence.NURTURE": [
    { day: 0, channel: "email", hour: 9, templateType: "nurture_new_inventory" },
    { day: 30, channel: "email", hour: 9, templateType: "nurture_market_update" },
    { day: 60, channel: "sms", hour: 10, templateType: "nurture_checkin" },
    { day: 90, channel: "email", hour: 9, templateType: "nurture_seasonal" },
    { day: 180, channel: "email", hour: 9, templateType: "nurture_reconnect" },
    { day: 360, channel: "email", hour: 9, templateType: "nurture_annual" },
  ],
};

async function main() {
  console.log("Seeding dealer settings...\n");

  for (const [key, value] of Object.entries(DEFAULTS)) {
    await prisma.dealerSettings.upsert({
      where: { key },
      update: {},  // Don't overwrite existing values
      create: { key, value: value as any },
    });
    console.log(`  ${key}`);
  }

  console.log("\nDone! Settings seeded (existing values preserved).");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

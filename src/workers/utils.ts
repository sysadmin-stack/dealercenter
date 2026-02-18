import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Worker-specific Prisma client (not using Next.js path aliases)
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
export const db = new PrismaClient({ adapter });

/**
 * Check if current time is within allowed sending window (ET timezone).
 * @param startHour Start hour in ET (inclusive)
 * @param endHour End hour in ET (exclusive)
 * @returns ms to wait if outside window, 0 if inside
 */
export function getWindowDelay(startHour: number, endHour: number): number {
  const now = new Date();
  // Convert to ET (America/New_York)
  const et = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" }),
  );
  const hour = et.getHours();

  if (hour >= startHour && hour < endHour) return 0;

  // Calculate delay until next startHour
  const nextStart = new Date(et);
  if (hour >= endHour) {
    // After window — wait until tomorrow
    nextStart.setDate(nextStart.getDate() + 1);
  }
  nextStart.setHours(startHour, 0, 0, 0);

  return nextStart.getTime() - et.getTime();
}

/**
 * DNC pre-flight check. Returns true if safe to send.
 */
export async function dncPreFlight(
  leadId: string,
  channel: "whatsapp" | "email" | "sms",
): Promise<{ allowed: boolean; reason?: string }> {
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    select: { optedOut: true, phone: true, email: true },
  });

  if (!lead) return { allowed: false, reason: "lead_not_found" };
  if (lead.optedOut) return { allowed: false, reason: "opted_out" };

  if (channel === "email" && !lead.email) return { allowed: false, reason: "no_email" };
  if ((channel === "whatsapp" || channel === "sms") && !lead.phone) return { allowed: false, reason: "no_phone" };

  const dncEntry = await db.dncList.findFirst({ where: { leadId } });
  if (dncEntry) return { allowed: false, reason: "dnc_listed" };

  return { allowed: true };
}

/**
 * Simple in-memory token bucket rate limiter.
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillRate: number, // tokens per second
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async take(): Promise<void> {
    this.refill();
    while (this.tokens < 1) {
      const waitMs = (1 / this.refillRate) * 1000;
      await new Promise((r) => setTimeout(r, waitMs));
      this.refill();
    }
    this.tokens--;
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}

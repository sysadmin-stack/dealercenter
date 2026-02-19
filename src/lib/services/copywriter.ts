import type { Lead, Channel } from "@/generated/prisma/client";
import { createHash } from "crypto";
import IORedis from "ioredis";
import { generateWithClaude } from "../clients/claude";
import { buildSystemPrompt, buildUserPrompt } from "../prompts/copywriter";
import { getFallbackTemplate } from "../templates/fallback";

export interface CopywriterResult {
  subject?: string;
  text: string;
  html?: string;
  variant: "A" | "B";
  source: "ai" | "fallback";
}

// ─── Redis cache (lazy init) ───

let _redis: IORedis | null = null;

function getRedis(): IORedis {
  if (!_redis) {
    _redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    _redis.connect().catch(() => {
      // Redis unavailable — cache will be skipped
      _redis = null;
    });
  }
  return _redis;
}

const CACHE_TTL = 3600; // 1 hour
const CACHE_PREFIX = "copy:";

function cacheKey(leadId: string, channel: Channel, templateType: string, variant: "A" | "B"): string {
  const hash = createHash("md5")
    .update(`${leadId}:${channel}:${templateType}:${variant}`)
    .digest("hex")
    .slice(0, 12);
  return `${CACHE_PREFIX}${hash}`;
}

// ─── A/B variant selection ───

function getVariant(leadId: string): "A" | "B" {
  // Use last char of UUID to determine variant (roughly 50/50)
  const lastChar = leadId.charAt(leadId.length - 1);
  const num = parseInt(lastChar, 16);
  return num % 2 === 0 ? "A" : "B";
}

// ─── Main function ───

/**
 * Generate a personalized message for a lead using Claude AI.
 * Falls back to templates if the API is unavailable.
 */
export async function generateMessage(
  lead: Lead,
  channel: Channel,
  templateType: string,
): Promise<CopywriterResult> {
  const firstName = lead.name.split(" ")[0];
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const variant = getVariant(lead.id);

  // 1. Check Redis cache
  try {
    const redis = getRedis();
    const key = cacheKey(lead.id, channel, templateType, variant);
    const cached = await redis.get(key);
    if (cached) {
      console.log(`[Copywriter] Cache hit: ${key}`);
      return JSON.parse(cached) as CopywriterResult;
    }
  } catch {
    // Cache miss or Redis unavailable — continue to generate
  }

  // 2. Try Claude API
  try {
    const promptInput = {
      leadName: name,
      channel,
      language: lead.language,
      segment: lead.segment,
      templateType,
      variant,
      source: lead.source,
      creditApp: lead.creditApp,
    };

    const systemPrompt = await buildSystemPrompt(promptInput);
    const userPrompt = buildUserPrompt(promptInput);

    const { text: rawResponse } = await generateWithClaude(systemPrompt, userPrompt, {
      maxTokens: channel === "email" ? 1024 : 256,
      temperature: 0.8,
    });

    let result: CopywriterResult;

    if (channel === "email") {
      // Parse JSON response for email
      const parsed = JSON.parse(rawResponse.trim());
      result = {
        subject: parsed.subject,
        text: parsed.text,
        html: parsed.html,
        variant,
        source: "ai",
      };
    } else {
      result = {
        text: rawResponse.trim(),
        variant,
        source: "ai",
      };
    }

    // 3. Cache the result
    try {
      const redis = getRedis();
      const key = cacheKey(lead.id, channel, templateType, variant);
      await redis.set(key, JSON.stringify(result), "EX", CACHE_TTL);
    } catch {
      // Cache write failed — non-critical
    }

    console.log(`[Copywriter] AI generated (${variant}): ${channel}/${templateType} for ${name}`);
    return result;
  } catch (err) {
    // 4. Fallback to templates
    const message = err instanceof Error ? err.message : "Unknown error";
    console.warn(`[Copywriter] AI failed, using fallback: ${message}`);

    const fallback = await getFallbackTemplate(name, channel, lead.language, templateType);
    return {
      ...fallback,
      variant,
      source: "fallback",
    };
  }
}

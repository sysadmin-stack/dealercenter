import { Segment, Language } from "@/generated/prisma/client";
import { getSetting, DEFAULTS } from "@/lib/config/settings";

// ─── Segmentation ───────────────────────────────────────

/**
 * Sync version (backward compat) — uses hardcoded thresholds.
 */
export function getSegment(daysOld: number | null): Segment {
  if (daysOld === null) return Segment.COLD;
  if (daysOld < 90) return Segment.HOT;
  if (daysOld < 365) return Segment.WARM;
  if (daysOld < 730) return Segment.COLD;
  return Segment.FROZEN;
}

/**
 * Async version — reads thresholds from DB settings.
 */
export async function getSegmentAsync(daysOld: number | null): Promise<Segment> {
  const thresholds = await getSetting("segmentation.thresholds", DEFAULTS["segmentation.thresholds"]);
  if (daysOld === null) return Segment.COLD;
  if (daysOld < thresholds.hot) return Segment.HOT;
  if (daysOld < thresholds.warm) return Segment.WARM;
  if (daysOld < thresholds.cold) return Segment.COLD;
  return Segment.FROZEN;
}

/**
 * Sync version (backward compat) — uses hardcoded scores.
 */
export function getScore(
  segment: Segment,
  creditApp: boolean,
  originType: string | null,
  email: string | null,
): number {
  const baseScores: Record<Segment, number> = {
    HOT: 80,
    WARM: 50,
    COLD: 25,
    FROZEN: 10,
  };
  let score = baseScores[segment];
  if (creditApp) score += 20;
  if (originType?.toUpperCase() === "WALK-IN") score += 15;
  if (email) score += 5;
  return score;
}

/**
 * Async version — reads scoring weights from DB settings.
 */
export async function getScoreAsync(
  segment: Segment,
  creditApp: boolean,
  originType: string | null,
  email: string | null,
): Promise<number> {
  const scoring = await getSetting("segmentation.scoring", DEFAULTS["segmentation.scoring"]);
  const baseScores: Record<Segment, number> = {
    HOT: scoring.baseHot,
    WARM: scoring.baseWarm,
    COLD: scoring.baseCold,
    FROZEN: scoring.baseFrozen,
  };
  let score = baseScores[segment];
  if (creditApp) score += scoring.creditAppBonus;
  if (originType?.toUpperCase() === "WALK-IN") score += scoring.walkInBonus;
  if (email) score += scoring.emailBonus;
  return score;
}

// ─── Language Detection ─────────────────────────────────

const PT_PATTERNS = [
  /\bsilvan[ao]\b/i,
  /\blucian[ao]\b/i,
  /\bmatheus\b/i,
  /\bjoao\b/i,
  /\bmaria\b/i,
  /\bjose\b/i,
  /\bcarlos\b/i,
  /\bpaulo\b/i,
  /\bpedro\b/i,
  /\bana\b/i,
  /\brafael\b/i,
  /\bbruno\b/i,
  /\bthiago\b/i,
  /\brendl?\b/i,
  /\bguilherme\b/i,
  /\bfernand[ao]\b/i,
  /\bvictor\b/i,
  /\bfelipe\b/i,
  /\bleandro\b/i,
  /\broberto\b/i,
  /\brenan\b/i,
  /\bedson\b/i,
  /\bwellington\b/i,
  /\bnatalia\b/i,
  /\bpatricia\b/i,
  /\bfranco\b/i,
  /\bda silva\b/i,
  /\bde oliveira\b/i,
  /\bsantos\b/i,
  /\btodisco\b/i,
  /\bde souza\b/i,
  /\bpereira\b/i,
  /\balmeida\b/i,
  /\bnascimento\b/i,
  /\bribeiro\b/i,
  /\blima\b/i,
  /\bde jesus\b/i,
  /\bgoes\b/i,
  /\btavares\b/i,
];

const ES_PATTERNS = [
  /\brivera\b/i,
  /\bvelez\b/i,
  /\brodriguez\b/i,
  /\bhernandez\b/i,
  /\bgarcia\b/i,
  /\bmartinez\b/i,
  /\blopez\b/i,
  /\bgonzalez\b/i,
  /\bdiaz\b/i,
  /\bmorales\b/i,
  /\bramirez\b/i,
  /\btorres\b/i,
  /\bflores\b/i,
  /\bcruz\b/i,
  /\bsanchez\b/i,
  /\bcastillo\b/i,
  /\breyes\b/i,
  /\bortiz\b/i,
  /\bvargas\b/i,
  /\bmendez\b/i,
  /\bramos\b/i,
  /\bdelgado\b/i,
];

export function detectLanguage(name: string): Language {
  if (PT_PATTERNS.some((p) => p.test(name))) return Language.PT;
  if (ES_PATTERNS.some((p) => p.test(name))) return Language.ES;
  return Language.EN;
}

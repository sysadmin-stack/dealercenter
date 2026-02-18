import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";

export async function GET() {
  const checks: Record<string, string> = {};
  let overall = "ok";

  // Redis check
  try {
    const pong = await redis.ping();
    checks.redis = pong === "PONG" ? "connected" : "error";
  } catch {
    checks.redis = "disconnected";
    overall = "degraded";
  }

  // PostgreSQL check
  try {
    await db.$queryRawUnsafe("SELECT 1");
    checks.postgres = "connected";
  } catch {
    checks.postgres = "disconnected";
    overall = "degraded";
  }

  const status = overall === "ok" ? 200 : 503;

  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      services: checks,
    },
    { status },
  );
}

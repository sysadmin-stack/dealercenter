import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    const redisStatus = await redis.ping();

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        redis: redisStatus === "PONG" ? "connected" : "error",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        services: {
          redis: "disconnected",
        },
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

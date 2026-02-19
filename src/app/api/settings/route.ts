import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { invalidateCache } from "@/lib/config/settings";

/**
 * GET /api/settings — returns all settings as { [key]: value }
 * GET /api/settings?key=dealer.identity — returns single setting
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get("key");

  if (key) {
    const setting = await db.dealerSettings.findUnique({ where: { key } });
    if (!setting) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }
    return NextResponse.json({ key: setting.key, value: setting.value });
  }

  const all = await db.dealerSettings.findMany({
    orderBy: { key: "asc" },
  });

  const result: Record<string, unknown> = {};
  for (const s of all) {
    result[s.key] = s.value;
  }

  return NextResponse.json({ data: result });
}

/**
 * PUT /api/settings — upsert a setting
 * Body: { key: string, value: any }
 */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { key, value } = body;

  if (!key || typeof key !== "string") {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  if (value === undefined) {
    return NextResponse.json({ error: "value is required" }, { status: 400 });
  }

  await db.dealerSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  // Invalidate cache so next read fetches fresh data
  invalidateCache(key);

  return NextResponse.json({ ok: true, key, value });
}

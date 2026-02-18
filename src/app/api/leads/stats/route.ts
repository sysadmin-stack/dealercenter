import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [segments, languages, total, optedOut, withEmail, withPhone] =
    await Promise.all([
      db.lead.groupBy({ by: ["segment"], _count: true }),
      db.lead.groupBy({ by: ["language"], _count: true }),
      db.lead.count(),
      db.lead.count({ where: { optedOut: true } }),
      db.lead.count({ where: { email: { not: null } } }),
      db.lead.count({ where: { phone: { not: null } } }),
    ]);

  const bySegment: Record<string, number> = {};
  for (const s of segments) bySegment[s.segment] = s._count;

  const byLanguage: Record<string, number> = {};
  for (const l of languages) byLanguage[l.language] = l._count;

  return NextResponse.json({
    total,
    optedOut,
    withEmail,
    withPhone,
    bySegment,
    byLanguage,
  });
}

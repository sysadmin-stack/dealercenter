import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { leadFiltersSchema } from "@/lib/validators/lead";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = leadFiltersSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid filters", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const {
    page,
    limit,
    segment,
    language,
    status,
    search,
    optedOut,
    tag,
    salesRep,
    source,
    sortBy,
    sortOrder,
  } = parsed.data;

  const where: Prisma.LeadWhereInput = {};

  if (segment) where.segment = segment;
  if (language) where.language = language;
  if (status) where.status = status;
  if (optedOut !== undefined) where.optedOut = optedOut;
  if (salesRep) where.salesRep = { contains: salesRep, mode: "insensitive" };
  if (source) where.source = { contains: source, mode: "insensitive" };
  if (tag) where.tags = { has: tag };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.lead.count({ where }),
  ]);

  return NextResponse.json({
    data: leads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

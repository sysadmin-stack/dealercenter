import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma v7 requires either `adapter` or `accelerateUrl`.
// The datasource URL is configured in prisma.config.ts.
// This will be updated in Plan 002 when the schema and adapter are set up.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL!,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

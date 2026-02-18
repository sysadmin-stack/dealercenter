import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import path from "path";
import "dotenv/config";
import {
  parseDealerCenterXlsx,
  type RawLead,
} from "../src/lib/parsers/dealercenter-xlsx";
import {
  getSegment,
  getScore,
  detectLanguage,
} from "../src/lib/services/lead-segmenter";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Config ─────────────────────────────────────────────

const ADMIN_EMAIL = "asanches@flacenter.com";
const ADMIN_PASSWORD = "123@Gg123";
const ADMIN_NAME = "Antonio Sanches";

const xlsxFiles = [
  { file: "seed/2026.xlsx", year: 2026 },
  // { file: "seed/2025.xlsx", year: 2025 },
];

// ─── Date Parsing ───────────────────────────────────────

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  // MM/DD/YYYY format
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const [, month, day, year] = match;
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return isNaN(d.getTime()) ? null : d;
}

// ─── Main Seed ──────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1. Create admin user
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password: hashedPassword, role: "admin" },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log(`✅ Admin user: ${admin.email} (${admin.id})`);

  // 2. Import leads from each XLSX file
  let totalImported = 0;
  let totalDnc = 0;

  for (const { file, year } of xlsxFiles) {
    const filePath = path.resolve(file);
    console.log(`\n📄 Parsing ${file}...`);

    const rawLeads = parseDealerCenterXlsx(filePath);
    console.log(`   Found ${rawLeads.length} leads in file`);

    let imported = 0;
    let sold = 0;
    let dnc = 0;

    for (const raw of rawLeads) {
      const isSold = raw.status?.toUpperCase() === "SOLD";
      const segment = getSegment(raw.daysOld);
      const score = getScore(segment, raw.creditApp, raw.originType, raw.email);
      const language = detectLanguage(raw.name);
      const isDnc =
        raw.lostReason?.toUpperCase().includes("DNC") ?? false;
      const tags: string[] = isSold ? ["sold"] : [];
      const createdDate = parseDate(raw.createdDate);
      const dob = raw.dob ? parseDate(raw.dob) : null;

      // Dedup by email: if email exists, update; otherwise create
      let lead;
      if (raw.email) {
        const existing = await prisma.lead.findFirst({
          where: { email: raw.email },
        });
        if (existing) {
          lead = await prisma.lead.update({
            where: { id: existing.id },
            data: {
              name: raw.name,
              phone: raw.phone,
              phoneSecondary: raw.phoneSecondary,
              address: raw.address,
              dob,
              salesRep: raw.salesRep,
              source: raw.source,
              originType: raw.originType,
              status: raw.status,
              lostReason: raw.lostReason,
              creditApp: raw.creditApp,
              segment,
              language,
              score,
              daysOld: raw.daysOld,
              optedOut: isDnc,
              tags,
              importedYear: year,
              dealerCreatedAt: createdDate,
            },
          });
        } else {
          lead = await prisma.lead.create({
            data: {
              name: raw.name,
              email: raw.email,
              phone: raw.phone,
              phoneSecondary: raw.phoneSecondary,
              address: raw.address,
              dob,
              salesRep: raw.salesRep,
              source: raw.source,
              originType: raw.originType,
              status: raw.status,
              lostReason: raw.lostReason,
              creditApp: raw.creditApp,
              segment,
              language,
              score,
              daysOld: raw.daysOld,
              optedOut: isDnc,
              tags,
              importedYear: year,
              dealerCreatedAt: createdDate,
            },
          });
        }
      } else {
        // No email — always create
        lead = await prisma.lead.create({
          data: {
            name: raw.name,
            phone: raw.phone,
            phoneSecondary: raw.phoneSecondary,
            address: raw.address,
            dob,
            salesRep: raw.salesRep,
            source: raw.source,
            originType: raw.originType,
            status: raw.status,
            lostReason: raw.lostReason,
            creditApp: raw.creditApp,
            segment,
            language,
            score,
            daysOld: raw.daysOld,
            optedOut: isDnc,
            importedYear: year,
            dealerCreatedAt: createdDate,
          },
        });
      }

      // Create DNC entry if needed
      if (isDnc) {
        await prisma.dncList.create({
          data: {
            leadId: lead.id,
            reason: raw.lostReason,
          },
        });
        dnc++;
      }

      if (isSold) sold++;
      imported++;
    }

    console.log(`   ✅ Imported: ${imported} (SOLD: ${sold}) | DNC: ${dnc}`);
    totalImported += imported;
    totalDnc += dnc;
  }

  // 3. Summary
  console.log("\n" + "─".repeat(50));
  console.log(`📊 Seed complete!`);
  console.log(`   Total imported: ${totalImported}`);
  console.log(`   Total DNC: ${totalDnc}`);

  // 4. Quick stats
  const stats = await prisma.lead.groupBy({
    by: ["segment"],
    _count: true,
  });
  console.log("\n📈 Segment distribution:");
  for (const s of stats) {
    console.log(`   ${s.segment}: ${s._count}`);
  }

  const langStats = await prisma.lead.groupBy({
    by: ["language"],
    _count: true,
  });
  console.log("\n🌐 Language distribution:");
  for (const l of langStats) {
    console.log(`   ${l.language}: ${l._count}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

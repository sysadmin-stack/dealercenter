import "dotenv/config";
import IORedis from "bullmq/node_modules/ioredis";
import { createWhatsAppWorker } from "./whatsapp-worker";
import { createEmailWorker } from "./email-worker";
import { createSmsWorker } from "./sms-worker";
import { createAnalyticsWorker, scheduleAnalyticsJobs } from "./analytics-worker";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

console.log("🚀 Starting dispatch workers...");
console.log(`   Redis: ${REDIS_URL}`);

const whatsappWorker = createWhatsAppWorker(connection);
const emailWorker = createEmailWorker(connection);
const smsWorker = createSmsWorker(connection);
const analyticsWorker = createAnalyticsWorker(connection);

// Schedule recurring analytics jobs
scheduleAnalyticsJobs(connection).catch((err) =>
  console.error("Failed to schedule analytics jobs:", err),
);

console.log("✅ Workers started:");
console.log("   - WhatsApp  (concurrency: 5, rate: 10/min, window: 8h-20h ET)");
console.log("   - Email     (concurrency: 10, rate: 10/s)");
console.log("   - SMS       (concurrency: 3, rate: 1/s, window: 9h-20h ET)");
console.log("   - Analytics (daily at 2:00 AM ET)");

// Graceful shutdown
async function shutdown() {
  console.log("\n🛑 Shutting down workers...");
  await Promise.all([
    whatsappWorker.close(),
    emailWorker.close(),
    smsWorker.close(),
    analyticsWorker.close(),
  ]);
  await connection.quit();
  console.log("👋 Workers stopped.");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

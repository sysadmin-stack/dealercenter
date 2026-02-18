import { Queue } from "bullmq";
import IORedis from "bullmq/node_modules/ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const whatsappQueue = new Queue("whatsapp", { connection });
export const emailQueue = new Queue("email", { connection });
export const smsQueue = new Queue("sms", { connection });
export const aiQueue = new Queue("ai-generation", { connection });

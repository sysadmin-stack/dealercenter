// Re-export Prisma generated types
export type {
  Lead,
  Campaign,
  Touch,
  TouchEvent,
  Conversation,
  DncList,
  AuditLog,
  User,
} from "@/generated/prisma/client";

// Re-export Prisma enums
export {
  Segment,
  Language,
  Channel,
  TouchStatus,
  CampaignStatus,
  ConversationStatus,
} from "@/generated/prisma/client";

// App types
export interface HealthCheckResponse {
  status: "ok" | "degraded";
  timestamp: string;
  services: {
    redis: "connected" | "disconnected" | "error";
    database?: "connected" | "disconnected" | "error";
  };
  error?: string;
}

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  dnc: number;
  errors: string[];
}

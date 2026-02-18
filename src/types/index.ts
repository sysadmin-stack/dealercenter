export type LeadSegment = "HOT" | "WARM" | "COLD" | "FROZEN";

export type CampaignChannel = "whatsapp" | "email" | "sms";

export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export type DispatchStatus = "pending" | "sent" | "delivered" | "read" | "replied" | "failed" | "bounced";

export type ConversationStatus = "ai" | "human" | "closed";

export interface HealthCheckResponse {
  status: "ok" | "degraded";
  timestamp: string;
  services: {
    redis: "connected" | "disconnected" | "error";
    database?: "connected" | "disconnected" | "error";
  };
  error?: string;
}

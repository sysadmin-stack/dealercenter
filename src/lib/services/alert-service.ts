import { createLogger } from "@/lib/logger";

const log = createLogger("alert-service");

const WAHA_API_URL = process.env.WAHA_API_URL || "http://localhost:3001";
const WAHA_API_KEY = process.env.WAHA_API_KEY || "";
const WAHA_SESSION = process.env.WAHA_SESSION || "default";
const ALERT_PHONE = process.env.SALES_REP_PHONE || "";

/**
 * Send an alert message to the configured phone number via WhatsApp.
 * Used for critical system alerts (worker down, high error rate, etc.).
 */
export async function sendAlert(message: string): Promise<void> {
  if (!ALERT_PHONE) {
    log.warn("SALES_REP_PHONE not configured, alert not sent");
    return;
  }

  const chatId = ALERT_PHONE.replace(/^\+/, "") + "@c.us";

  try {
    const res = await fetch(`${WAHA_API_URL}/api/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": WAHA_API_KEY,
      },
      body: JSON.stringify({
        session: WAHA_SESSION,
        chatId,
        text: `[FAC ALERT] ${message}`,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      log.error({ status: res.status, body: text }, "Failed to send alert");
    } else {
      log.info("Alert sent to %s", ALERT_PHONE);
    }
  } catch (err) {
    log.error({ err }, "Alert delivery failed");
  }
}

/**
 * Pre-built alert functions for common scenarios.
 */
export const alerts = {
  workerDown(workerName: string, error: string) {
    return sendAlert(`Worker "${workerName}" stopped: ${error}`);
  },

  highErrorRate(channel: string, rate: number) {
    return sendAlert(
      `High error rate on ${channel}: ${rate.toFixed(1)}% of recent sends failed`,
    );
  },

  wahaDisconnected() {
    return sendAlert("WAHA WhatsApp session disconnected. Messages will not be delivered.");
  },

  dbConnectionLost() {
    return sendAlert("PostgreSQL connection lost. App is degraded.");
  },
};

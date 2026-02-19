import { NextResponse } from "next/server";
import { auth } from "@/auth";

interface HealthResult {
  service: string;
  status: "connected" | "error" | "not_configured";
  message?: string;
}

async function checkResend(): Promise<HealthResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_placeholder") {
    return { service: "resend", status: "not_configured", message: "API key missing" };
  }
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return {
      service: "resend",
      status: res.ok ? "connected" : "error",
      message: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return { service: "resend", status: "error", message: String(err) };
  }
}

async function checkWaha(): Promise<HealthResult> {
  const apiUrl = process.env.WAHA_API_URL;
  const apiKey = process.env.WAHA_API_KEY;
  const session = process.env.WAHA_SESSION || "default";
  if (!apiUrl || !apiKey) {
    return { service: "waha", status: "not_configured", message: "API URL or key missing" };
  }
  try {
    const res = await fetch(`${apiUrl}/api/sessions/${session}`, {
      headers: { "X-Api-Key": apiKey },
    });
    if (!res.ok) {
      return { service: "waha", status: "error", message: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as { status?: string };
    return {
      service: "waha",
      status: data.status === "WORKING" ? "connected" : "error",
      message: data.status !== "WORKING" ? `Session status: ${data.status}` : undefined,
    };
  } catch (err) {
    return { service: "waha", status: "error", message: String(err) };
  }
}

async function checkTwilio(): Promise<HealthResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || sid === "placeholder") {
    return { service: "twilio", status: "not_configured", message: "SID or token missing" };
  }
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      },
    });
    return {
      service: "twilio",
      status: res.ok ? "connected" : "error",
      message: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return { service: "twilio", status: "error", message: String(err) };
  }
}

async function checkChatwoot(): Promise<HealthResult> {
  const url = process.env.CHATWOOT_URL;
  const token = process.env.CHATWOOT_API_TOKEN;
  const accountId = process.env.CHATWOOT_ACCOUNT_ID || "1";
  if (!url || !token) {
    return { service: "chatwoot", status: "not_configured", message: "URL or token missing" };
  }
  try {
    const res = await fetch(`${url}/api/v1/accounts/${accountId}/contacts?page=1`, {
      headers: { api_access_token: token },
    });
    return {
      service: "chatwoot",
      status: res.ok ? "connected" : "error",
      message: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return { service: "chatwoot", status: "error", message: String(err) };
  }
}

async function checkClaude(): Promise<HealthResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "placeholder") {
    return { service: "claude", status: "not_configured", message: "API key missing" };
  }
  // Just verify the key format is valid (don't make an actual API call)
  return {
    service: "claude",
    status: apiKey.startsWith("sk-ant-") ? "connected" : "error",
    message: apiKey.startsWith("sk-ant-") ? undefined : "Invalid key format",
  };
}

function checkN8n(): HealthResult {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  return {
    service: "n8n",
    status: secret ? "connected" : "not_configured",
    message: secret ? undefined : "Webhook secret missing",
  };
}

/**
 * GET /api/settings/health — check integration health
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await Promise.all([
    checkResend(),
    checkWaha(),
    checkTwilio(),
    checkChatwoot(),
    checkClaude(),
  ]);

  results.push(checkN8n());

  // Also report which env vars are configured (without values)
  const envStatus: Record<string, boolean> = {
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: !!process.env.RESEND_FROM_EMAIL,
    RESEND_WEBHOOK_SECRET: !!process.env.RESEND_WEBHOOK_SECRET,
    TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER,
    WAHA_API_URL: !!process.env.WAHA_API_URL,
    WAHA_API_KEY: !!process.env.WAHA_API_KEY,
    WAHA_SESSION: !!process.env.WAHA_SESSION,
    CHATWOOT_URL: !!process.env.CHATWOOT_URL,
    CHATWOOT_API_TOKEN: !!process.env.CHATWOOT_API_TOKEN,
    CHATWOOT_ACCOUNT_ID: !!process.env.CHATWOOT_ACCOUNT_ID,
    CHATWOOT_INBOX_ID: !!process.env.CHATWOOT_INBOX_ID,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    N8N_WEBHOOK_SECRET: !!process.env.N8N_WEBHOOK_SECRET,
    SALES_REP_PHONE: !!process.env.SALES_REP_PHONE,
  };

  return NextResponse.json({ services: results, envStatus });
}

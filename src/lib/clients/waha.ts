import { getSetting, DEFAULTS } from "@/lib/config/settings";

// API key stays in env (secret)
const WAHA_API_KEY = process.env.WAHA_API_KEY || "";

async function getConfig() {
  return getSetting("integration.waha", DEFAULTS["integration.waha"]);
}

interface WahaSendResult {
  id: string;
  timestamp: number;
}

async function wahaFetch<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const config = await getConfig();
  const res = await fetch(`${config.apiUrl}${path}`, {
    method: "POST",
    headers: {
      "X-Api-Key": WAHA_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new Error("WAHA: Unauthorized (check API key)");
  if (res.status === 429) throw new Error("WAHA: Rate limited");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WAHA: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function checkSession(): Promise<boolean> {
  try {
    const config = await getConfig();
    const res = await fetch(
      `${config.apiUrl}/api/sessions/${config.session}`,
      { headers: { "X-Api-Key": WAHA_API_KEY } },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data.status === "WORKING";
  } catch {
    return false;
  }
}

/**
 * Send a text message via WAHA.
 * @param phone E.164 phone number (e.g. +14075774133)
 * @param text Message text
 */
export async function sendWhatsApp(
  phone: string,
  text: string,
): Promise<WahaSendResult> {
  const config = await getConfig();
  // Convert +14075774133 → 14075774133@c.us
  const chatId = phone.replace(/^\+/, "") + "@c.us";

  return wahaFetch<WahaSendResult>("/api/sendText", {
    session: config.session,
    chatId,
    text,
  });
}

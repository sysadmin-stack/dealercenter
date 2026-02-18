const CHATWOOT_URL = process.env.CHATWOOT_URL || "http://localhost:3000";
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN || "";
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || "1";
const CHATWOOT_INBOX_ID = process.env.CHATWOOT_INBOX_ID || "1";

function apiUrl(path: string): string {
  return `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}${path}`;
}

async function chatwootFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      api_access_token: CHATWOOT_API_TOKEN,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Chatwoot ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types ───

interface ChatwootContact {
  id: number;
  name: string;
  phone_number?: string;
  email?: string;
}

interface ChatwootConversation {
  id: number;
  inbox_id: number;
  contact_id: number;
  status: string;
}

interface ChatwootMessage {
  id: number;
  content: string;
  message_type: number;
}

// ─── API Methods ───

/**
 * Create or find a contact in Chatwoot.
 */
export async function createContact(params: {
  name: string;
  phone?: string | null;
  email?: string | null;
}): Promise<ChatwootContact> {
  // Try to find existing contact by phone
  if (params.phone) {
    try {
      const search = await chatwootFetch<{
        payload: ChatwootContact[];
      }>(`/contacts/search?q=${encodeURIComponent(params.phone)}`);

      if (search.payload.length > 0) {
        return search.payload[0];
      }
    } catch {
      // Search failed — create new
    }
  }

  const result = await chatwootFetch<{ payload: { contact: ChatwootContact } }>(
    "/contacts",
    {
      method: "POST",
      body: {
        name: params.name,
        phone_number: params.phone,
        email: params.email,
      },
    },
  );

  return result.payload.contact;
}

/**
 * Create a new conversation for a contact.
 */
export async function createConversation(
  contactId: number,
  inboxId?: string,
): Promise<ChatwootConversation> {
  return chatwootFetch<ChatwootConversation>("/conversations", {
    method: "POST",
    body: {
      contact_id: contactId,
      inbox_id: Number(inboxId ?? CHATWOOT_INBOX_ID),
      status: "open",
    },
  });
}

/**
 * Send a message in a conversation.
 * @param messageType 0=incoming (from customer), 1=outgoing (from agent)
 */
export async function sendMessage(
  conversationId: number,
  content: string,
  messageType: 0 | 1 = 1,
): Promise<ChatwootMessage> {
  return chatwootFetch<ChatwootMessage>(
    `/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: {
        content,
        message_type: messageType,
        private: false,
      },
    },
  );
}

/**
 * Assign a conversation to an agent.
 */
export async function assignAgent(
  conversationId: number,
  agentId: number,
): Promise<void> {
  await chatwootFetch(`/conversations/${conversationId}/assignments`, {
    method: "POST",
    body: { assignee_id: agentId },
  });
}

/**
 * Add a private note to a conversation (for context/history).
 */
export async function addNote(
  conversationId: number,
  content: string,
): Promise<void> {
  await chatwootFetch<ChatwootMessage>(
    `/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: {
        content,
        message_type: 1,
        private: true,
      },
    },
  );
}

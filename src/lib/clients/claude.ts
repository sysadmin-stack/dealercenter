import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "placeholder",
    });
  }
  return _client;
}

export interface ClaudeResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Generate text via Claude API with error handling and token logging.
 */
export async function generateWithClaude(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  },
): Promise<ClaudeResponse> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: options?.maxTokens ?? 512,
    temperature: options?.temperature ?? 0.8,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;

  console.log(
    `[Claude] tokens: ${inputTokens} in / ${outputTokens} out (${inputTokens + outputTokens} total)`,
  );

  return { text, inputTokens, outputTokens };
}

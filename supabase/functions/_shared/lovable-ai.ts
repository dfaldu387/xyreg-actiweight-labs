/**
 * Shared Lovable AI Gateway helper for derivative document features
 * (translation, work-instruction generation, …).
 *
 * Uses the auto-provisioned LOVABLE_API_KEY secret. Replaces the previous
 * Vertex-AI service-account flow (which broke when the GCP key was rotated).
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export class LovableAIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function callGemini(opts: {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonOutput?: boolean;
}): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new LovableAIError("LOVABLE_API_KEY is not configured", 500);
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (opts.systemInstruction) {
    messages.push({ role: "system", content: opts.systemInstruction });
  }
  messages.push({ role: "user", content: opts.prompt });

  const body: Record<string, unknown> = {
    model: opts.model ?? "google/gemini-2.5-flash",
    messages,
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxOutputTokens ?? 8192,
  };
  if (opts.jsonOutput) {
    body.response_format = { type: "json_object" };
  }

  const resp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    if (resp.status === 429) {
      throw new LovableAIError("AI rate limit exceeded — please retry shortly.", 429);
    }
    if (resp.status === 402) {
      throw new LovableAIError(
        "AI workspace credits exhausted — top up at Settings → Workspace → Usage.",
        402,
      );
    }
    throw new LovableAIError(`AI gateway error [${resp.status}]: ${text}`, resp.status);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}
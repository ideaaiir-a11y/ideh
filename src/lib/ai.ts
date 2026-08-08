import ZAI from "z-ai-web-dev-sdk";

// Reuse a single ZAI instance across requests (default provider)
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

export async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export interface ProviderConfig {
  useCustomProvider: boolean;
  apiBaseUrl: string;
  apiKey: string;
  apiModel: string;
}

export async function getDefaultProvider(): Promise<ProviderConfig> {
  let apiKey = (process.env.ZAI_API_KEY || "").trim();
  let baseUrl = (process.env.ZAI_BASE_URL || "").trim();

  if (!apiKey || !baseUrl) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const envPath = path.join(process.cwd(), ".env");
      const raw = fs.readFileSync(envPath, "utf8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq < 0) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim();
        if (key === "ZAI_API_KEY") apiKey = val;
        if (key === "ZAI_BASE_URL") baseUrl = val;
      }
    } catch {
      // ignore
    }
  }

  if (!apiKey || !baseUrl) {
    throw new Error(
      "ZAI_API_KEY و ZAI_BASE_URL در فایل .env تعریف نشده‌اند. لطفاً آن‌ها را مقداردهی کنید."
    );
  }
  return {
    useCustomProvider: true,
    apiBaseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    apiModel: "hoosh-no",
  };
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Build the message array expected by the SDK.
 * The SDK uses the "assistant" role for the system prompt.
 */
export function buildMessages(
  systemPrompt: string,
  history: ChatTurn[]
): { role: "assistant" | "user"; content: string }[] {
  return [
    { role: "assistant", content: systemPrompt },
    ...history.map((t) => ({
      role: t.role,
      content: t.content,
    })),
  ];
}

/**
 * Ask the LLM to generate a short conversation title from the first
 * user message. Tries the custom provider first if configured, then
 * falls back to the default SDK.
 */
export async function generateTitle(
  firstMessage: string,
  provider?: ProviderConfig
): Promise<string> {
  try {
    const titlePrompt =
      "عنوان‌های بسیار کوتاه گفت‌وگو تولید کن (۳ تا ۶ واژه فارسی، بدون گیومه، بدون نقطه در انتها). فقط عنوان را پاسخ بده.";

    if (provider?.useCustomProvider && provider.apiBaseUrl && provider.apiKey) {
      const res = await fetchCustomCompletion(provider, {
        messages: [
          { role: "system", content: titlePrompt },
          { role: "user", content: firstMessage.slice(0, 500) },
        ],
        stream: false,
      });
      const title = res?.choices?.[0]?.message?.content?.trim();
      if (title) return sanitizeTitle(title);
    }

    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: titlePrompt },
        { role: "user", content: firstMessage.slice(0, 500) },
      ],
      stream: false,
      thinking: { type: "disabled" },
    });
    const title = completion.choices?.[0]?.message?.content?.trim();
    if (!title) return fallbackTitle(firstMessage);
    return sanitizeTitle(title);
  } catch {
    return fallbackTitle(firstMessage);
  }
}

function sanitizeTitle(title: string): string {
  return title.replace(/^["'`]|["'`]$/g, "").slice(0, 60);
}

function fallbackTitle(msg: string): string {
  const clean = msg.replace(/\s+/g, " ").trim();
  if (clean.length <= 40) return clean || "گفت‌وگوی جدید";
  return clean.slice(0, 40) + "…";
}

/* ============================================================
   Custom OpenAI-compatible provider
   ============================================================ */

export interface ProviderConfig {
  useCustomProvider: boolean;
  apiBaseUrl: string;
  apiKey: string;
  apiModel: string;
}

interface CompletionOptions {
  messages: any[];
  stream?: boolean;
  thinking?: { type: string };
  model?: string;
}

interface CompletionResponse {
  choices?: Array<{
    message?: { content?: string; reasoning_content?: string };
    delta?: { content?: string; reasoning_content?: string };
  }>;
}

/**
 * Normalize a base URL so it ends with /chat/completions for the
 * OpenAI-compatible chat endpoint. Accepts inputs like:
 *   - https://api.openai.com/v1
 *   - https://api.openai.com/v1/
 *   - https://api.openai.com/v1/chat/completions
 */
function normalizeChatUrl(baseUrl: string): string {
  let url = baseUrl.trim();
  if (!url) return "";
  // Strip trailing slash
  url = url.replace(/\/+$/, "");
  if (url.endsWith("/chat/completions")) return url;
  if (url.endsWith("/chat")) return url + "/completions";
  return url + "/chat/completions";
}

const DEFAULT_TIMEOUT_MS = 30000;

function withTimeout(url: string, init?: RequestInit & { timeout?: number }): Promise<Response> {
  const timeout = init?.timeout ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Send a non-streaming completion to the custom provider.
 */
export async function fetchCustomCompletion(
  provider: ProviderConfig,
  opts: CompletionOptions
): Promise<CompletionResponse> {
  const url = normalizeChatUrl(provider.apiBaseUrl);
  const res = await withTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model || provider.apiModel || "gpt-4o-mini",
      messages: opts.messages,
      stream: false,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Provider error ${res.status}: ${txt.slice(0, 300)}`);
  }
  return (await res.json()) as CompletionResponse;
}

/**
 * Create a streaming reader for the custom provider. Returns an async
 * iterable of raw SSE "data:" text chunks (same shape the default SDK
 * yields), so the chat route's existing `extractDeltas` parser works
 * unchanged.
 */
export async function* streamCustomCompletion(
  provider: ProviderConfig,
  opts: CompletionOptions
): AsyncGenerator<Uint8Array> {
  const url = normalizeChatUrl(provider.apiBaseUrl);
  const res = await withTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model: opts.model || provider.apiModel || "gpt-4o-mini",
      messages: opts.messages,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Provider error ${res.status}: ${txt.slice(0, 300)}`);
  }
  const reader = res.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Test connectivity to a custom provider with a tiny request.
 * Returns { ok, message }.
 */
export async function testProviderConnection(
  provider: ProviderConfig
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetchCustomCompletion(provider, {
      messages: [
        { role: "system", content: "ping" },
        { role: "user", content: "ping" },
      ],
      stream: false,
    });
    const content = res?.choices?.[0]?.message?.content;
    if (content !== undefined) {
      return { ok: true, message: "اتصال موفق بود" };
    }
    return { ok: false, message: "پاسخ نامعتبر از ارائه‌دهنده" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطای ناشناخته";
    return { ok: false, message: msg };
  }
}

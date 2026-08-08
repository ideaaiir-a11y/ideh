import { NextRequest } from "next/server";
import {
  getZAI,
  buildMessages,
  type ProviderConfig,
  getDefaultProvider,
} from "@/lib/ai";
import { validateRemoteApiKey } from "@/lib/remote-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * OpenAI-compatible chat completions endpoint.
 *
 * POST /api/v1/chat/completions
 * Authorization: Bearer <api-key>
 * Body: { model, messages, stream?, temperature?, max_tokens?, ... }
 *
 * Returns a standard OpenAI response:
 *  - Non-stream: { id, object: "chat.completion", choices: [...], usage: {...} }
 *  - Stream: SSE `data: { ... }` chunks ending with `data: [DONE]`
 *
 * This lets any OpenAI client (curl, Python openai SDK, JS, etc.)
  * connect to "ایده" remotely.
 */

interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool" | "function";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  name?: string;
}

interface ChatCompletionRequest {
  model?: string;
  messages: OpenAIMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  // allow the client to optionally pass a custom provider config so the
  // remote request is forwarded to the user's own OpenAI-compatible
  // endpoint instead of the default ZAI SDK.
  provider?: ProviderConfig;
  // allow the client to disable the default system prompt
  no_default_system_prompt?: boolean;
}

/** Convert a chunk from the SDK stream into a UTF-8 string. */
function chunkToString(chunk: unknown): string {
  if (typeof chunk === "string") return chunk;
  if (chunk instanceof Uint8Array) return Buffer.from(chunk).toString("utf8");
  if (chunk && typeof chunk === "object") {
    const c = chunk as { data?: unknown; length?: number };
    if (c.data) return Buffer.from(c.data as Uint8Array).toString("utf8");
    if (typeof c.length === "number") {
      return Buffer.from(chunk as Uint8Array).toString("utf8");
    }
  }
  return String(chunk);
}

interface ParsedDelta {
  content?: string;
  reasoning?: string;
}

/** Parse SSE "data: {...}" lines and yield content + reasoning deltas. */
function* extractDeltas(sseText: string): Generator<ParsedDelta> {
  for (const line of sseText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (payload === "[DONE]") continue;
    try {
      const json = JSON.parse(payload);
      const delta = json?.choices?.[0]?.delta;
      if (!delta) continue;
      const content =
        typeof delta.content === "string" ? delta.content : undefined;
      const reasoning =
        typeof delta.reasoning_content === "string"
          ? delta.reasoning_content
          : undefined;
      if (content || reasoning) yield { content, reasoning };
    } catch {
      // ignore malformed lines
    }
  }
}

function genId(): string {
  return "chatcmpl-" + Math.random().toString(36).slice(2, 12);
}

function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

/** Flatten OpenAI multimodal content (text parts only) into a string. */
function flattenContent(
  content: OpenAIMessage["content"]
): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((p) => (p.type === "text" && p.text ? p.text : ""))
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: NextRequest) {
  // ---- Auth ----
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const { ok, config } = await validateRemoteApiKey(authHeader);
  if (!ok || !config) {
    return new Response(
      JSON.stringify({
        error: {
          message: "احراز هویت ناموفق بود. کلید API معتبر نیست یا دسترسی از راه دور غیرفعال است.",
          type: "invalid_api_key",
          code: "invalid_api_key",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  // ---- Parse body ----
  let body: ChatCompletionRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          message: "بدنهٔ درخواست نامعتبر است (JSON مورد انتظار است).",
          type: "invalid_request_error",
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(
      JSON.stringify({
        error: {
          message: "فیلد «messages» الزامی است و نمی‌تواند خالی باشد.",
          type: "invalid_request_error",
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  const wantStream = body.stream === true;

  // Always use the configured default provider for remote API
  const provider = await getDefaultProvider();
  const useCustom = provider.apiBaseUrl && provider.apiKey;

  const sdkMessages: { role: "assistant" | "user"; content: string }[] = [];

  if (!body.no_default_system_prompt && config.defaultSystemPrompt) {
    if (useCustom) {
      sdkMessages.push({ role: "assistant", content: config.defaultSystemPrompt });
    } else {
      sdkMessages.push({ role: "assistant", content: config.defaultSystemPrompt });
    }
  }

  for (const m of body.messages) {
    const text = flattenContent(m.content);
    if (!text) continue;
    if (m.role === "system") {
      // SDK uses "assistant" for system prompts; custom provider uses "system"
      sdkMessages.push({ role: "assistant", content: text });
    } else if (m.role === "user") {
      sdkMessages.push({ role: "user", content: text });
    } else if (m.role === "assistant") {
      sdkMessages.push({ role: "assistant", content: text });
    }
    // tool / function roles are ignored for v1
  }

  if (sdkMessages.filter((m) => m.role === "user").length === 0) {
    return new Response(
      JSON.stringify({
        error: {
          message: "حداقل یک پیام با نقش «user» لازم است.",
          type: "invalid_request_error",
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  const completionId = genId();
  const created = nowUnix();
  const model = body.model || provider.apiModel;

  // ============================================================
  // Non-streaming response
  // ============================================================
  if (!wantStream) {
    try {
      let assistantContent = "";
      let reasoningContent = "";

      if (useCustom) {
        const { fetchCustomCompletion } = await import("@/lib/ai");
        const res = await fetchCustomCompletion(provider, {
          messages: sdkMessages.map((m) =>
            m.role === "assistant"
              ? { role: "system" as const, content: m.content }
              : { role: "user" as const, content: m.content }
          ),
          stream: false,
        });
        assistantContent = res?.choices?.[0]?.message?.content ?? "";
      } else {
        const zai = await getZAI();
        const completion: any = await zai.chat.completions.create({
          messages: buildMessages(
            sdkMessages[0]?.content ?? "",
            sdkMessages.slice(1).map((m) => ({
              role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
              content: m.content,
            }))
          ),
          stream: false,
          thinking: { type: "disabled" },
        });
        assistantContent = completion?.choices?.[0]?.message?.content ?? "";
        reasoningContent =
          completion?.choices?.[0]?.message?.reasoning_content ?? "";
      }

      const response = {
        id: completionId,
        object: "chat.completion",
        created,
        model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: assistantContent,
              reasoning_content: reasoningContent || undefined,
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: Math.ceil(
            sdkMessages.reduce((a, m) => a + m.content.length, 0) / 4
          ),
          completion_tokens: Math.ceil(assistantContent.length / 4),
          total_tokens: Math.ceil(
            (sdkMessages.reduce((a, m) => a + m.content.length, 0) +
              assistantContent.length) /
              4
          ),
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Remote v1/chat/completions error:", message);
      return new Response(
        JSON.stringify({
          error: {
            message: "خطا در تولید پاسخ: " + message,
            type: "server_error",
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }
  }

  // ============================================================
  // Streaming response (SSE, OpenAI format)
  // ============================================================
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let aborted = false;
      const abortHandler = () => {
        aborted = true;
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      req.signal.addEventListener("abort", abortHandler);

      const sendChunk = (obj: unknown) => {
        if (aborted) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)
          );
        } catch {
          aborted = true;
        }
      };

      // Initial chunk with role
      sendChunk({
        id: completionId,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [
          {
            index: 0,
            delta: { role: "assistant" },
            finish_reason: null,
          },
        ],
      });

      try {
        if (useCustom) {
          const { streamCustomCompletion } = await import("@/lib/ai");
          const gen = streamCustomCompletion(provider, {
            messages: sdkMessages.map((m) =>
              m.role === "assistant"
                ? { role: "system" as const, content: m.content }
                : { role: "user" as const, content: m.content }
            ),
            stream: true,
          });
          for await (const chunk of gen) {
            if (aborted) break;
            const text = chunkToString(chunk);
            for (const delta of extractDeltas(text)) {
              if (aborted) break;
              if (delta.content) {
                sendChunk({
                  id: completionId,
                  object: "chat.completion.chunk",
                  created,
                  model,
                  choices: [
                    {
                      index: 0,
                      delta: { content: delta.content },
                      finish_reason: null,
                    },
                  ],
                });
              }
            }
          }
        } else {
          const zai = await getZAI();
          const res: any = await zai.chat.completions.create({
            messages: buildMessages(
              sdkMessages[0]?.content ?? "",
              sdkMessages.slice(1).map((m) => ({
                role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
                content: m.content,
              }))
            ),
            stream: true,
            thinking: { type: "disabled" },
          });

          for await (const chunk of res) {
            if (aborted) break;
            const text = chunkToString(chunk);
            for (const delta of extractDeltas(text)) {
              if (aborted) break;
              if (delta.content) {
                sendChunk({
                  id: completionId,
                  object: "chat.completion.chunk",
                  created,
                  model,
                  choices: [
                    {
                      index: 0,
                      delta: { content: delta.content },
                      finish_reason: null,
                    },
                  ],
                });
              }
            }
          }
        }

        // Final chunk with finish_reason
        sendChunk({
          id: completionId,
          object: "chat.completion.chunk",
          created,
          model,
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: "stop",
            },
          ],
        });

        // Terminator
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Remote v1/chat/completions stream error:", message);
        if (!aborted) {
          sendChunk({
            error: {
              message: "خطا در جریان پاسخ: " + message,
              type: "server_error",
            },
          });
        }
      } finally {
        req.signal.removeEventListener("abort", abortHandler);
        try {
          if (!aborted) controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

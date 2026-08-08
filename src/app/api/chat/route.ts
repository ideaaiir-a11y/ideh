import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  getZAI,
  buildMessages,
  generateTitle,
  streamCustomCompletion,
  fetchCustomCompletion,
  type ProviderConfig,
  getDefaultProvider,
} from "@/lib/ai";
import { getPersona } from "@/lib/personas";
import { formatProjectContext, type ProjectFile } from "@/lib/project-context";
import { formatMemoryContext, type MemoryItem } from "@/lib/memory-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  conversationId?: string;
  message: string;
  personaId?: string;
  editMessageId?: string;
  thinking?: boolean;
  images?: string[]; // base64 data URLs for vision messages
  isVision?: boolean;
  provider?: ProviderConfig; // custom OpenAI-compatible provider config
  projectFiles?: ProjectFile[]; // attached project files for context
  memory?: MemoryItem[]; // long-term user facts
}

/**
 * Convert a chunk from the SDK stream into a UTF-8 string.
 * The SDK yields Uint8Array / Buffer-like objects containing SSE text.
 */
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

/**
 * Parse SSE "data: {...}" lines and yield content + reasoning deltas.
 */
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

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userMessage = (body.message ?? "").toString().trim();
  if (!userMessage) {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const personaId = body.personaId ?? "default";
  const persona = getPersona(personaId);
  const thinkingEnabled = !!body.thinking;
  const bodyProvider = body.provider;

  // Always use the configured default provider when available
  const defaultProvider = await getDefaultProvider();
  const provider: ProviderConfig | undefined =
    bodyProvider && bodyProvider.useCustomProvider && bodyProvider.apiBaseUrl && bodyProvider.apiKey
      ? bodyProvider
      : defaultProvider.apiBaseUrl && defaultProvider.apiKey
        ? defaultProvider
        : undefined;

  const useCustom = !!provider;

  // Build the augmented system prompt: persona prompt + project context + memory
  const projectCtx = formatProjectContext(body.projectFiles ?? []);
  const memoryCtx = formatMemoryContext(body.memory ?? []);
  const systemPrompt =
    persona.systemPrompt + projectCtx + memoryCtx;

  // Ensure a conversation exists
  let conversationId = body.conversationId;
  let isNewConversation = false;
  try {
    if (!conversationId) {
      const conv = await db.conversation.create({
        data: { personaId: persona.id, title: "گفت‌وگوی جدید" },
      });
      conversationId = conv.id;
      isNewConversation = true;
    } else {
      const existing = await db.conversation.findUnique({
        where: { id: conversationId },
      });
      if (!existing) {
        const conv = await db.conversation.create({
          data: { personaId: persona.id, title: "گفت‌وگوی جدید" },
        });
        conversationId = conv.id;
        isNewConversation = true;
      }
    }
  } catch (e) {
    console.error("DB error creating/finding conversation:", e);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle editing: delete the edited message and all messages after it.
  if (body.editMessageId) {
    try {
      const editedMsg = await db.message.findUnique({
        where: { id: body.editMessageId },
      });
      if (editedMsg && editedMsg.conversationId === conversationId) {
        await db.message.deleteMany({
          where: {
            conversationId,
            createdAt: { gte: editedMsg.createdAt },
          },
        });
      }
    } catch (e) {
      console.error("DB error during edit truncation:", e);
    }
  }

  const priorMessages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  const images = Array.isArray(body.images) ? body.images.slice(0, 4) : [];
  const isVision = !!body.isVision && images.length > 0;
  const storedUserContent = isVision
    ? `${userMessage}\n\n[_تصویر: ${images.length} تصویر پیوست شده_]`
    : userMessage;

  await db.message.create({
    data: { conversationId, role: "user", content: storedUserContent },
  });

  const history = priorMessages
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))
    .concat([{ role: "user", content: userMessage }]);

  // For vision, use multimodal content; otherwise plain text.
  // For custom provider, use "system" role (OpenAI standard).
  const messages = isVision
    ? useCustom
      ? [
          { role: "system", content: systemPrompt },
          ...history.slice(0, -1),
          {
            role: "user" as const,
            content: [
              { type: "text", text: userMessage },
              ...images.map((url) => ({
                type: "image_url" as const,
                image_url: { url },
              })),
            ],
          },
        ]
      : [
          { role: "assistant", content: systemPrompt },
          ...history.slice(0, -1),
          {
            role: "user" as const,
            content: [
              { type: "text", text: userMessage },
              ...images.map((url) => ({
                type: "image_url" as const,
                image_url: { url },
              })),
            ],
          },
        ]
    : useCustom
    ? [
        { role: "system", content: systemPrompt },
        ...history,
      ]
    : buildMessages(systemPrompt, history);

  // Auto-generate a title for the first message
  if (isNewConversation || priorMessages.length === 0) {
    generateTitle(userMessage, useCustom ? provider : undefined)
      .then((title) =>
        db.conversation.update({ where: { id: conversationId }, data: { title } })
      )
      .catch(() => {});
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let aborted = false;
      const abortHandler = () => {
        aborted = true;
        try {
          controller.close();
        } catch {
          // already closed — ignore
        }
      };
      req.signal.addEventListener("abort", abortHandler);

      const send = (obj: unknown) => {
        if (aborted) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)
          );
        } catch {
          aborted = true;
        }
      };

      send({
        type: "meta",
        conversationId,
        personaId: persona.id,
        thinking: thinkingEnabled,
        provider: useCustom ? "custom" : "default",
      });

      let assistantContent = "";
      let reasoningContent = "";
      let started = false;

      try {
        if (useCustom) {
          // -------- Custom OpenAI-compatible provider --------
          if (isVision) {
            // Non-streaming vision for custom provider (compatibility)
            const response = await fetchCustomCompletion(provider!, {
              messages,
              stream: false,
            });
            assistantContent =
              response?.choices?.[0]?.message?.content ?? "";
            if (assistantContent) {
              started = true;
              const tokens =
                assistantContent.match(/\S+\s*/g) ?? [assistantContent];
              for (const tok of tokens) {
                if (aborted) break;
                send({ type: "delta", content: tok });
                await new Promise((r) => setTimeout(r, 8));
              }
            }
          } else {
            // Streaming via fetch SSE
            const gen = streamCustomCompletion(provider!, {
              messages,
              stream: true,
            });
            for await (const chunk of gen) {
              if (aborted) break;
              const text = chunkToString(chunk);
              for (const delta of extractDeltas(text)) {
                if (aborted) break;
                if (delta.content) {
                  assistantContent += delta.content;
                  started = true;
                  send({ type: "delta", content: delta.content });
                }
                if (delta.reasoning) {
                  reasoningContent += delta.reasoning;
                  started = true;
                  send({ type: "reasoning", content: delta.reasoning });
                }
              }
            }

            if (!started && !aborted) {
              // Fallback to non-stream
              const completion = await fetchCustomCompletion(provider!, {
                messages,
                stream: false,
              });
              assistantContent =
                completion?.choices?.[0]?.message?.content ?? "";
              if (assistantContent) {
                send({ type: "delta", content: assistantContent });
              }
            }
          }
        } else {
          // -------- Default ZAI SDK --------
          const zai = await getZAI();

          if (isVision) {
            const response: any = await zai.chat.completions.createVision({
              messages,
              thinking: { type: thinkingEnabled ? "enabled" : "disabled" },
            });
            assistantContent =
              response?.choices?.[0]?.message?.content ?? "";
            reasoningContent =
              response?.choices?.[0]?.message?.reasoning_content ?? "";
            if (reasoningContent) {
              started = true;
              send({ type: "reasoning", content: reasoningContent });
            }
            if (assistantContent) {
              started = true;
              const tokens =
                assistantContent.match(/\S+\s*/g) ?? [assistantContent];
              for (const tok of tokens) {
                if (aborted) break;
                send({ type: "delta", content: tok });
                await new Promise((r) => setTimeout(r, 8));
              }
            }
          } else {
            const res: any = await zai.chat.completions.create({
              messages,
              stream: true,
              thinking: { type: thinkingEnabled ? "enabled" : "disabled" },
            });

            for await (const chunk of res) {
              if (aborted) break;
              const text = chunkToString(chunk);
              for (const delta of extractDeltas(text)) {
                if (aborted) break;
                if (delta.content) {
                  assistantContent += delta.content;
                  started = true;
                  send({ type: "delta", content: delta.content });
                }
                if (delta.reasoning) {
                  reasoningContent += delta.reasoning;
                  started = true;
                  send({ type: "reasoning", content: delta.reasoning });
                }
              }
            }

            if (!started && !aborted) {
              const completion: any = await zai.chat.completions.create({
                messages,
                stream: false,
                thinking: { type: thinkingEnabled ? "enabled" : "disabled" },
              });
              assistantContent =
                completion?.choices?.[0]?.message?.content ?? "";
              reasoningContent =
                completion?.choices?.[0]?.message?.reasoning_content ?? "";
              if (assistantContent) {
                send({ type: "delta", content: assistantContent });
              }
              if (reasoningContent) {
                send({ type: "reasoning", content: reasoningContent });
              }
            }
          }
        }

        // Persist assistant message
        if (assistantContent.trim().length > 0) {
          await db.message.create({
            data: {
              conversationId,
              role: "assistant",
              content: assistantContent,
              reasoning:
                reasoningContent.trim().length > 0
                  ? reasoningContent
                  : null,
            },
          });
          await db.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });
        }

        if (!aborted) {
          send({ type: "done", conversationId });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (!aborted && !(err instanceof Error && err.name === "AbortError")) {
          console.error("Chat stream error:", message);
          send({ type: "error", error: message });
        }
      } finally {
        req.signal.removeEventListener("abort", abortHandler);
        try {
          if (!aborted) controller.close();
        } catch {
          // already closed — ignore
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

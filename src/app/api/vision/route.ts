import { NextRequest, NextResponse } from "next/server";
import { getZAI } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VisionRequestBody {
  prompt: string;
  images: string[]; // base64 data URLs: "data:image/png;base64,..."
  thinking?: boolean;
}

/**
 * Vision Chat endpoint.
 * Accepts one or more base64-encoded images + a text prompt and returns
 * a streamed analysis using the z-ai-web-dev-sdk vision API.
 *
 * Returns SSE stream compatible with the chat-input streaming consumer.
 */
export async function POST(req: NextRequest) {
  let body: VisionRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const prompt = (body.prompt ?? "").toString().trim();
  const images = Array.isArray(body.images) ? body.images : [];

  if (!prompt) {
    return NextResponse.json(
      { error: "Prompt is required" },
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (images.length === 0) {
    return NextResponse.json(
      { error: "At least one image is required" },
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Limit to 4 images to keep request size reasonable
  const limitedImages = images.slice(0, 4);
  const thinkingEnabled = !!body.thinking;

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: prompt }];
  for (const img of limitedImages) {
    // Accept either a raw base64 string or a data URL
    const url = img.startsWith("data:")
      ? img
      : `data:image/jpeg;base64,${img}`;
    content.push({ type: "image_url", image_url: { url } });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)
        );

      try {
        const zai = await getZAI();
        // Vision API does not support streaming reliably; use non-stream
        // and emit chunks word-by-word for a streaming feel.
        const response: any = await zai.chat.completions.createVision({
          messages: [{ role: "user", content }],
          thinking: { type: thinkingEnabled ? "enabled" : "disabled" },
        });

        const fullContent =
          response?.choices?.[0]?.message?.content ?? "";
        const reasoning =
          response?.choices?.[0]?.message?.reasoning_content ?? "";

        if (reasoning) {
          send({ type: "reasoning", content: reasoning });
        }

        // Stream the content word-by-word for a typing feel.
        if (fullContent) {
          const tokens = fullContent.match(/\S+\s*/g) ?? [fullContent];
          for (const tok of tokens) {
            send({ type: "delta", content: tok });
            // Small delay for streaming feel (very short to stay fast)
            await new Promise((r) => setTimeout(r, 8));
          }
        }

        send({ type: "done" });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Vision request failed";
        console.error("Vision API error:", message);
        send({ type: "error", error: message });
      } finally {
        controller.close();
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

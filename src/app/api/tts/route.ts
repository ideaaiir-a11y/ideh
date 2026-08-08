import { NextRequest, NextResponse } from "next/server";
import { getZAI } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/tts
 * Body: { text: string, voice?: string, speed?: number }
 * Returns: audio/wav binary
 *
 * Text is limited to 1024 chars by the upstream API. Longer text is truncated
 * to the last complete sentence within the limit.
 */
function prepareText(text: string): string {
  const MAX = 1000;
  let clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX) return clean;
  // Truncate to the last sentence boundary within the limit
  const slice = clean.slice(0, MAX);
  const lastStop = Math.max(
    slice.lastIndexOf("."),
    slice.lastIndexOf("!"),
    slice.lastIndexOf("?")
  );
  return lastStop > 200 ? slice.slice(0, lastStop + 1) : slice;
}

export async function POST(req: NextRequest) {
  let body: { text?: string; voice?: string; speed?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawText = (body.text ?? "").toString();
  if (!rawText.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const text = prepareText(rawText);
  const voice = body.voice ?? "tongtong";
  const speed = typeof body.speed === "number" ? body.speed : 1.0;

  try {
    const zai = await getZAI();
    const response = await zai.audio.tts.create({
      input: text,
      voice,
      speed,
      response_format: "wav",
      stream: false,
    });
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "TTS failed";
    console.error("TTS error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

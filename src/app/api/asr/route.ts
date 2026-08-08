import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audio, format } = body;

    if (!audio) {
      return NextResponse.json({ error: "No audio data provided" }, { status: 400 });
    }

    // Use z-ai-web-dev-sdk for ASR
    const { ZAI } = await import("z-ai-web-dev-sdk");
    const zai = new ZAI();

    // Convert base64 to Buffer
    const buffer = Buffer.from(audio, "base64");

    const result = await zai.audio.asr.create({
      audio: buffer,
      format: format || "webm",
    });

    const text = result.text || result.transcription || "";

    return NextResponse.json({ text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "ASR failed";
    console.error("ASR error:", message);
    return NextResponse.json({ error: message, text: "" }, { status: 500 });
  }
}

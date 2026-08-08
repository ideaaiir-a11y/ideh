import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    // Use z-ai-web-dev-sdk for image generation
    const { ZAI } = await import("z-ai-web-dev-sdk");
    const zai = new ZAI();

    const result = await zai.image.generate({
      prompt,
      size: "1024x1024",
    });

    // Return the image as base64
    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    return NextResponse.json({ image: imageBase64 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Image generation failed";
    console.error("Image gen error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

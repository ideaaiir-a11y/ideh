import { NextRequest } from "next/server";
import {
  getRemoteAccessConfig,
  regenerateApiKey,
  setRemoteAccessEnabled,
  setDefaultSystemPrompt,
  maskApiKey,
} from "@/lib/remote-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Management endpoint for the remote-access feature.
 *
 * GET    /api/remote-access         → current config (key masked)
 * POST   /api/remote-access         → regenerate key
 * PATCH  /api/remote-access         → { enabled?, defaultSystemPrompt? }
 *
 * The full (unmasked) key is returned ONLY right after regeneration, so
 * the UI can display it once for the user to copy. On subsequent GETs
 * the key is masked.
 */

export async function GET() {
  const cfg = await getRemoteAccessConfig();
  return new Response(
    JSON.stringify({
      enabled: cfg.enabled,
      apiKey: maskApiKey(cfg.apiKey),
      apiKeyFull: null, // never expose the full key on plain GET
      createdAt: cfg.createdAt,
      rotatedAt: cfg.rotatedAt,
      defaultSystemPrompt: cfg.defaultSystemPrompt ?? "",
      baseUrl: "/api/v1",
      chatCompletionsPath: "/api/v1/chat/completions",
      modelsPath: "/api/v1/models",
    }),
    { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
  );
}

export async function POST() {
  const cfg = await regenerateApiKey();
  return new Response(
    JSON.stringify({
      enabled: cfg.enabled,
      apiKey: maskApiKey(cfg.apiKey),
      apiKeyFull: cfg.apiKey, // expose once after rotation
      createdAt: cfg.createdAt,
      rotatedAt: cfg.rotatedAt,
      defaultSystemPrompt: cfg.defaultSystemPrompt ?? "",
      baseUrl: "/api/v1",
      chatCompletionsPath: "/api/v1/chat/completions",
      modelsPath: "/api/v1/models",
    }),
    { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
  );
}

export async function PATCH(req: NextRequest) {
  let body: { enabled?: boolean; defaultSystemPrompt?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "بدنهٔ نامعتبر" }),
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  let cfg = await getRemoteAccessConfig();

  if (typeof body.enabled === "boolean") {
    cfg = await setRemoteAccessEnabled(body.enabled);
  }
  if (typeof body.defaultSystemPrompt === "string") {
    cfg = await setDefaultSystemPrompt(body.defaultSystemPrompt);
  }

  return new Response(
    JSON.stringify({
      enabled: cfg.enabled,
      apiKey: maskApiKey(cfg.apiKey),
      apiKeyFull: null,
      createdAt: cfg.createdAt,
      rotatedAt: cfg.rotatedAt,
      defaultSystemPrompt: cfg.defaultSystemPrompt ?? "",
      baseUrl: "/api/v1",
      chatCompletionsPath: "/api/v1/chat/completions",
      modelsPath: "/api/v1/models",
    }),
    { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
  );
}

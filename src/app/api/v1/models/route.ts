import { NextRequest } from "next/server";
import { validateRemoteApiKey } from "@/lib/remote-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_MODELS_URL =
  process.env.ZAI_BASE_URL?.replace(/\/+$/, "") +
  "/models" ||
  "https://acdc.space-z.ai/api/v1/models";

export async function GET(req: NextRequest) {
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const { ok } = await validateRemoteApiKey(authHeader);
  if (!ok) {
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

  try {
    const res = await fetch(BACKEND_MODELS_URL, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return new Response(
        JSON.stringify({
          error: {
            message: `خطا در دریافت مدل‌ها: ${res.status} ${txt.slice(0, 200)}`,
            type: "upstream_error",
          },
        }),
        { status: 502, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: {
          message: "خطا در دریافت مدل‌ها: " + message,
          type: "server_error",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}

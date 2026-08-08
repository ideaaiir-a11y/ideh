import { NextRequest } from "next/server";
import { testProviderConnection, type ProviderConfig } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: ProviderConfig;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, message: "بدنهٔ نامعتبر" }, { status: 400 });
  }

  if (!body?.apiBaseUrl || !body?.apiKey) {
    return Response.json(
      { ok: false, message: "Base URL و API Key لازم است" },
      { status: 400 }
    );
  }

  const result = await testProviderConnection(body);
  return Response.json(result, { status: result.ok ? 200 : 502 });
}

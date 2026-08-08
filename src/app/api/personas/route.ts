import { NextResponse } from "next/server";
import { PERSONAS } from "@/lib/personas";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ personas: PERSONAS });
}

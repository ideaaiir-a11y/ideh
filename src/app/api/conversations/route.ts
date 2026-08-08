import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const conversations = await db.conversation.findMany({
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      take: 200,
      include: {
        _count: { select: { messages: true } },
      },
    });
    return NextResponse.json({ conversations });
  } catch (e) {
    console.error("List conversations error:", e);
    return NextResponse.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const personaId = body?.personaId ?? "default";
    const title = body?.title ?? "New Chat";
    const conv = await db.conversation.create({
      data: { personaId, title },
    });
    return NextResponse.json({ conversation: conv });
  } catch (e) {
    console.error("Create conversation error:", e);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}

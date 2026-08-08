import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ conversation });
  } catch (e) {
    console.error("Get conversation error:", e);
    return NextResponse.json(
      { error: "Failed to load conversation" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const data: {
      title?: string;
      pinned?: boolean;
      personaId?: string;
      folder?: string | null;
    } = {};
    if (typeof body.title === "string") data.title = body.title.slice(0, 120);
    if (typeof body.pinned === "boolean") data.pinned = body.pinned;
    if (typeof body.personaId === "string") data.personaId = body.personaId;
    // folder accepts a string (rename) or null (remove from folder)
    if (typeof body.folder === "string") {
      data.folder = body.folder.slice(0, 40) || null;
    } else if (body.folder === null) {
      data.folder = null;
    }
    const updated = await db.conversation.update({
      where: { id },
      data,
    });
    return NextResponse.json({ conversation: updated });
  } catch (e) {
    console.error("Update conversation error:", e);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.conversation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Delete conversation error:", e);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}

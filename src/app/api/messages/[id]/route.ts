import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/messages/[id]
 * Body: { reaction?: "up" | "down" | null, bookmarked?: boolean }
 * Sets the user's reaction or bookmark on a message.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { reaction?: string | null; bookmarked?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: { reaction?: string | null; bookmarked?: boolean } = {};

  // Handle reaction
  if ("reaction" in body) {
    if (body.reaction === "up" || body.reaction === "down") {
      data.reaction = body.reaction;
    } else if (body.reaction === null) {
      data.reaction = null;
    } else {
      return NextResponse.json(
        { error: "reaction must be 'up', 'down', or null" },
        { status: 400 }
      );
    }
  }

  // Handle bookmarked
  if ("bookmarked" in body) {
    if (typeof body.bookmarked === "boolean") {
      data.bookmarked = body.bookmarked;
    } else {
      return NextResponse.json(
        { error: "bookmarked must be a boolean" },
        { status: 400 }
      );
    }
  }

  try {
    const updated = await db.message.update({
      where: { id },
      data,
    });
    return NextResponse.json({ message: updated });
  } catch (e) {
    console.error("Update message error:", e);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

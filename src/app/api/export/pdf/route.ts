import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/personas";
import {
  generateConversationPdf,
  pdfSlugify,
  type PdfMessage,
} from "@/lib/pdf-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Where on disk to save a copy of every generated PDF (for archival/QA).
const DOWNLOAD_DIR = path.join(process.cwd(), "download");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const conversationId = body?.conversationId;
    if (typeof conversationId !== "string" || !conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (!conversation.messages || conversation.messages.length === 0) {
      return NextResponse.json(
        { error: "Conversation has no messages to export" },
        { status: 400 }
      );
    }

    const persona = getPersona(conversation.personaId);
    const messages: PdfMessage[] = conversation.messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
      reasoning: m.reasoning ?? null,
      createdAt: m.createdAt,
    }));

    const pdfBuffer = await generateConversationPdf({
      id: conversation.id,
      title: conversation.title,
      persona,
      messages,
    });

    // Persist a copy to /home/z/my-project/download/<slug>.pdf
    const slug = pdfSlugify(conversation.title);
    const stamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const filename = `${slug}-${stamp}.pdf`;
    try {
      await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
      await fs.writeFile(path.join(DOWNLOAD_DIR, filename), pdfBuffer);
    } catch (e) {
      // Writing the archive copy is best-effort; don't fail the request.
      console.error("Failed to archive PDF copy:", e);
    }

    // Return the PDF as a binary download.
    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}.pdf"`,
      "Content-Length": String(pdfBuffer.length),
      "Cache-Control": "no-store",
    });

    return new NextResponse(pdfBuffer, { status: 200, headers });
  } catch (e) {
    console.error("PDF export error:", e);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

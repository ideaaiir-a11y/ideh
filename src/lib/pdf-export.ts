import PDFDocument from "pdfkit";
import type { Persona } from "@/lib/personas";

/**
 * Conversation PDF export — pure-JS implementation using pdfkit.
 *
 * Produces a nicely formatted A4 PDF:
 *   - Colored header bar (persona accent) with persona name + conversation title
 *   - Per-message: role label + dot + timestamp, wrapped content, code blocks
 *     rendered in monospace with a tinted background, reasoning in an amber block
 *   - Footer on every page with generation timestamp + page number
 *
 * No native deps; safe to run inside a Next.js API route (Node runtime).
 */

export interface PdfMessage {
  role: "user" | "assistant";
  content: string;
  reasoning?: string | null;
  createdAt: string | number | Date;
}

export interface PdfConversation {
  id: string;
  title: string;
  persona: Persona;
  messages: PdfMessage[];
}

/** Map persona accent tailwind name → hex color used in the PDF header. */
const ACCENT_HEX: Record<string, string> = {
  emerald: "#10b981",
  cyan: "#06b6d4",
  rose: "#f43f5e",
  amber: "#f59e0b",
  violet: "#8b5cf6",
  orange: "#f97316",
};

/**
 * Map persona icon name → a safe Unicode glyph that renders in the standard
 * PDF fonts (Helvetica). Avoids emoji (🎓📈🍳) that show as tofu □ in pdfkit.
 */
const ICON_GLYPH: Record<string, string> = {
  Sparkles: "✦",
  Code2: "⌘",
  Feather: "✎",
  GraduationCap: "✦",
  TrendingUp: "▲",
  ChefHat: "✦",
};

function accentHex(persona: Persona): string {
  return ACCENT_HEX[persona.accent] ?? "#10b981";
}

function iconGlyph(persona: Persona): string {
  return ICON_GLYPH[persona.icon] ?? "✦";
}

/** A darker shade of the accent color for text on white backgrounds. */
function accentDark(persona: Persona): string {
  const map: Record<string, string> = {
    emerald: "#047857",
    cyan: "#0e7490",
    rose: "#be123c",
    amber: "#b45309",
    violet: "#6d28d9",
    orange: "#c2410c",
  };
  return map[persona.accent] ?? "#047857";
}

function formatDate(d: string | number | Date): string {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Truncate a single code/word line so it doesn't overflow the page width. */
function wrapCodeLine(line: string, maxChars: number): string[] {
  if (line.length <= maxChars) return [line];
  const out: string[] = [];
  for (let i = 0; i < line.length; i += maxChars) {
    out.push(line.slice(i, i + maxChars));
  }
  return out;
}

interface RenderOpts {
  margin: number;
  width: number;
  pageW: number;
  pageH: number;
  accent: string;
  accentDark: string;
}

/** Render a paragraph of (mostly plain) text, wrapping at the content width. */
function renderTextParagraph(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  opts: RenderOpts
) {
  if (!text) return;
  doc.font("Helvetica").fontSize(11).fillColor("#1e293b");
  // pdfkit auto-wraps when width is supplied; this also advances doc.y
  doc.text(text, opts.margin, doc.y, {
    width: opts.width,
    lineGap: 4,
  });
  doc.y += 6;
}

/** Render a fenced code block with a tinted background and monospace font. */
function renderCodeBlock(
  doc: InstanceType<typeof PDFDocument>,
  code: string,
  lang: string,
  opts: RenderOpts
) {
  const cleanCode = code.replace(/\n$/, "");
  const maxChars = Math.floor((opts.width - 24) / 5.4); // Courier 9pt ~5.4pt/char
  const rawLines = cleanCode.split("\n");
  const lines: string[] = [];
  for (const ln of rawLines) {
    const wrapped = wrapCodeLine(ln, Math.max(20, maxChars));
    for (const w of wrapped) lines.push(w);
  }

  const lineHeight = 11.5;
  const headerH = lang ? 16 : 8;
  const blockH = lines.length * lineHeight + headerH + 8;

  // Page break if the block doesn't fit (and it's not taller than a full page)
  const availH = opts.pageH - opts.margin - doc.y - 50;
  if (blockH > availH && blockH < opts.pageH - opts.margin * 2 - 60) {
    doc.addPage();
  }

  const startY = doc.y;
  // Background
  doc.rect(opts.margin, startY, opts.width, blockH).fill("#f1f5f9");
  // Left accent border
  doc.rect(opts.margin, startY, 3, blockH).fill(opts.accent);

  // Language label
  let textY = startY + 6;
  if (lang) {
    doc.font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#64748b")
      .text(lang.toUpperCase(), opts.margin + 10, textY, {
        width: opts.width - 20,
      });
    textY += 10;
  }

  // Code body
  doc.font("Courier").fontSize(9).fillColor("#0f172a");
  let y = textY;
  for (const ln of lines) {
    doc.text(ln, opts.margin + 10, y, {
      width: opts.width - 20,
      lineGap: 0,
    });
    y += lineHeight;
  }

  doc.y = startY + blockH + 8;
}

/** Render assistant reasoning in an amber-tinted block. */
function renderReasoning(
  doc: InstanceType<typeof PDFDocument>,
  reasoning: string,
  opts: RenderOpts
) {
  const clean = reasoning.trim();
  if (!clean) return;
  const lines = clean.split("\n");
  const lineHeight = 11.5;
  const headerH = 16;
  const blockH = lines.length * lineHeight + headerH + 8;

  const availH = opts.pageH - opts.margin - doc.y - 50;
  if (blockH > availH && blockH < opts.pageH - opts.margin * 2 - 60) {
    doc.addPage();
  }

  const startY = doc.y;
  doc.rect(opts.margin, startY, opts.width, blockH).fill("#fef3c7");
  doc.rect(opts.margin, startY, 3, blockH).fill("#f59e0b");

  doc.font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#92400e")
    .text("استدلال", opts.margin + 10, startY + 5, {
      width: opts.width - 20,
    });

  doc.font("Helvetica-Oblique").fontSize(9).fillColor("#78350f");
  let y = startY + headerH;
  for (const ln of lines) {
    doc.text(ln, opts.margin + 10, y, {
      width: opts.width - 20,
      lineGap: 2,
    });
    y += lineHeight;
  }

  doc.y = startY + blockH + 10;
}

/**
 * Render markdown-ish content. Detects fenced code blocks (```lang ... ```)
 * and renders them in monospace with a tinted background. All other text is
 * rendered as wrapped Helvetica paragraphs (markdown syntax preserved as text).
 */
function renderMarkdownContent(
  doc: InstanceType<typeof PDFDocument>,
  content: string,
  opts: RenderOpts
) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let inCode = false;
  let lang = "";
  let codeBuf: string[] = [];
  let textBuf: string[] = [];

  const flushText = () => {
    if (textBuf.length === 0) return;
    const text = textBuf.join("\n").replace(/\n{3,}/g, "\n\n");
    textBuf = [];
    renderTextParagraph(doc, text, opts);
  };
  const flushCode = () => {
    if (codeBuf.length === 0) {
      lang = "";
      return;
    }
    renderCodeBlock(doc, codeBuf.join("\n"), lang, opts);
    codeBuf = [];
    lang = "";
  };

  for (const line of lines) {
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushText();
        inCode = true;
        lang = fence[1] || "";
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
    } else {
      textBuf.push(line);
    }
  }
  flushText();
  if (inCode) flushCode();
}

/**
 * Generate the conversation PDF and resolve with a Node Buffer.
 */
export function generateConversationPdf(conv: PdfConversation): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const accent = accentHex(conv.persona);
    const accentDarkColor = accentDark(conv.persona);
    const glyph = iconGlyph(conv.persona);

    const doc = new PDFDocument({
      size: "A4",
      // Bottom margin = 60 leaves room for the footer (separator + 1 text line).
      // The footer loop below temporarily zeros the bottom margin on each
      // page so footer text written near the page edge doesn't trigger
      // pdfkit's auto-page-break (which would create a spurious extra page).
      margins: { top: 50, left: 50, right: 50, bottom: 60 },
      bufferPages: true,
      info: {
        Title: conv.title,
        Author: conv.persona.name,
        Subject: "Conversation Export",
        Creator: "Zai Chat",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 50;
    const contentWidth = pageW - margin * 2;
    const opts: RenderOpts = {
      margin,
      width: contentWidth,
      pageW,
      pageH,
      accent,
      accentDark: accentDarkColor,
    };

    // -------- Header bar --------
    const headerH = 110;
    doc.rect(0, 0, pageW, headerH).fill(accent);

    // Persona glyph
    doc.font("Helvetica-Bold")
      .fontSize(26)
      .fillColor("#ffffff")
      .text(glyph, margin, 24, { width: 34, lineGap: 0 });

    // Persona name (next to glyph)
    doc.font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#ffffff")
      .text(conv.persona.name, margin + 36, 28, {
        width: contentWidth - 36,
        lineGap: 0,
      });

    // Conversation title (subtitle)
    doc.font("Helvetica")
      .fontSize(13)
      .fillColor("#ffffff")
      .opacity(0.92)
      .text(conv.title, margin, 60, {
        width: contentWidth,
        lineGap: 0,
      });
    doc.opacity(1);

    // Persona description
    doc.font("Helvetica")
      .fontSize(9)
      .fillColor("#ffffff")
      .opacity(0.8)
      .text(conv.persona.description, margin, 82, {
        width: contentWidth,
        lineGap: 0,
      });
    doc.opacity(1);

    // -------- Meta line --------
    doc.y = headerH + 22;
    const messageCount = conv.messages.length;
    const userCount = conv.messages.filter((m) => m.role === "user").length;
    const assistantCount = messageCount - userCount;
    doc.font("Helvetica")
      .fontSize(9)
      .fillColor("#64748b")
      .text(
        `${messageCount} پیام  •  ${userCount} کاربر / ${assistantCount} دستیار  •  برون‌بری ${formatDate(
          new Date()
        )}`,
        margin,
        doc.y,
        { width: contentWidth }
      );
    doc.y += 14;

    // Separator
    doc.moveTo(margin, doc.y)
      .lineTo(pageW - margin, doc.y)
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .stroke();
    doc.y += 14;

    // -------- Messages --------
    for (const msg of conv.messages) {
      const isUser = msg.role === "user";
      const roleLabel = isUser ? "شما" : conv.persona.name;
      const roleColor = isUser ? "#475569" : accentDarkColor;

      // Reserve space for the header row + at least 2 lines of body
      if (doc.y > pageH - margin - 80) {
        doc.addPage();
      }

      const headerY = doc.y;

      // Role dot
      doc.fillColor(roleColor);
      doc.circle(margin + 4, headerY + 6, 4).fill();

      // Role label
      doc.font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(roleColor)
        .text(roleLabel, margin + 16, headerY, {
          width: contentWidth - 130,
          lineGap: 0,
        });

      // Timestamp (right-aligned)
      doc.font("Helvetica")
        .fontSize(8)
        .fillColor("#94a3b8")
        .text(formatDate(msg.createdAt), margin, headerY, {
          width: contentWidth,
          align: "right",
          lineGap: 0,
        });

      doc.y = headerY + 18;

      // Body
      renderMarkdownContent(doc, msg.content, opts);

      // Reasoning
      if (msg.reasoning && msg.reasoning.trim()) {
        doc.y += 6;
        renderReasoning(doc, msg.reasoning, opts);
      }

      doc.y += 18;
    }

    // -------- Footer on every page --------
    const range = doc.bufferedPageRange();
    const totalPages = range.start + range.count;
    const genDate = new Date().toLocaleString();

    for (let i = range.start; i < totalPages; i++) {
      doc.switchToPage(i);
      // Footer separator
      doc.moveTo(margin, pageH - 45)
        .lineTo(pageW - margin, pageH - 45)
        .strokeColor("#e2e8f0")
        .lineWidth(0.5)
        .stroke();
      // Footer text. Use lineBreak:false so pdfkit draws the strings at the
      // exact x,y we pass and never runs its auto-page-break logic (which
      // would otherwise create spurious extra pages when text is placed near
      // the bottom edge).
      doc.font("Helvetica").fontSize(8).fillColor("#94a3b8");
      const dateText = `تولید شده توسط ایده  •  ${genDate}`;
      const pageText = `صفحهٔ ${i + 1} از ${totalPages}`;
      const pageTextW = doc.widthOfString(pageText);
      doc.text(dateText, margin, pageH - 32, {
        lineBreak: false,
      });
      doc.text(pageText, pageW - margin - pageTextW, pageH - 32, {
        lineBreak: false,
      });
    }

    doc.end();
  });
}

/**
 * Build a filename-safe slug from a title. Same logic as the markdown/json
 * exporter so files share a consistent naming convention.
 */
export function pdfSlugify(title: string): string {
  const s = title
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return s || "conversation";
}

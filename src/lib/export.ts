import type { ChatMessage } from "@/store/chat-store";
import type { Persona } from "@/lib/personas";

/**
 * Export a conversation as a Markdown document.
 */
export function exportAsMarkdown(
  title: string,
  persona: Persona,
  messages: ChatMessage[]
): string {
  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`> دستیار: **${persona.name}** — ${persona.description}`);
  lines.push("");
  lines.push(`_برون‌بری ${new Date().toLocaleString("fa-IR")}_`);
  lines.push("");
  lines.push("---");
  lines.push("");
  for (const m of messages) {
    const who = m.role === "user" ? "🧑 شما" : `✦ ${persona.name}`;
    const time = new Date(m.createdAt).toLocaleString();
    lines.push(`### ${who}`);
    lines.push("");
    lines.push(`*${time}*`);
    lines.push("");
    if (m.role === "assistant" && m.reasoning) {
      lines.push("<details><summary>💭 استدلال</summary>");
      lines.push("");
      lines.push(m.reasoning);
      lines.push("");
      lines.push("</details>");
      lines.push("");
    }
    lines.push(m.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Export a conversation as JSON.
 */
export function exportAsJson(
  title: string,
  persona: Persona,
  messages: ChatMessage[]
): string {
  return JSON.stringify(
    {
      title,
      persona: {
        id: persona.id,
        name: persona.name,
        description: persona.description,
      },
      exportedAt: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        reasoning: m.reasoning ?? null,
        createdAt: new Date(m.createdAt).toISOString(),
      })),
    },
    null,
    2
  );
}

/**
 * Trigger a browser download of text content.
 */
export function downloadFile(
  filename: string,
  content: string,
  mime: string = "text/plain"
) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Make a filename-safe slug from a title.
 */
export function slugify(title: string): string {
  const s = title
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return s || "conversation";
}

/**
 * Long-term memory store (ایده).
 *
 * Stores user-provided "facts" (e.g. "I'm a Python developer") in
 * localStorage. These are injected into the persona system prompt so
 * the AI remembers context across conversations.
 */

export interface MemoryItem {
  id: string;
  text: string;
  createdAt: number;
}

const STORAGE_KEY = "hosh-no:memory";

export function loadMemory(): MemoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m) => m && typeof m.id === "string" && typeof m.text === "string"
    );
  } catch {
    return [];
  }
}

export function saveMemory(items: MemoryItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function makeMemoryId(): string {
  return "mem-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * Format memory items into a system-prompt fragment.
 * Returns empty string if no memories.
 */
export function formatMemoryContext(items: MemoryItem[]): string {
  if (!items.length) return "";
  const lines = items.map((m) => `- ${m.text}`).join("\n");
  return `\n\n<user_memory>
حقایق زیر را دربارهٔ کاربر به خاطر بسپار و پاسخ‌هایت را بر اساس آن‌ها تنظیم کن:
${lines}
</user_memory>`;
}

/**
 * Project context formatter
 * ------------------------------------------------------------------
 * Converts the set of attached project files into a single textual
 * block suitable for appending to a persona's system prompt.
 *
 * The chat route (server-side) calls `formatProjectContext()` with
 * the files selected by the user; the returned string is appended
 * to the system prompt sent to the LLM so it can read the user's
 * code and answer coding questions.
 *
 * Total output is capped at ~60 000 characters to keep prompts
 * within reasonable token budgets. Later files that do not fit are
 * either truncated (with a note) or skipped entirely.
 */

import type { ProjectFile } from "./project-store";

/** Soft cap on the total context length (≈ 15 k tokens). */
const MAX_CONTEXT_CHARS = 60_000;

/**
 * Format the attached project files into a `<project_files>` block.
 *
 * Returns an empty string when `files` is empty so the caller can
 * cheaply skip appending anything.
 *
 * Output shape:
 *
 * ```
 * <project_files>
 * The user has attached the following files from their project. Use them as context when answering.
 *
 * --- File: src/app/page.tsx (TypeScript) ---
 * <content>
 *
 * --- File: src/lib/utils.ts (TypeScript) ---
 * <content>
 * </project_files>
 * ```
 */
export function formatProjectContext(files: ProjectFile[]): string {
  if (!files || files.length === 0) return "";

  const HEADER =
    "<project_files>\n" +
    "The user has attached the following files from their project. " +
    "Use them as context when answering.\n";
  const FOOTER = "\n</project_files>";

  let out = HEADER;

  for (const file of files) {
    const sep = `\n\n--- File: ${file.path} (${file.language}) ---\n`;
    const remaining =
      MAX_CONTEXT_CHARS - out.length - sep.length - FOOTER.length;

    // If there's no room left for even a token of content, stop adding
    // more files entirely.
    if (remaining <= 100) break;

    let body = file.content;
    if (body.length > remaining - 30) {
      // Truncate this file's body and append a visible marker.
      body =
        body.slice(0, Math.max(0, remaining - 60)) +
        "\n\n[truncated to fit context budget]";
    }
    out += sep + body;
  }

  out += FOOTER;
  return out;
}

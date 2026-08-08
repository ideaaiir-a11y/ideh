"use client";

import * as React from "react";
import { Tag, X, Plus } from "lucide-react";
import {
  useTagsStore,
  MAX_TAGS_PER_CONV,
  MAX_TAG_LENGTH,
} from "@/lib/tags-store";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/i18n";

/**
 * Inline tag editor for a single conversation.
 * Compact one-line design that fits inside the sidebar.
 *
 * - Renders existing tag chips with an X button to remove.
 * - A "+" toggle reveals an input to add a new tag (Enter to commit).
 * - Validation: non-empty, ≤20 chars, no dupes, ≤8 tags per conversation.
 */
export function TagInput({
  conversationId,
  className,
}: {
  conversationId: string;
  className?: string;
}) {
  const tags = useTagsStore((s) => s.tagsByConv[conversationId] ?? []);
  const addTagToConv = useTagsStore((s) => s.addTagToConv);
  const removeTagFromConv = useTagsStore((s) => s.removeTagFromConv);

  const [showInput, setShowInput] = React.useState(false);
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (showInput) {
      // Defer focus to next tick so the input is mounted
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
  }, [showInput]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      addTagToConv(conversationId, trimmed);
    }
    setValue("");
    // Keep input open if user can still add more tags; close if at cap.
    if (tags.length + (trimmed ? 1 : 0) >= MAX_TAGS_PER_CONV) {
      setShowInput(false);
    } else {
      inputRef.current?.focus();
    }
  };

  const atCap = tags.length >= MAX_TAGS_PER_CONV;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/5 px-1.5 py-1.5",
        className
      )}
    >
      <Tag className="h-3 w-3 shrink-0 text-amber-500" />
      {tags.map((tg) => (
        <span
          key={tg}
          className="inline-flex items-center gap-0.5 rounded-md border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
        >
          <span className="truncate max-w-[80px]">{tg}</span>
          <button
            type="button"
            onClick={() => removeTagFromConv(conversationId, tg)}
            className="rounded-sm p-0.5 text-amber-600/70 transition-colors hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-400/70 dark:hover:text-amber-300"
            aria-label={`حذف برچسب ${tg}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      {showInput ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setValue("");
              setShowInput(false);
            }
          }}
          onBlur={() => {
            // Commit on blur if there's a value; otherwise just hide.
            if (value.trim()) commit();
            else setShowInput(false);
          }}
          placeholder="نام برچسب…"
          maxLength={MAX_TAG_LENGTH}
          className="min-w-[60px] flex-1 rounded-md border border-amber-500/30 bg-background px-1.5 py-0.5 text-[10px] outline-none focus:border-amber-500/60"
        />
      ) : (
        !atCap && (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="inline-flex h-4 items-center gap-0.5 rounded-md px-1 text-[10px] font-medium text-amber-600/80 transition-colors hover:bg-amber-500/15 hover:text-amber-700 dark:text-amber-400/80 dark:hover:text-amber-300"
            aria-label="افزودن برچسب"
            title="افزودن برچسب"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        )
      )}

      {atCap && !showInput && (
        <span className="text-[9px] text-muted-foreground/60">
          نهایتاً {toPersianDigits(MAX_TAGS_PER_CONV)}
        </span>
      )}
    </div>
  );
}

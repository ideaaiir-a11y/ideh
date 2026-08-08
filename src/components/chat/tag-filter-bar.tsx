"use client";

import * as React from "react";
import { Tag as TagIcon } from "lucide-react";
import { useTagsStore, selectAvailableTags } from "@/lib/tags-store";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/**
 * Horizontal scrollable tag filter bar shown above the conversation list.
 * Renders an "All" pill + one pill per available tag.
 * Hidden entirely if there are no tags across all conversations.
 */
export function TagFilterBar({ className }: { className?: string }) {
  const tagsByConv = useTagsStore((s) => s.tagsByConv);
  const activeTagFilter = useTagsStore((s) => s.activeTagFilter);
  const setActiveTagFilter = useTagsStore((s) => s.setActiveTagFilter);

  const availableTags = React.useMemo(
    () => selectAvailableTags(tagsByConv),
    [tagsByConv]
  );

  if (availableTags.length === 0) return null;

  return (
    <div className={cn("px-3 pb-1.5", className)}>
      <div className="tag-filter-bar flex items-center gap-1 overflow-x-auto pb-0.5">
        <FilterPill
          active={activeTagFilter === null}
          onClick={() => setActiveTagFilter(null)}
        >
          {t.allChats}
        </FilterPill>
        {availableTags.map((tg) => (
          <FilterPill
            key={tg}
            active={activeTagFilter === tg}
            onClick={() =>
              setActiveTagFilter(activeTagFilter === tg ? null : tg)
            }
          >
            <TagIcon className="h-2.5 w-2.5" />
            <span className="max-w-[90px] truncate">{tg}</span>
          </FilterPill>
        ))}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-all",
        active
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30"
          : "text-muted-foreground/70 hover:bg-sidebar-accent/50 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

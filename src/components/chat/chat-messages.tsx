"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Search, X, Bookmark, BookmarkCheck } from "lucide-react";
import { useChatStore, type ChatMessage } from "@/store/chat-store";
import { MessageBubble } from "./message-bubble";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import {
  t,
  faNumber,
  toPersianDigits,
  faTime,
  faDateLabel,
} from "@/lib/i18n";

export function ChatMessages({
  onRegenerate,
  onEdit,
  onReact,
  onContinue,
  onBookmark,
  onRegenerateWithPersona,
}: {
  onRegenerate?: () => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onReact?: (messageId: string, reaction: "up" | "down") => void;
  onContinue?: () => void;
  onBookmark?: (messageId: string) => void;
  onRegenerateWithPersona?: (personaId: string) => void;
}) {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const persona = useChatStore((s) => s.persona);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = React.useState(true);
  const [showScrollBtn, setShowScrollBtn] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showBookmarkedOnly, setShowBookmarkedOnly] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const prevMessageCountRef = React.useRef(messages.length);

  // Track whether user is near bottom
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distance < 120;
    setAutoScroll(nearBottom);
    setShowScrollBtn(distance > 240);
    // Clear unread count when user scrolls near bottom
    if (nearBottom) setUnreadCount(0);
  };

  // Track unread messages when new messages arrive while not auto-scrolling
  React.useEffect(() => {
    if (messages.length > prevMessageCountRef.current && !autoScroll) {
      setUnreadCount((c) => c + (messages.length - prevMessageCountRef.current));
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, autoScroll]);

  React.useEffect(() => {
    const settings = useSettings.getState().settings;
    if (settings.autoScroll && autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, autoScroll]);

  // Jump to bottom when switching conversations
  const activeId = useChatStore((s) => s.activeConversationId);
  React.useEffect(() => {
    setAutoScroll(true);
    setShowScrollBtn(false);
    setUnreadCount(0);
    setSearchOpen(false);
    setSearchQuery("");
    setShowBookmarkedOnly(false);
    requestAnimationFrame(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "auto", block: "end" });
      }
    });
  }, [activeId]);

  const scrollToBottom = () => {
    setAutoScroll(true);
    setUnreadCount(0);
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const lastAssistantId = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant" && !messages[i].pending) {
        return messages[i].id;
      }
    }
    return null;
  }, [messages]);

  // Filter messages for search and bookmark filter
  const filteredMessages = React.useMemo(() => {
    let filtered = messages;
    if (showBookmarkedOnly) {
      filtered = filtered.filter((m) => m.bookmarked);
    }
    return filtered;
  }, [messages, showBookmarkedOnly]);

  const searchLower = searchQuery.trim().toLowerCase();
  const hasSearch = searchLower.length > 0;
  const searchMatchCount = hasSearch
    ? filteredMessages.filter((m) => m.content.toLowerCase().includes(searchLower)).length
    : 0;

  // Keyboard shortcut for search (Ctrl+F)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        // Only if we have messages
        if (messages.length > 0) {
          e.preventDefault();
          setSearchOpen((v) => !v);
          if (!searchOpen) setSearchQuery("");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [messages.length, searchOpen]);

  // Map the current persona's accent to the matching background class.
  // Falls back to emerald if the accent is unknown.
  const personaBgClass =
    PERSONA_BG_CLASS[persona.accent] ?? PERSONA_BG_CLASS.emerald;

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* In-conversation search bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-0 z-20 border-b border-border bg-background/95 px-3 py-2 backdrop-blur-sm"
          >
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchInConv}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }
                }}
              />
              {hasSearch && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {searchMatchCount === 1
                    ? `${faNumber(searchMatchCount)} نتیجه`
                    : `${faNumber(searchMatchCount)} نتایج`}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn(
          "custom-scrollbar chat-gradient noise-bg h-full overflow-y-auto",
          personaBgClass
        )}
      >
        {/* Bookmark filter toggle */}
        {messages.some((m) => m.bookmarked) && !searchOpen && (
          <div className="sticky top-2 z-20 flex justify-center py-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowBookmarkedOnly((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-sm transition-all",
                showBookmarkedOnly
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-border bg-background/80 text-muted-foreground backdrop-blur-sm hover:bg-accent"
              )}
            >
              {showBookmarkedOnly ? (
                <BookmarkCheck className="h-3 w-3" />
              ) : (
                <Bookmark className="h-3 w-3" />
              )}
              {showBookmarkedOnly
                ? t.showAll
                : `نشان‌شده‌ها (${faNumber(messages.filter((m) => m.bookmarked).length)})`}
            </motion.button>
          </div>
        )}

        <div className="density-aware mx-auto flex w-full max-w-3xl flex-col gap-6 px-3 pt-8 pb-6 sm:px-4 sm:pt-10 sm:pb-8">
          {filteredMessages.map((m: ChatMessage, idx: number) => {
            const isSearchMatch = hasSearch && m.content.toLowerCase().includes(searchLower);
            // Hide non-matching messages when searching
            if (hasSearch && !isSearchMatch) return null;

            // Sticky date divider — shown when the day changes between
            // two consecutive visible messages. Skipped before the first
            // message group and while searching.
            const prevMessage = filteredMessages[idx - 1];
            const showDateDivider =
              !hasSearch &&
              idx > 0 &&
              prevMessage &&
              getDateKey(m.createdAt) !== getDateKey(prevMessage.createdAt);

            return (
              <React.Fragment key={m.id}>
                {showDateDivider && (
                  <div className="sticky top-2 z-10 flex items-center gap-3 px-1">
                    <div className="h-px flex-1 bg-border/40" />
                    <span className="date-divider-pill text-xs text-muted-foreground rounded-full px-3 py-1 shadow-sm">
                      {faDateLabel(m.createdAt)}
                    </span>
                    <div className="h-px flex-1 bg-border/40" />
                  </div>
                )}
                {/* Time separator between consecutive user messages on
                    the same day (suppressed when a date divider is shown). */}
                {idx > 0 &&
                  m.role === "user" &&
                  filteredMessages[idx - 1]?.role === "user" &&
                  !showDateDivider && (
                    <div className="flex items-center gap-3 px-1">
                      <div className="h-px flex-1 bg-border/50" />
                      <span className="text-[10px] font-medium text-muted-foreground/40">
                        {faTime(m.createdAt)}
                      </span>
                      <div className="h-px flex-1 bg-border/50" />
                    </div>
                  )}
                <MessageBubble
                  message={m}
                  isLastAssistant={m.id === lastAssistantId && !isStreaming}
                  onRegenerate={onRegenerate}
                  onEdit={onEdit}
                  onReact={onReact}
                  onContinue={onContinue}
                  onBookmark={onBookmark}
                  onRegenerateWithPersona={onRegenerateWithPersona}
                  isSearchMatch={isSearchMatch}
                />
              </React.Fragment>
            );
          })}
          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {/* Scroll-to-bottom floating button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 z-10 flex h-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-lg backdrop-blur-sm transition-colors hover:bg-accent"
            aria-label="رفتن به پایین"
          >
            <ArrowDown className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "۹+" : toPersianDigits(unreadCount)}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Search trigger button (when not open) */}
      {!searchOpen && messages.length > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSearchOpen(true)}
          className="absolute end-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-accent hover:text-foreground"
          title="جست‌وجو در گفت‌وگو (⌘F)"
        >
          <Search className="h-3.5 w-3.5" />
        </motion.button>
      )}
    </div>
  );
}

/** Returns a stable day-local key (e.g. "2026-3-15") for a timestamp. */
function getDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Maps a persona accent to the matching background class. */
const PERSONA_BG_CLASS: Record<string, string> = {
  emerald: "persona-bg-emerald",
  cyan: "persona-bg-cyan",
  rose: "persona-bg-rose",
  amber: "persona-bg-amber",
  violet: "persona-bg-violet",
  orange: "persona-bg-orange",
};

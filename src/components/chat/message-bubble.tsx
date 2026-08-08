"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Copy,
  RefreshCw,
  Sparkles,
  Trash2,
  User,
  AlertTriangle,
  Pencil,
  X,
  Brain,
  ChevronDown,
  Volume2,
  Square,
  ThumbsUp,
  ThumbsDown,
  Play,
  StopCircle,
  Star,
  Hash,
  ArrowRight,
  Share2,
} from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useChatStore, type ChatMessage } from "@/store/chat-store";
import { PERSONAS, getPersona } from "@/lib/personas";
import { t, faNumber, toPersianDigits, faTime } from "@/lib/i18n";

// Lucide persona icon name -> emoji glyph (matches chat-input / chat-app maps)
const PERSONA_ICON_GLYPH: Record<string, string> = {
  Sparkles: "✦",
  Code2: "⌘",
  Feather: "✎",
  GraduationCap: "🎓",
  TrendingUp: "📈",
  ChefHat: "🍳",
};

// Accent -> solid colored dot used in the persona dropdown
const ACCENT_DOT: Record<string, string> = {
  emerald: "bg-emerald-500",
  cyan: "bg-cyan-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  orange: "bg-orange-500",
};

interface MessageBubbleProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onReact?: (messageId: string, reaction: "up" | "down") => void;
  onContinue?: () => void;
  onBookmark?: (messageId: string) => void;
  onRegenerateWithPersona?: (personaId: string) => void;
  isLastAssistant?: boolean;
  isSearchMatch?: boolean;
}

function formatTime(ts: number): string {
  // Delegated to the shared Persian helper (fa-IR short time).
  return faTime(ts);
}

// Rough token estimate (~4 chars per token, same heuristic as OpenAI tiktoken approx)
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

function formatTokens(n: number): string {
  // Uses the shared Persian token-count label from i18n (e.g. "۱٫۲k توکن").
  if (n < 1000) return t.tokenCount(n);
  return t.tokenCount(Number((n / 1000).toFixed(1)) * 1000);
}

const ACCENT_AVATAR: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cyan: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  orange: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
};

const ACCENT_NAME: Record<string, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  rose: "text-rose-600 dark:text-rose-400",
  amber: "text-amber-600 dark:text-amber-400",
  violet: "text-violet-600 dark:text-violet-400",
  orange: "text-orange-600 dark:text-orange-400",
};

const ACCENT_GLOW: Record<string, string> = {
  emerald: "shadow-emerald-500/10",
  cyan: "shadow-cyan-500/10",
  rose: "shadow-rose-500/10",
  amber: "shadow-amber-500/10",
  violet: "shadow-violet-500/10",
  orange: "shadow-orange-500/10",
};

const ACCENT_BORDER: Record<string, string> = {
  emerald: "border-s-emerald-500/40",
  cyan: "border-s-cyan-500/40",
  rose: "border-s-rose-500/40",
  amber: "border-s-amber-500/40",
  violet: "border-s-violet-500/40",
  orange: "border-s-orange-500/40",
};

export function MessageBubble({
  message,
  onRegenerate,
  onEdit,
  onReact,
  onContinue,
  onBookmark,
  onRegenerateWithPersona,
  isLastAssistant,
  isSearchMatch,
}: MessageBubbleProps) {
  const [copied, setCopied] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(message.content);
  const [showReasoning, setShowReasoning] = React.useState(false);
  const [starPop, setStarPop] = React.useState(false);
  const persona = useChatStore((s) => s.persona);
  const removeMessage = useChatStore((s) => s.removeMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const editingId = useChatStore((s) => s.editingId);
  const playingId = useChatStore((s) => s.playingId);
  const ttsLoadingId = useChatStore((s) => s.ttsLoadingId);
  const ttsSpeak = useChatStore((s) => s.ttsSpeak);
  const ttsStop = useChatStore((s) => s.ttsStop);

  const isUser = message.role === "user";
  const avatarClass = isUser
    ? "bg-foreground text-background"
    : ACCENT_AVATAR[persona.accent] ?? ACCENT_AVATAR.emerald;
  const nameClass = ACCENT_NAME[persona.accent] ?? ACCENT_NAME.emerald;
  const glowClass = ACCENT_GLOW[persona.accent] ?? ACCENT_GLOW.emerald;
  const accentBorderClass = ACCENT_BORDER[persona.accent] ?? ACCENT_BORDER.emerald;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const handleCopyAsPrompt = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("به‌عنوان پرامپت کپی شد", {
        description: "برای استفادهٔ مجدد، یک گفت‌وگوی جدید شروع کنید و پیست کنید.",
        duration: 3000,
      });
    } catch {
      // ignore
    }
  };

  const handleForward = async () => {
    try {
      const header = `--- همرسان‌شده از ${isUser ? "شما" : persona.name} ---\n`;
      const timestamp = new Date(message.createdAt).toLocaleString();
      await navigator.clipboard.writeText(header + `[${timestamp}]\n\n${message.content}`);
      toast.success("پیام همرسان شد", {
        description: "برای همرسانی، در هر گفت‌وگویی پیست کنید.",
        duration: 3000,
      });
    } catch {
      // ignore
    }
  };

  const startEdit = () => {
    setEditValue(message.content);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue(message.content);
  };

  const saveEdit = () => {
    const trimmed = editValue.trim();
    if (!trimmed || !onEdit) {
      setIsEditing(false);
      return;
    }
    onEdit(message.id, trimmed);
    setIsEditing(false);
  };

  const handleReact = (reaction: "up" | "down") => {
    // Toggle off if clicking the same reaction
    const next = message.reaction === reaction ? null : reaction;
    onReact?.(message.id, next as "up" | "down");
  };

  const handleSpeak = () => {
    if (!message.content) return;
    ttsSpeak(message.id, message.content);
  };

  const handleBookmark = () => {
    setStarPop(true);
    setTimeout(() => setStarPop(false), 300);
    onBookmark?.(message.id);
  };

  const isPlaying = playingId === message.id;
  const isLoadingTts = ttsLoadingId === message.id;

  const showActions =
    !message.pending && !isStreaming && editingId === null && !isEditing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group flex w-full gap-3 sm:gap-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar with glow */}
      <div className="relative">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-border transition-all group-hover:shadow-md group-hover:ring-foreground/10",
            avatarClass,
            !isUser && `group-hover:${glowClass}`
          )}
        >
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </div>
        {/* Online indicator for assistant */}
        {!isUser && !message.error && (
          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
        )}
        {/* Bookmark indicator */}
        {message.bookmarked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 shadow-sm"
          >
            <Star className="h-2.5 w-2.5 fill-white text-white" />
          </motion.div>
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "flex min-w-0 max-w-[85%] flex-col gap-1.5 sm:max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Name + timestamp row */}
        <div
          className={cn(
            "flex items-center gap-2 px-1 text-[11px] text-muted-foreground",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className={cn("font-medium", isUser ? "" : nameClass)}>
            {isUser ? "شما" : persona.name}
          </span>
          <span className="text-muted-foreground/70">·</span>
          <time className="tabular-nums text-muted-foreground/80">
            {formatTime(message.createdAt)}
          </time>
          {/* Token estimate for assistant messages (non-pending, with content) */}
          {!isUser && !message.pending && message.content && useSettings.getState().settings.showTokenCount && (
            <span
                           className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground/80 transition-colors hover:bg-muted hover:text-muted-foreground"
              title={`~${faNumber(estimateTokens(message.content))} توکن (تقریبی، بر اساس ${faNumber(message.content.length)} نویسه)`}
            >
              <Hash className="h-2.5 w-2.5 opacity-60" />
              {formatTokens(estimateTokens(message.content))}
            </span>
          )}
          {message.bookmarked && (
            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500 opacity-60" />
          )}
        </div>

        {/* Reasoning block (assistant, thinking mode) */}
        {!isUser && message.reasoning && (
          <button
            onClick={() => setShowReasoning((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/5 px-2.5 py-1.5 text-[11px] text-violet-600 transition-all hover:bg-violet-500/10 hover:border-violet-500/50 dark:text-violet-400"
          >
            <Brain className="h-3.5 w-3.5" />
            <span className="font-medium">
              {showReasoning ? "پنهان کردن تفکر" : "نمایش تفکر"}
            </span>
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                showReasoning && "rotate-180"
              )}
            />
          </button>
        )}
        <AnimatePresence initial={false}>
          {!isUser && message.reasoning && showReasoning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-[0.825rem] leading-relaxed text-muted-foreground">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-500">
                  <Brain className="h-3 w-3" />
                  تفکر
                </div>
                <p className="whitespace-pre-wrap break-words">
                  {message.reasoning}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content bubble */}
        {isEditing ? (
          <div className="w-full min-w-[260px] rounded-2xl border border-emerald-500/40 bg-card p-2 shadow-lg shadow-emerald-500/5">
            <textarea
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              rows={Math.min(Math.max(editValue.split("\n").length, 2), 8)}
              className="max-h-[240px] w-full resize-none bg-transparent px-2 py-1 text-[0.925rem] leading-relaxed outline-none"
            />
            <div className="mt-1 flex items-center justify-end gap-1.5 px-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs"
                onClick={cancelEdit}
              >
                <X className="h-3 w-3" />
                {t.cancel}
              </Button>
              <Button
                size="sm"
                className="h-7 gap-1 px-2.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={saveEdit}
                disabled={!editValue.trim()}
              >
                <Check className="h-3 w-3" />
                ذخیره و ارسال
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-[0.925rem] leading-relaxed transition-shadow",
              isUser
                ? "rounded-ee-sm bg-gradient-to-br from-foreground to-foreground/90 text-background shadow-md shadow-foreground/10"
                : message.error
                ? "rounded-es-sm border border-destructive/40 bg-destructive/8 text-foreground"
                : message.pending
                ? "rounded-es-sm border border-border bg-card text-card-foreground shadow-sm stream-glow"
                : cn(
                    "rounded-es-sm border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-200",
                    `border-s-2 ${accentBorderClass}`
                  ),
              isSearchMatch && "ring-2 ring-primary/30"
            )}
          >
            {/* Image attachments (user, vision messages) */}
            {isUser && message.images && message.images.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {message.images.map((img, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-lg border border-background/30"
                  >
                    <img
                      src={img}
                      alt={`پیوست ${toPersianDigits(i + 1)}`}
                      className="h-32 w-32 object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            {isUser ? (
              message.content ? (
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              ) : message.images && message.images.length > 0 ? (
                <p className="text-background/60 italic text-sm">
                  {toPersianDigits(message.images.length)} تصویر پیوست شد
                </p>
              ) : null
            ) : message.content ? (
              <>
                <MarkdownRenderer content={message.content} />
                {/* Blinking typewriter cursor shown while the assistant
                    message is actively streaming and has content. */}
                {message.pending && useSettings.getState().settings.streamingCursor && <span className="streaming-cursor" />}
              </>
            ) : message.pending ? (
              <TypingDots accent={persona.accent} />
            ) : (
              <p className="text-muted-foreground italic">پاسخی وجود ندارد</p>
            )}
            {message.error && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                {message.content || "خطایی رخ داد. دوباره تلاش کنید."}
              </div>
            )}
            {/* Aborted badge */}
            {!isUser && message.aborted && message.content && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <StopCircle className="h-3 w-3" />
                تولید متوقف شد — برای ادامه «ادامه» را بزنید
              </div>
            )}
          </div>
        )}

        {/* Actions row — always visible on touch devices, hover on desktop */}
        {showActions && (
          <div
            className={cn(
              "flex items-center gap-0.5 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
              isUser ? "flex-row-reverse" : "flex-row"
            )}
          >
            <ActionButton onClick={handleCopy} active={copied} activeLabel={t.copied} label={t.copy}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </ActionButton>
            {/* Copy as prompt — copy message to reuse in a new chat */}
            <ActionButton onClick={handleCopyAsPrompt} label="استفاده به‌عنوان پرامپت">
              <ArrowRight className="h-3 w-3 rtl:scale-x-[-1]" />
            </ActionButton>
            {/* Forward — copy with attribution */}
            <ActionButton onClick={handleForward} label={t.share}>
              <Share2 className="h-3 w-3" />
            </ActionButton>
            {isUser && onEdit && (
              <ActionButton onClick={startEdit} label={t.edit}>
                <Pencil className="h-3 w-3" />
              </ActionButton>
            )}
            {!isUser && message.aborted && onContinue && (
              <button
                onClick={onContinue}
                title="ادامهٔ تولید"
                className="inline-flex h-7 items-center gap-1 rounded-md bg-amber-500/15 px-2 text-xs font-medium text-amber-600 transition-all hover:bg-amber-500/25 dark:text-amber-400"
              >
                <Play className="h-3 w-3 fill-current" />
                <span className="hidden sm:inline">{t.continue}</span>
              </button>
            )}
            {!isUser && (
              <ActionButton
                onClick={isPlaying ? ttsStop : handleSpeak}
                disabled={isLoadingTts}
                label={isPlaying ? t.stopSpeak : t.speak}
                active={isPlaying}
              >
                {isLoadingTts ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : isPlaying ? (
                  <Square className="h-3 w-3 fill-current" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </ActionButton>
            )}
            {!isUser && onReact && (
              <>
                <button
                  onClick={() => handleReact("up")}
                  title={t.reactUp}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-emerald-500/10 hover:text-emerald-500",
                    message.reaction === "up" && "bg-emerald-500/10 text-emerald-500"
                  )}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleReact("down")}
                  title={t.reactDown}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-rose-500/10 hover:text-rose-500",
                    message.reaction === "down" && "bg-rose-500/10 text-rose-500"
                  )}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {/* Bookmark / Star */}
            {onBookmark && (
              <button
                onClick={handleBookmark}
                title={message.bookmarked ? "حذف نشان" : "نشان‌گذاری پیام"}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md transition-all",
                  message.bookmarked
                    ? "text-amber-500 hover:bg-amber-500/10"
                    : "text-muted-foreground/60 hover:bg-amber-500/10 hover:text-amber-500"
                )}
              >
                <Star className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  message.bookmarked && "fill-amber-500",
                  starPop && "star-pop"
                )} />
              </button>
            )}
            {!isUser && isLastAssistant && onRegenerate && (
              <ActionButton onClick={onRegenerate} label={t.regenerate}>
                <RefreshCw className="h-3 w-3" />
              </ActionButton>
            )}
            {/* Regenerate with a different persona — dropdown of all personas */}
            {!isUser && isLastAssistant && onRegenerateWithPersona && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    title="تولید دوباره با شخصیت دیگر"
                    className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span className="hidden sm:inline">سایر شخصیت‌ها</span>
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  sideOffset={6}
                  className="w-72 p-0"
                >
                  <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    تولید دوباره با…
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="m-0" />
                  <div className="max-h-80 overflow-y-auto p-1">
                    {PERSONAS.map((p) => {
                      const isCurrent = p.id === persona.id;
                      return (
                        <DropdownMenuItem
                          key={p.id}
                          disabled={isCurrent}
                          onSelect={() => {
                            if (isCurrent) return;
                            onRegenerateWithPersona(p.id);
                            const target = getPersona(p.id);
                            toast(`در حال تولید دوباره با ${target.name}…`, {
                              description: target.description,
                            });
                          }}
                          className={cn(
                            "gap-2.5 rounded-md px-2 py-2",
                            isCurrent && "opacity-60"
                          )}
                        >
                          {/* Accent colored circle with emoji glyph */}
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                              ACCENT_DOT[p.accent] ?? ACCENT_DOT.emerald
                            )}
                          >
                            {PERSONA_ICON_GLYPH[p.icon] ?? "✦"}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="flex items-center gap-1.5 text-sm font-semibold leading-tight">
                              <span className="truncate">{p.name}</span>
                              {isCurrent && (
                                <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                              )}
                            </span>
                            <span className="truncate text-[11px] leading-tight text-muted-foreground">
                              {p.description}
                            </span>
                          </span>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <button
              onClick={() => removeMessage(message.id)}
              title="حذف پیام"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 transition-all hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ActionButton({
  children,
  onClick,
  label,
  active = false,
  activeLabel,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  activeLabel?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={active && activeLabel ? activeLabel : label}
      className={cn(
        "flex h-7 items-center gap-1 rounded-md px-2 text-xs transition-all",
        active
          ? "bg-emerald-500/10 text-emerald-500"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      {children}
      <span className="hidden sm:inline">{active && activeLabel ? activeLabel : label}</span>
    </button>
  );
}

function TypingDots({ accent }: { accent: string }) {
  const dotColor: Record<string, string> = {
    emerald: "bg-emerald-500/70",
    cyan: "bg-cyan-500/70",
    rose: "bg-rose-500/70",
    amber: "bg-amber-500/70",
    violet: "bg-violet-500/70",
    orange: "bg-orange-500/70",
  };
  return (
    <div className="flex items-center gap-1.5 py-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full",
            dotColor[accent] ?? dotColor.emerald
          )}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.85, 1.1, 0.85] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

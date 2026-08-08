"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  ArrowUp,
  Square,
  Paperclip,
  X,
  Brain,
  Mic,
  MicOff,
  ImageIcon,
  LayoutTemplate,
  FolderCode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/store/chat-store";
import { PERSONAS } from "@/lib/personas";
import { useSettings } from "@/lib/settings";
import { t, toPersianDigits } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  SlashCommandMenu,
  useSlashCommands,
  type SlashCommand,
} from "./slash-commands";

const ICONS_RECORD: Record<string, string> = {
  Sparkles: "✦",
  Code2: "⌘",
  Feather: "✎",
  GraduationCap: "🎓",
  TrendingUp: "📈",
  ChefHat: "🍳",
};

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

export function ChatInput({
  onSend,
  onStop,
  slashCommandOpts,
  onOpenProjects,
  attachedProjectCount = 0,
}: {
  onSend: (text: string, opts?: { images?: string[] }) => void;
  onStop?: () => void;
  slashCommandOpts?: {
    onClear: () => void;
    onNewChat: () => void;
    onExport: () => void;
    onShowStats: () => void;
    onShowKeyboardHelp: () => void;
    onToggleThinking: () => void;
    onToggleBookmark: () => void;
    onToggleImageGen: () => void;
    onOpenSettings: () => void;
    onSearchInConv: () => void;
  };
  onOpenProjects?: () => void;
  attachedProjectCount?: number;
}) {
  const persona = useChatStore((s) => s.persona);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const setPersonaPickerOpen = useChatStore((s) => s.setPersonaPickerOpen);
  const thinkingEnabled = useChatStore((s) => s.thinkingEnabled);
  const setThinkingEnabled = useChatStore((s) => s.setThinkingEnabled);
  const setTemplatesOpen = useChatStore((s) => s.setTemplatesOpen);
  const ensureTemplatesLoaded = useChatStore((s) => s.ensureTemplatesLoaded);
  const pendingImages = useChatStore((s) => s.pendingImages);
  const addPendingImage = useChatStore((s) => s.addPendingImage);
  const removePendingImage = useChatStore((s) => s.removePendingImage);
  const clearPendingImages = useChatStore((s) => s.clearPendingImages);

  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  const [isRecording, setIsRecording] = React.useState(false);
  const [micSupported, setMicSupported] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [slashOpen, setSlashOpen] = React.useState(false);

  const slashCommands = useSlashCommands(slashCommandOpts ?? {
    onClear: () => {},
    onNewChat: () => {},
    onExport: () => {},
    onShowStats: () => {},
    onShowKeyboardHelp: () => {},
    onToggleThinking: () => {},
    onToggleBookmark: () => {},
    onToggleImageGen: () => {},
    onOpenSettings: () => {},
    onSearchInConv: () => {},
  });

  React.useEffect(() => {
    const isSlash = value.startsWith("/") && value.length < 30;
    setSlashOpen(isSlash);
  }, [value]);

  const handleSlashSelect = (cmd: SlashCommand) => {
    const shouldClear = cmd.execute();
    if (shouldClear !== false) {
      setValue("");
    }
    setSlashOpen(false);
  };

  React.useEffect(() => {
    setMicSupported(
      typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
    );
  }, []);

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const hasImages = pendingImages.length > 0;

  const handleSend = () => {
    const trimmed = value.trim();
    if ((!trimmed && !hasImages) || isStreaming) return;
    const images = hasImages ? [...pendingImages] : undefined;
    onSend(trimmed || t.whatInImage, images ? { images } : undefined);
    setValue("");
    clearPendingImages();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const settings = useSettings.getState().settings;
    if (e.key === "Enter") {
      if (settings.sendOnEnter) {
        if (!e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      } else {
        if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      }
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        setIsRecording(false);

        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(",")[1];
          try {
            const res = await fetch("/api/asr", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                audio: base64Audio,
                format: "webm",
              }),
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.text) {
              setValue((prev) => (prev ? prev + " " + data.text : data.text));
            }
          } catch {
            // ASR failed silently
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      setTimeout(() => {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
      }, 30000);

      mediaRecorder.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleFiles = React.useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files).filter(
        (f) => f.type.startsWith("image/") && f.size <= MAX_IMAGE_SIZE
      );
      arr.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          if (dataUrl) addPendingImage(dataUrl);
        };
        reader.readAsDataURL(file);
      });
    },
    [addPendingImage]
  );

  const handleOpenTemplates = () => {
    ensureTemplatesLoaded();
    setTemplatesOpen(true);
  };

  const accentColor =
    persona.accent === "cyan"
      ? "cyan"
      : persona.accent === "rose"
      ? "rose"
      : persona.accent === "amber"
      ? "amber"
      : persona.accent === "violet"
      ? "violet"
      : persona.accent === "orange"
      ? "orange"
      : "emerald";

  const charCount = value.length;

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-3 sm:px-4 sm:pb-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        className={cn(
          "relative flex flex-col gap-2 rounded-2xl border bg-card/80 p-2.5 shadow-lg backdrop-blur-sm transition-all duration-200 input-glow",
          isDragOver
            ? "border-violet-500 shadow-violet-500/20 shadow-xl scale-[1.01]"
            : isStreaming
            ? "border-emerald-500/40 shadow-emerald-500/5 shadow-xl"
            : "border-border shadow-black/5 focus-within:border-emerald-500/30 focus-within:shadow-md focus-within:shadow-emerald-500/5"
        )}
      >
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-violet-500/10"
            >
              <div className="flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
                <ImageIcon className="h-4 w-4" />
                {t.dropImages}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {slashOpen && slashCommandOpts && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 right-0 z-30 mb-2"
            >
              <SlashCommandMenu
                query={value}
                commands={slashCommands}
                onSelect={handleSlashSelect}
                onClose={() => setSlashOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {hasImages && (
          <div className="flex flex-wrap gap-2 p-1">
            {pendingImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-background"
              >
                <img
                  src={img}
                  alt={`پیوست ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => removePendingImage(i)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="حذف تصویر"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={
            hasImages
              ? t.askAboutImages
              : t.messagePlaceholder(persona.name)
          }
          className="max-h-[200px] min-h-[24px] w-full resize-none bg-transparent px-2 py-1.5 text-[0.95rem] leading-relaxed outline-none placeholder:text-muted-foreground/50"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {/* Persona chip */}
            <button
              onClick={() => setPersonaPickerOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background/60 px-2 py-1.5 min-h-9 text-xs text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:border-border active:scale-95"
            >
              <span className="text-sm">
                {ICONS_RECORD[persona.icon] ?? "✦"}
              </span>
              <span className="hidden sm:inline">{persona.name}</span>
            </button>

            {/* Think toggle */}
            <button
              onClick={() => setThinkingEnabled(!thinkingEnabled)}
              title={
                thinkingEnabled
                   ? "حالت تفکر روشن است — ایده گام‌به‌گام فکر می‌کند (کندتر)"
                  : "فعال‌سازی حالت تفکر (تفکر گام‌به‌گام)"
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition-all",
                thinkingEnabled
                  ? "border-violet-500/50 bg-violet-500/10 text-violet-600 shadow-sm shadow-violet-500/10 dark:text-violet-400"
                  : "border-border bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground"
              )}
            >
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.think}</span>
            </button>

            {/* Templates button */}
            <button
              onClick={handleOpenTemplates}
              title={t.templates}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background/60 px-2 py-1.5 min-h-9 text-xs text-muted-foreground transition-all hover:bg-background hover:text-foreground active:scale-95"
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t.templates}</span>
            </button>

            {/* Project files button */}
            {onOpenProjects && (
              <button
                onClick={onOpenProjects}
                title={t.projectsTitle}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition-all",
                  attachedProjectCount > 0
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground"
                )}
              >
                <FolderCode className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{t.projectsTitle.split(" ")[0]}</span>
                {attachedProjectCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                    {toPersianDigits(attachedProjectCount)}
                  </span>
                )}
              </button>
            )}

            {micSupported && (
              <button
                onClick={handleMicClick}
                title={isRecording ? t.stopRec : t.mic}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition-all",
                  isRecording
                    ? "border-red-500/50 bg-red-500/10 text-red-600 shadow-sm shadow-red-500/10 dark:text-red-400"
                    : "border-border bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground"
                )}
              >
                <AnimatePresence mode="wait">
                  {isRecording ? (
                    <motion.div
                      key="recording"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center"
                    >
                      <MicOff className="h-3.5 w-3.5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center"
                    >
                      <Mic className="h-3.5 w-3.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <span className="hidden sm:inline">
                  {isRecording ? t.stop : t.mic}
                </span>
                {isRecording && (
                  <motion.span
                    className="h-2 w-2 rounded-full bg-red-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </button>
            )}

            <button
              onClick={() => {
                const prefix = "/image ";
                if (!value.startsWith(prefix)) {
                  setValue(prefix + value);
                }
                textareaRef.current?.focus();
              }}
              title={t.image}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs text-muted-foreground transition-all hover:bg-background hover:text-foreground"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t.image}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="پیوست تصویر برای گفت‌وگوی بینایی"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition-all",
                hasImages
                  ? "border-violet-500/50 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  : "border-border bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground"
              )}
            >
              <Paperclip className="h-3.5 w-3.5" />
              <span className="hidden md:inline">
                {hasImages ? toPersianDigits(pendingImages.length) : t.attach}
              </span>
            </button>

            {value.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setValue("")}
                className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </motion.button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {charCount > 0 && (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className={cn(
                    "text-[10px] font-mono tabular-nums",
                    charCount > 4000
                      ? "text-red-500"
                      : charCount > 2000
                      ? "text-amber-500"
                      : "text-muted-foreground/50"
                  )}
                >
                  {charCount > 999 ? toPersianDigits((charCount / 1000).toFixed(1)) + "k" : toPersianDigits(charCount)}
                </motion.span>
              )}
            </AnimatePresence>

            {isStreaming ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStop}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background shadow-sm transition-colors"
                aria-label={t.stop}
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!value.trim() && !hasImages}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none",
                  hasImages
                    ? "bg-violet-500 hover:bg-violet-600"
                    : accentColor === "emerald" && "bg-emerald-500 hover:bg-emerald-600",
                  !hasImages && accentColor === "cyan" && "bg-cyan-500 hover:bg-cyan-600",
                  !hasImages && accentColor === "rose" && "bg-rose-500 hover:bg-rose-600",
                  !hasImages && accentColor === "amber" && "bg-amber-500 hover:bg-amber-600",
                  !hasImages && accentColor === "violet" && "bg-violet-500 hover:bg-violet-600",
                  !hasImages && accentColor === "orange" && "bg-orange-500 hover:bg-orange-600"
                )}
                aria-label={t.send}
              >
                <ArrowUp className="h-4 w-4 rtl:rotate-180" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-3 text-[11px] text-muted-foreground/70">
        {useSettings.getState().settings.sendOnEnter ? (
          <>
            <span>
              {t.enterToSend}{" "}
              <kbd className="rounded border border-border/60 bg-muted/50 px-1 font-mono text-[10px]">
                Enter
              </kbd>
            </span>
            <span className="hidden sm:inline">
              <kbd className="rounded border border-border/60 bg-muted/50 px-1 font-mono text-[10px]">
                Shift+Enter
              </kbd>{" "}
              {t.shiftEnterNewline}
            </span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">
              <kbd className="rounded border border-border/60 bg-muted/50 px-1 font-mono text-[10px]">
                ⌘+Enter
              </kbd>{" "}
              {t.cmdEnterToSend}
            </span>
            <span>
              <kbd className="rounded border border-border/60 bg-muted/50 px-1 font-mono text-[10px]">
                Enter
              </kbd>{" "}
              {t.enterNewline}
            </span>
          </>
        )}
        {thinkingEnabled && (
          <span className="inline-flex items-center gap-1 text-violet-500/80">
            <Brain className="h-2.5 w-2.5" /> {t.reasoningOn}
          </span>
        )}
        {hasImages && (
          <span className="inline-flex items-center gap-1 text-violet-500/80">
            <ImageIcon className="h-2.5 w-2.5" /> {t.visionMode(pendingImages.length)}
          </span>
        )}
        {value.startsWith("/image") && (
          <span className="inline-flex items-center gap-1 text-amber-500/80">
            <ImageIcon className="h-2.5 w-2.5" /> {t.imageGenMode}
          </span>
        )}
      </div>
    </div>
  );
}

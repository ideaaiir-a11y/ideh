"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Code2,
  Feather,
  GraduationCap,
  TrendingUp,
  ChefHat,
  ArrowUp,
  Zap,
  MessageSquare,
  Globe,
  Lightbulb,
} from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";
import { t, BRAND_NAME, DEVELOPER } from "@/lib/i18n";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Code2,
  Feather,
  GraduationCap,
  TrendingUp,
  ChefHat,
};

const ICON_BG: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cyan: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  orange: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
};

const ICON_BORDER: Record<string, string> = {
  emerald: "ring-emerald-500/30",
  cyan: "ring-cyan-500/30",
  rose: "ring-rose-500/30",
  amber: "ring-amber-500/30",
  violet: "ring-violet-500/30",
  orange: "ring-orange-500/30",
};

const ACCENT_ORB: Record<string, string> = {
  emerald: "bg-emerald-400",
  cyan: "bg-cyan-400",
  rose: "bg-rose-400",
  amber: "bg-amber-400",
  violet: "bg-violet-400",
  orange: "bg-orange-400",
};

const SUGGESTION_ICONS: React.ComponentType<{ className?: string }>[] = [
  Zap,
  MessageSquare,
  Lightbulb,
  Globe,
];

const SUGGESTION_BADGES = ["سریع", "محبوب", "خلاقانه", "حرفه‌ای"];

export function ChatWelcome({ onPick }: { onPick: (text: string) => void }) {
  const persona = useChatStore((s) => s.persona);
  const setPersonaPickerOpen = useChatStore((s) => s.setPersonaPickerOpen);
  const Icon = ICONS[persona.icon] ?? Sparkles;

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10 sm:py-16">
      {/* Floating decorative orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "float-orb absolute -left-20 top-10 h-48 w-48 rounded-full opacity-[0.07] blur-3xl",
            ACCENT_ORB[persona.accent] ?? ACCENT_ORB.emerald
          )}
        />
        <div
          className={cn(
            "float-orb-delay absolute -right-16 bottom-20 h-56 w-56 rounded-full opacity-[0.05] blur-3xl",
            ACCENT_ORB[persona.accent] ?? ACCENT_ORB.emerald
          )}
        />
        <div
          className={cn(
            "float-orb-slow absolute left-1/3 top-1/2 h-40 w-40 rounded-full opacity-[0.04] blur-3xl",
            ACCENT_ORB[persona.accent] ?? ACCENT_ORB.emerald
          )}
        />
      </div>

      {/* Brand wordmark */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-4 flex items-center gap-2"
      >
        <span className="brand-wordmark text-2xl font-extrabold tracking-tight sm:text-3xl">
          {BRAND_NAME}
        </span>
        <span className="brand-badge rounded-full px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          v2
        </span>
      </motion.div>

      {/* Animated avatar with pulse ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-6"
      >
        <div
          className={cn(
            "absolute inset-0 -m-3 rounded-3xl opacity-40 blur-xl",
            persona.accent === "emerald" && "bg-emerald-500",
            persona.accent === "cyan" && "bg-cyan-500",
            persona.accent === "rose" && "bg-rose-500",
            persona.accent === "amber" && "bg-amber-500",
            persona.accent === "violet" && "bg-violet-500",
            persona.accent === "orange" && "bg-orange-500"
          )}
        />
        <motion.div
          className={cn(
            "absolute inset-0 -m-2 rounded-2xl opacity-20",
            persona.accent === "emerald" && "border-2 border-emerald-500",
            persona.accent === "cyan" && "border-2 border-cyan-500",
            persona.accent === "rose" && "border-2 border-rose-500",
            persona.accent === "amber" && "border-2 border-amber-500",
            persona.accent === "violet" && "border-2 border-violet-500",
            persona.accent === "orange" && "border-2 border-orange-500"
          )}
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={cn(
            "relative flex h-18 w-18 items-center justify-center rounded-2xl shadow-lg ring-1",
            ICON_BG[persona.accent] ?? ICON_BG.emerald,
            ICON_BORDER[persona.accent] ?? ICON_BORDER.emerald
          )}
          style={{ width: 72, height: 72 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          <Icon className="h-9 w-9" />
          <motion.div
            className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-2.5 w-2.5 text-amber-500" />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center text-2xl font-semibold tracking-tight sm:text-3xl"
      >
        {t.chatWith(" ")}
        <span
          className={cn(
            persona.accent === "emerald" && "text-emerald-600 dark:text-emerald-400",
            persona.accent === "cyan" && "text-cyan-600 dark:text-cyan-400",
            persona.accent === "rose" && "text-rose-600 dark:text-rose-400",
            persona.accent === "amber" && "text-amber-600 dark:text-amber-400",
            persona.accent === "violet" && "text-violet-600 dark:text-violet-400",
            persona.accent === "orange" && "text-orange-600 dark:text-orange-400"
          )}
        >
          {persona.name}
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-2.5 max-w-md text-center text-sm leading-relaxed text-muted-foreground"
      >
        {persona.description}
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setPersonaPickerOpen(true)}
        className={cn(
          "mt-4 inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium shadow-sm transition-all hover:shadow-md",
          persona.accent === "emerald" && "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/50 dark:text-emerald-400",
          persona.accent === "cyan" && "border-cyan-500/30 bg-cyan-500/5 text-cyan-600 hover:bg-cyan-500/10 hover:border-cyan-500/50 dark:text-cyan-400",
          persona.accent === "rose" && "border-rose-500/30 bg-rose-500/5 text-rose-600 hover:bg-rose-500/10 hover:border-rose-500/50 dark:text-rose-400",
          persona.accent === "amber" && "border-amber-500/30 bg-amber-500/5 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/50 dark:text-amber-400",
          persona.accent === "violet" && "border-violet-500/30 bg-violet-500/5 text-violet-600 hover:bg-violet-500/10 hover:border-violet-500/50 dark:text-violet-400",
          persona.accent === "orange" && "border-orange-500/30 bg-orange-500/5 text-orange-600 hover:bg-orange-500/10 hover:border-orange-500/50 dark:text-orange-400"
        )}
      >
        <Sparkles className="h-3 w-3" />
        {t.switchAssistant}
      </motion.button>

      {persona.suggestions && persona.suggestions.length > 0 && (
        <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
          {persona.suggestions.map((s, i) => {
            const SIcon = SUGGESTION_ICONS[i % SUGGESTION_ICONS.length];
            return (
              <motion.button
                key={s}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.25 + i * 0.06,
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPick(s)}
                className={cn(
                  "group relative flex items-start justify-between gap-3 rounded-xl border bg-card p-4 text-right shadow-sm transition-all hover:shadow-lg",
                  persona.accent === "emerald" && "border-border hover:border-emerald-500/50 hover:bg-emerald-500/[0.03]",
                  persona.accent === "cyan" && "border-border hover:border-cyan-500/50 hover:bg-cyan-500/[0.03]",
                  persona.accent === "rose" && "border-border hover:border-rose-500/50 hover:bg-rose-500/[0.03]",
                  persona.accent === "amber" && "border-border hover:border-amber-500/50 hover:bg-amber-500/[0.03]",
                  persona.accent === "violet" && "border-border hover:border-violet-500/50 hover:bg-violet-500/[0.03]",
                  persona.accent === "orange" && "border-border hover:border-orange-500/50 hover:bg-orange-500/[0.03]"
                )}
              >
                <div
                  className={cn(
                    "absolute left-0 top-0 h-16 w-16 rounded-br-full opacity-[0.04] transition-opacity group-hover:opacity-[0.08]",
                    persona.accent === "emerald" && "bg-emerald-500",
                    persona.accent === "cyan" && "bg-cyan-500",
                    persona.accent === "rose" && "bg-rose-500",
                    persona.accent === "amber" && "bg-amber-500",
                    persona.accent === "violet" && "bg-violet-500",
                    persona.accent === "orange" && "bg-orange-500"
                  )}
                />
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                    persona.accent === "emerald" && "text-muted-foreground/40 group-hover:text-emerald-500 group-hover:bg-emerald-500/10",
                    persona.accent === "cyan" && "text-muted-foreground/40 group-hover:text-cyan-500 group-hover:bg-cyan-500/10",
                    persona.accent === "rose" && "text-muted-foreground/40 group-hover:text-rose-500 group-hover:bg-rose-500/10",
                    persona.accent === "amber" && "text-muted-foreground/40 group-hover:text-amber-500 group-hover:bg-amber-500/10",
                    persona.accent === "violet" && "text-muted-foreground/40 group-hover:text-violet-500 group-hover:bg-violet-500/10",
                    persona.accent === "orange" && "text-muted-foreground/40 group-hover:text-orange-500 group-hover:bg-orange-500/10"
                  )}>
                    <SIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm leading-snug text-foreground/90">
                      {s}
                    </span>
                    <span className={cn(
                      "text-[10px] font-medium tracking-wider opacity-0 transition-opacity group-hover:opacity-60",
                      persona.accent === "emerald" && "text-emerald-500",
                      persona.accent === "cyan" && "text-cyan-500",
                      persona.accent === "rose" && "text-rose-500",
                      persona.accent === "amber" && "text-amber-500",
                      persona.accent === "violet" && "text-violet-500",
                      persona.accent === "orange" && "text-orange-500"
                    )}>
                      {SUGGESTION_BADGES[i % SUGGESTION_BADGES.length]}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all",
                    persona.accent === "emerald" && "bg-emerald-500/0 text-muted-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-500",
                    persona.accent === "cyan" && "bg-cyan-500/0 text-muted-foreground group-hover:bg-cyan-500/10 group-hover:text-cyan-500",
                    persona.accent === "rose" && "bg-rose-500/0 text-muted-foreground group-hover:bg-rose-500/10 group-hover:text-rose-500",
                    persona.accent === "amber" && "bg-amber-500/0 text-muted-foreground group-hover:bg-amber-500/10 group-hover:text-amber-500",
                    persona.accent === "violet" && "bg-violet-500/0 text-muted-foreground group-hover:bg-violet-500/10 group-hover:text-violet-500",
                    persona.accent === "orange" && "bg-orange-500/0 text-muted-foreground group-hover:bg-orange-500/10 group-hover:text-orange-500"
                  )}
                >
                  <ArrowUp className="h-3.5 w-3.5 -rotate-45 group-hover:rotate-0 transition-transform rtl:rotate-45 rtl:group-hover:rotate-0" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Keyboard shortcut hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-8 text-center text-[11px] text-muted-foreground/50"
      >
        {t.pressForCommands}{" "}
        <kbd className="kbd-key mx-0.5">⌘K</kbd>{" "}
        · {t.forShortcuts}{" "}
        <kbd className="kbd-key mx-0.5">؟</kbd>
      </motion.p>

      {/* Developer credit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="dev-credit mt-6 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] text-muted-foreground"
      >
        <Sparkles className="h-3 w-3 text-emerald-500" />
        <span>توسعه‌دهنده: {DEVELOPER}</span>
      </motion.div>
    </div>
  );
}

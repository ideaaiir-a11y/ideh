"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eraser,
  Sparkles,
  Brain,
  FileText,
  Keyboard,
  BarChart3,
  Search,
  Bookmark,
  Image as ImageIcon,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface SlashCommand {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Execute the command. Return true to clear the input. */
  execute: () => boolean | void;
}

interface SlashCommandsProps {
  /** The current input value (must start with "/" to show) */
  query: string;
  /** Called when a command is selected */
  onSelect: (command: SlashCommand) => void;
  /** Called to close the menu */
  onClose: () => void;
  /** Available commands */
  commands: SlashCommand[];
}

export function SlashCommandMenu({
  query,
  onSelect,
  onClose,
  commands,
}: SlashCommandsProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Filter commands based on the query after "/"
  const queryLower = query.slice(1).toLowerCase();
  const filtered = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(queryLower) ||
      cmd.description.toLowerCase().includes(queryLower)
  );

  // Reset selected index when filtered list changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  React.useEffect(() => {
    if (!filtered.length) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((i) => (i + 1) % filtered.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
          break;
        case "Enter":
          e.preventDefault();
          e.stopPropagation();
          if (filtered[selectedIndex]) {
            onSelect(filtered[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
        case "Tab":
          e.preventDefault();
          e.stopPropagation();
          if (filtered[selectedIndex]) {
            onSelect(filtered[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (!filtered.length) {
    return (
      <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-border bg-popover p-3 shadow-lg">
        <p className="text-center text-sm text-muted-foreground">
          فرمانی یافت نشد
        </p>
      </div>
    );
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
      <div className="border-b border-border/60 px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          فرمان‌ها
        </span>
        <span className="ms-2 text-[10px] text-muted-foreground/60">
          ↑↓ پیمایش · ↵ انتخاب · esc بستن
        </span>
      </div>
      <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filtered.map((cmd, idx) => {
            const Icon = cmd.icon;
            const isSelected = idx === selectedIndex;
            return (
              <motion.button
                key={cmd.id}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                onClick={() => onSelect(cmd)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right text-sm transition-colors",
                  isSelected
                    ? "bg-accent text-foreground"
                    : "text-foreground/80 hover:bg-accent/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    isSelected
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-medium">
                      /{cmd.name}
                    </span>
                  </div>
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {cmd.description}
                  </span>
                </div>
                {isSelected && (
                  <span className="shrink-0 rounded border border-border/60 px-1 font-mono text-[10px] text-muted-foreground/60">
                    ↵
                  </span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Hook that returns the list of slash commands with their execute functions.
 */
export function useSlashCommands(opts: {
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
}): SlashCommand[] {
  return React.useMemo(
    () => [
      {
        id: "clear",
        name: "clear",
        description: "پاک‌سازی پیام‌های گفت‌وگوی فعلی",
        icon: Eraser,
        execute: () => {
          opts.onClear();
          return true;
        },
      },
      {
        id: "new",
        name: "new",
        description: "شروع یک گفت‌وگوی جدید",
        icon: Sparkles,
        execute: () => {
          opts.onNewChat();
          return true;
        },
      },
      {
        id: "think",
        name: "think",
        description: "تغییر حالت تفکر گام‌به‌گام",
        icon: Brain,
        execute: () => {
          opts.onToggleThinking();
          return true;
        },
      },
      {
        id: "export",
        name: "export",
        description: "خروجی گفت‌وگو به‌صورت Markdown",
        icon: FileText,
        execute: () => {
          opts.onExport();
          return true;
        },
      },
      {
        id: "stats",
        name: "stats",
        description: "نمایش آمار گفت‌وگو",
        icon: BarChart3,
        execute: () => {
          opts.onShowStats();
          return true;
        },
      },
      {
        id: "help",
        name: "help",
        description: "نمایش میان‌برهای صفحه‌کلید",
        icon: Keyboard,
        execute: () => {
          opts.onShowKeyboardHelp();
          return true;
        },
      },
      {
        id: "search",
        name: "search",
        description: "جست‌وجو در گفت‌وگو (⌘F)",
        icon: Search,
        execute: () => {
          opts.onSearchInConv();
          return true;
        },
      },
      {
        id: "bookmark",
        name: "bookmark",
        description: "تغییر فیلتر نشان‌گذاری",
        icon: Bookmark,
        execute: () => {
          opts.onToggleBookmark();
          return true;
        },
      },
      {
        id: "image",
        name: "image",
         description: "تولید تصویر با ایده",
        icon: ImageIcon,
        execute: () => {
          opts.onToggleImageGen();
          return true;
        },
      },
      {
        id: "settings",
        name: "settings",
        description: "باز کردن تنظیمات",
        icon: Settings,
        execute: () => {
          opts.onOpenSettings();
          return true;
        },
      },
    ],
    [opts]
  );
}

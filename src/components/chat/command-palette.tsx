"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  MessageSquare,
  Sparkles,
  LayoutTemplate,
  Brain,
  Trash2,
  FileText,
  FileJson,
  BarChart3,
  Moon,
  Sun,
  CornerDownLeft,
  PanelLeft,
  Code2,
  Feather,
  GraduationCap,
  TrendingUp,
  ChefHat,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useChatStore } from "@/store/chat-store";
import { getPersona, PERSONAS } from "@/lib/personas";
import { cn } from "@/lib/utils";
import { faNumber, BRAND_NAME } from "@/lib/i18n";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  shortcut?: string;
  keywords?: string;
  action: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onNewChat,
  onExportMarkdown,
  onExportJson,
  onShowStats,
  onClearAll,
  onTogglePin,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onNewChat: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onShowStats: () => void;
  onClearAll: () => void;
  onTogglePin?: () => void;
}) {
  const conversations = useChatStore((s) => s.conversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const setPersona = useChatStore((s) => s.setPersona);
  const setPersonaPickerOpen = useChatStore((s) => s.setPersonaPickerOpen);
  const setTemplatesOpen = useChatStore((s) => s.setTemplatesOpen);
  const setThinkingEnabled = useChatStore((s) => s.setThinkingEnabled);
  const thinkingEnabled = useChatStore((s) => s.thinkingEnabled);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const setFolderFilter = useChatStore((s) => s.setFolderFilter);

  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Use next-themes for theme toggle (fixes the direct DOM manipulation bug)
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const toggleTheme = React.useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  // Build the command list
  const commands = React.useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Actions group
    items.push({
      id: "new-chat",
      label: "گفت‌وگوی جدید",
      description: "شروع یک گفت‌وگوی تازه",
      icon: Plus,
      group: "عملیات",
      shortcut: "⌘K",
      action: () => {
        onNewChat();
        onOpenChange(false);
      },
    });
    items.push({
      id: "templates",
      label: "باز کردن الگوهای پرامپت",
      description: "درج یک پرامپت ذخیره‌شده یا آماده",
      icon: LayoutTemplate,
      group: "عملیات",
      action: () => {
        useChatStore.getState().ensureTemplatesLoaded();
        setTemplatesOpen(true);
        onOpenChange(false);
      },
    });
    items.push({
      id: "toggle-thinking",
      label: thinkingEnabled ? "غیرفعال‌سازی حالت تفکر" : "فعال‌سازی حالت تفکر",
      description: thinkingEnabled ? "خاموش کردن تفکر گام‌به‌گام" : "روشن کردن تفکر گام‌به‌گام",
      icon: Brain,
      group: "عملیات",
      action: () => {
        setThinkingEnabled(!thinkingEnabled);
        onOpenChange(false);
      },
    });
    items.push({
      id: "toggle-theme",
      label: "تغییر تم",
      description: "تغییر بین حالت روشن و تیره",
      icon: isDark ? Sun : Moon,
      group: "عملیات",
      action: () => {
        toggleTheme();
        onOpenChange(false);
      },
    });
    items.push({
      id: "toggle-sidebar",
      label: "نوار کناری",
      description: "نمایش یا پنهان کردن فهرست گفت‌وگوها",
      icon: PanelLeft,
      group: "عملیات",
      action: () => {
        setSidebarOpen(!useChatStore.getState().sidebarOpen);
        onOpenChange(false);
      },
    });
    // Pin/unpin conversation
    if (onTogglePin) {
      const activeId = useChatStore.getState().activeConversationId;
      const activeConv = conversations.find((c) => c.id === activeId);
      if (activeConv) {
        items.push({
          id: "toggle-pin",
          label: activeConv.pinned ? "برداشتن سنجاع گفت‌وگو" : "سنجاع گفت‌وگو",
          description: activeConv.pinned ? "حذف از سنجاع‌شده‌ها" : "سنجاع به بالای نوار کناری",
          icon: Sparkles,
          group: "عملیات",
          action: () => {
            onTogglePin();
            onOpenChange(false);
          },
        });
      }
    }

    // Conversation group (if any exist)
    conversations.slice(0, 8).forEach((c) => {
      const persona = getPersona(c.personaId);
      const Icon = PERSONA_ICONS[persona.icon] ?? MessageSquare;
      items.push({
        id: `conv-${c.id}`,
        label: c.title,
        description: `${persona.name} · ${faNumber(c.messageCount)} پیام`,
        icon: Icon,
        group: "گفت‌وگوها",
        keywords: c.title.toLowerCase(),
        action: () => {
          setActiveConversation(c.id);
          setPersona(persona);
          onOpenChange(false);
        },
      });
    });

    // Export & stats group (if there's an active conversation)
    if (conversations.length > 0) {
      items.push({
        id: "export-md",
        label: "خروجی Markdown",
        description: "دریافت گفت‌وگوی فعلی به‌صورت .md",
        icon: FileText,
        group: "ابزارها",
        action: () => {
          onExportMarkdown();
          onOpenChange(false);
        },
      });
      items.push({
        id: "export-json",
        label: "خروجی JSON",
        description: "دریافت گفت‌وگوی فعلی به‌صورت .json",
        icon: FileJson,
        group: "ابزارها",
        action: () => {
          onExportJson();
          onOpenChange(false);
        },
      });
      items.push({
        id: "stats",
        label: "نمایش آمار گفت‌وگو",
        description: "تعداد پیام‌ها، نویسه‌ها و واکنش‌ها",
        icon: BarChart3,
        group: "ابزارها",
        action: () => {
          onShowStats();
          onOpenChange(false);
        },
      });
    }

    // Destructive group
    if (conversations.length > 0) {
      items.push({
        id: "clear-all",
        label: "پاک‌سازی همهٔ گفت‌وگوها",
        description: `حذف همهٔ ${faNumber(conversations.length)} گفت‌وگو برای همیشه`,
        icon: Trash2,
        group: "خطرناک",
        action: () => {
          onClearAll();
          onOpenChange(false);
        },
      });
    }

    return items;
  }, [
    conversations,
    thinkingEnabled,
    isDark,
    onNewChat,
    onExportMarkdown,
    onExportJson,
    onShowStats,
    onClearAll,
    onTogglePin,
    onOpenChange,
    setActiveConversation,
    setPersona,
    setTemplatesOpen,
    setThinkingEnabled,
    setSidebarOpen,
    toggleTheme,
  ]);

  // Filter commands by query
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const hay = `${c.label} ${c.description ?? ""} ${c.group} ${c.keywords ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [commands, query]);

  // Group filtered commands
  const grouped = React.useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const c of filtered) {
      const arr = map.get(c.group) ?? [];
      arr.push(c);
      map.set(c.group, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // Reset query and selection when opened
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Reset selection when query changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  React.useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[selectedIndex];
      if (item) item.action();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[15vh]"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
          >
            {/* Search input */}
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="فرمان را جست‌وجو کنید…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
              <kbd className="hidden shrink-0 rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="custom-scrollbar flex-1 overflow-y-auto p-2"
            >
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Search className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">نتیجه‌ای یافت نشد</p>
                  <p className="text-xs text-muted-foreground/60">عبارت دیگری را جست‌وجو کنید</p>
                </div>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group} className="mb-2">
                    <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground/60">
                      {group}
                    </div>
                    {items.map((item) => {
                      const idx = filtered.indexOf(item);
                      const Icon = item.icon;
                      const isSelected = idx === selectedIndex;
                      const isDanger = item.group === "خطرناک";
                      return (
                        <button
                          key={item.id}
                          data-idx={idx}
                          onMouseMove={() => setSelectedIndex(idx)}
                          onClick={() => item.action()}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-right transition-colors",
                            isSelected
                              ? isDanger
                                ? "bg-destructive/10 text-destructive"
                                : "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                              isSelected
                                ? isDanger
                                  ? "bg-destructive/15 text-destructive"
                                  : "bg-primary/15 text-primary"
                                : "bg-muted/50 text-muted-foreground"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">
                              {item.label}
                            </div>
                            {item.description && (
                              <div className="truncate text-[11px] text-muted-foreground">
                                {item.description}
                              </div>
                            )}
                          </div>
                          {item.shortcut && (
                            <kbd className="hidden shrink-0 rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
                              {item.shortcut}
                            </kbd>
                          )}
                          {isSelected && !item.shortcut && (
                            <CornerDownLeft className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 text-[10px] text-muted-foreground/70">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-border/60 bg-muted/40 px-1 py-0.5 font-mono">↑</kbd>
                  <kbd className="rounded border border-border/60 bg-muted/40 px-1 py-0.5 font-mono">↓</kbd>
                  پیمایش
                </span>
                <span className="hidden items-center gap-1 sm:inline-flex">
                  <kbd className="rounded border border-border/60 bg-muted/40 px-1 py-0.5 font-mono">↵</kbd>
                  انتخاب
                </span>
              </div>
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                پنل فرمان {BRAND_NAME}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Minimal icon set for conversations (persona icons)
const PERSONA_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Code2,
  Feather,
  GraduationCap,
  TrendingUp,
  ChefHat,
};

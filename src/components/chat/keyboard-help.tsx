"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, Sparkles, Search, Brain, PanelLeft, Moon, FileText, FileJson, BarChart3, Trash2, MessageSquare, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/i18n";

interface ShortcutGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "عمومی",
    icon: Keyboard,
    shortcuts: [
      { keys: ["⌘", "K"], description: "باز کردن پنل فرمان" },
      { keys: ["؟"], description: "نمایش میان‌برهای صفحه‌کلید" },
      { keys: ["Esc"], description: "بستن پنجره / انصراف" },
    ],
  },
  {
    title: "گفت‌وگو",
    icon: MessageSquare,
    shortcuts: [
      { keys: ["Enter"], description: "ارسال پیام" },
      { keys: ["⇧", "Enter"], description: "خط جدید در پیام" },
      { keys: ["⌘", "⇧", "N"], description: "گفت‌وگوی جدید" },
      { keys: ["⌘", "/"], description: "تمرکز روی جست‌وجو" },
    ],
  },
  {
    title: "پیمایش",
    icon: PanelLeft,
    shortcuts: [
      { keys: ["↑", "↓"], description: "پیمایش موارد (در پنل فرمان)" },
      { keys: ["↵"], description: "انتخاب مورد" },
    ],
  },
  {
    title: "ابزارها",
    icon: Sparkles,
    shortcuts: [
      { keys: ["کلیک", "تفکر"], description: "تغییر حالت تفکر" },
      { keys: ["کلیک", "میکروفون"], description: "ورودی صوتی" },
      { keys: ["کلیک", "تصویر"], description: "تولید تصویر" },
      { keys: ["کلیک", "پیوست"], description: "پیوست تصویر برای حالت بینایی" },
      { keys: ["/image", "..."], description: "تولید تصویر از پرامپت" },
    ],
  },
  {
    title: "عملیات پیام",
    icon: LayoutTemplate,
    shortcuts: [
      { keys: ["Hover", "پیام"], description: "نمایش دکمه‌های عملیات" },
      { keys: ["کلیک", "کپی"], description: "کپی متن پیام" },
      { keys: ["کلیک", "ویرایش"], description: "ویرایش پیام شما" },
      { keys: ["کلیک", "★"], description: "نشان‌گذاری پیام" },
      { keys: ["کلیک", "خواندن"], description: "خواندن بلند (TTS)" },
      { keys: ["کلیک", "👍/👎"], description: "واکنش به پاسخ" },
    ],
  },
];

export function KeyboardHelp({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                  <Keyboard className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">میان‌برهای صفحه‌کلید</h2>
                  <p className="text-[11px] text-muted-foreground">
                    مرجع سریع همهٔ میان‌برها
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="بستن"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Shortcut groups */}
            <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
              <div className="grid gap-5">
                {SHORTCUT_GROUPS.map((group) => {
                  const GIcon = group.icon;
                  return (
                    <div key={group.title}>
                      <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground">
                        <GIcon className="h-3.5 w-3.5" />
                        {group.title}
                      </div>
                      <div className="grid gap-1.5">
                        {group.shortcuts.map((s) => (
                          <div
                            key={s.description}
                            className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
                          >
                            <span className="text-sm text-foreground/90">
                              {s.description}
                            </span>
                            <div className="flex items-center gap-1">
                              {s.keys.map((key, i) => (
                                <React.Fragment key={key + i}>
                                  {i > 0 && (
                                    <span className="text-[10px] text-muted-foreground/40">+</span>
                                  )}
                                  <kbd className="kbd-key">{key}</kbd>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[11px] text-muted-foreground/60">
              <span>برای بستن <kbd className="kbd-key mx-0.5 text-[10px]">؟</kbd> یا <kbd className="kbd-key mx-0.5 text-[10px]">Esc</kbd> را بزنید</span>
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {BRAND_NAME}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

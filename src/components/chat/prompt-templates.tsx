"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  List,
  Code2,
  Wrench,
  Languages,
  Mail,
  Lightbulb,
  ClipboardList,
  Bug,
  PenLine,
  Calendar,
  Scale,
  Plus,
  Trash2,
  X,
  Search,
  Sparkles,
} from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import {
  BUILTIN_TEMPLATES,
  groupByCategory,
  type PromptTemplate,
} from "@/lib/prompt-templates";
import { cn } from "@/lib/utils";
import { faNumber } from "@/lib/i18n";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  List,
  Code2,
  Wrench,
  Languages,
  Mail,
  Lightbulb,
  ClipboardList,
  Bug,
  PenLine,
  Calendar,
  Scale,
  Sparkles,
};

export function PromptTemplatesModal({
  onInsert,
  currentValue,
}: {
  onInsert: (content: string) => void;
  currentValue: string;
}) {
  const open = useChatStore((s) => s.templatesOpen);
  const setOpen = useChatStore((s) => s.setTemplatesOpen);
  const userTemplates = useChatStore((s) => s.userTemplates);
  const addUserTemplate = useChatStore((s) => s.addUserTemplate);
  const removeUserTemplate = useChatStore((s) => s.removeUserTemplate);

  const [query, setQuery] = React.useState("");
  const [showSaveBox, setShowSaveBox] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newCategory, setNewCategory] = React.useState("دلخواه");
  const [newContent, setNewContent] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setNewContent(currentValue);
    }
  }, [open, currentValue]);

  const allTemplates = [...BUILTIN_TEMPLATES, ...userTemplates];

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allTemplates;
    return allTemplates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [allTemplates, query]);

  const grouped = React.useMemo(
    () => groupByCategory(filtered),
    [filtered]
  );

  const handleInsert = (t: PromptTemplate) => {
    onInsert(t.content);
    setOpen(false);
  };

  const handleSave = () => {
    const title = newTitle.trim();
    const content = newContent.trim();
    if (!title || !content) return;
    addUserTemplate({
      title,
      description: "الگوی ذخیره‌شدهٔ کاربر",
      content,
      category: newCategory.trim() || "دلخواه",
      icon: "Sparkles",
    });
    setNewTitle("");
    setNewContent("");
    setShowSaveBox(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">الگوهای پرامپت</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {faNumber(BUILTIN_TEMPLATES.length)} پیش‌فرض ·{" "}
                    {faNumber(userTemplates.length)} ذخیره‌شده
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="بستن"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search + Save toggle */}
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جست‌وجوی الگو…"
                  className="w-full rounded-lg border border-border bg-muted/30 py-1.5 ps-8 pe-3 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:bg-background"
                />
              </div>
              <button
                onClick={() => setShowSaveBox((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                  showSaveBox
                    ? "border-violet-500/50 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                    : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                ذخیرهٔ فعلی
              </button>
            </div>

            {/* Save box */}
            <AnimatePresence>
              {showSaveBox && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-border bg-violet-500/5"
                >
                  <div className="grid gap-2 p-4">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="عنوان الگو"
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-violet-500/40"
                      />
                      <input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="دسته (مثلاً کار، دلخواه)"
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-violet-500/40"
                      />
                    </div>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="محتوای الگو (از ورودی فعلی استفاده کنید یا تازه بنویسید)…"
                      rows={3}
                      className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet-500/40"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowSaveBox(false)}
                        className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={!newTitle.trim() || !newContent.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                        ذخیرهٔ الگو
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Template list */}
            <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
              {grouped.length === 0 ? (
                <div className="mt-12 flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40">
                    <Search className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    الگویی یافت نشد
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    عبارت دیگری را جست‌وجو کنید
                  </p>
                </div>
              ) : (
                grouped.map((group) => (
                  <div key={group.category} className="mb-5">
                    <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-semibold tracking-wider text-muted-foreground/60">
                      <span className="h-1 w-1 rounded-full bg-violet-500/60" />
                      {group.category}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.items.map((t) => {
                        const Icon = ICONS[t.icon ?? "Sparkles"] ?? Sparkles;
                        return (
                          <motion.button
                            key={t.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleInsert(t)}
                            className="group relative flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-right transition-all hover:border-violet-500/40 hover:shadow-sm hover:shadow-violet-500/5"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-sm font-medium">
                                  {t.title}
                                </p>
                                {!t.builtin && (
                                  <span className="rounded bg-violet-500/10 px-1 text-[9px] font-medium text-violet-600 dark:text-violet-400">
                                    ذخیره‌شده
                                  </span>
                                )}
                              </div>
                              {t.description && (
                                <p className="truncate text-[11px] text-muted-foreground">
                                  {t.description}
                                </p>
                              )}
                              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/70">
                                {t.content}
                              </p>
                            </div>
                            {!t.builtin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeUserTemplate(t.id);
                                }}
                                className="absolute left-2 top-2 rounded p-1 text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                                aria-label="حذف الگو"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

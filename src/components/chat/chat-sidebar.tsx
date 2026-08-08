"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
  Sparkles,
  Code2,
  Feather,
  GraduationCap,
  TrendingUp,
  ChefHat,
  X,
  PanelLeftClose,
  Search,
  Pencil,
  Check,
  Hash,
  FolderIcon,
  FolderPlus,
  FolderOpen,
  ChevronDown,
  Tag as TagIcon,
} from "lucide-react";
import { useChatStore, type ConversationSummary } from "@/store/chat-store";
import { useTagsStore } from "@/lib/tags-store";
import { TagInput } from "@/components/chat/tag-input";
import { TagFilterBar } from "@/components/chat/tag-filter-bar";
import { getPersona } from "@/lib/personas";
import { useSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  t,
  faNumber,
  toPersianDigits,
  faRelativeBucket,
  BRAND_NAME,
  TAGLINE,
  DEVELOPER,
} from "@/lib/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

function groupByDate(items: ConversationSummary[]) {
  // Persian relative buckets — labels come straight from faRelativeBucket
  // (سنجاع‌شده / امروز / دیروز / هفتهٔ اخیر / قدیمی‌تر).
  const groups: { label: string; items: ConversationSummary[] }[] = [
    { label: "سنجاق‌شده", items: [] },
    { label: "امروز", items: [] },
    { label: "دیروز", items: [] },
    { label: "هفتهٔ اخیر", items: [] },
    { label: "قدیمی‌تر", items: [] },
  ];
  for (const it of items) {
    if (it.pinned) {
      groups[0].items.push(it);
      continue;
    }
    const bucket = faRelativeBucket(it.updatedAt);
    if (bucket === "امروز") groups[1].items.push(it);
    else if (bucket === "دیروز") groups[2].items.push(it);
    else if (bucket === "هفتهٔ اخیر") groups[3].items.push(it);
    else groups[4].items.push(it);
  }
  return groups.filter((g) => g.items.length > 0);
}

export function ChatSidebar({
  onNewChat,
  onSelect,
}: {
  onNewChat: () => void;
  onSelect?: () => void;
}) {
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeConversationId);
  const setActive = useChatStore((s) => s.setActiveConversation);
  const removeConversation = useChatStore((s) => s.removeConversation);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const resetMessages = useChatStore((s) => s.resetMessages);
  const setPersona = useChatStore((s) => s.setPersona);
  const searchQuery = useChatStore((s) => s.searchQuery);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const folderFilter = useChatStore((s) => s.folderFilter);
  const setFolderFilter = useChatStore((s) => s.setFolderFilter);

  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [folderMenuId, setFolderMenuId] = React.useState<string | null>(null);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [showNewFolderInput, setShowNewFolderInput] = React.useState(false);
  const [tagEditorId, setTagEditorId] = React.useState<string | null>(null);

  // Hydrate tags store from localStorage on first client render.
  const loadAllTags = useTagsStore((s) => s.loadAllTags);
  React.useEffect(() => {
    loadAllTags();
  }, [loadAllTags]);

  const startRename = (c: ConversationSummary) => {
    setRenamingId(c.id);
    setRenameValue(c.title);
  };

  const commitRename = async (id: string) => {
    const title = renameValue.trim();
    if (!title || title.length < 1) {
      setRenamingId(null);
      return;
    }
    const conv = conversations.find((c) => c.id === id);
    if (conv && conv.title !== title) {
      upsertConversation({ ...conv, title });
      try {
        await fetch(`/api/conversations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
      } catch {
        // ignore
      }
    }
    setRenamingId(null);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  // Compute distinct folders from conversations + persisted known folders
  // + the current filter (so the tab shows even if no convs are in it yet).
  const folders = React.useMemo(() => {
    const set = new Set<string>();
    for (const c of conversations) {
      if (c.folder) set.add(c.folder);
    }
    // Load persisted known folders from localStorage
    try {
      const raw = window.localStorage.getItem("zai-chat:folders");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach((f) => typeof f === "string" && set.add(f));
      }
    } catch {
      // ignore
    }
    if (folderFilter && folderFilter !== "") set.add(folderFilter);
    return Array.from(set).sort();
  }, [conversations, folderFilter]);

  // Tags (localStorage-only) — used for tag-based filtering.
  const tagsByConv = useTagsStore((s) => s.tagsByConv);
  const activeTagFilter = useTagsStore((s) => s.activeTagFilter);

  const filteredConversations = React.useMemo(() => {
    let list = conversations;
    if (folderFilter !== null) {
      list = list.filter((c) =>
        folderFilter === "" ? !c.folder : c.folder === folderFilter
      );
    }
    if (activeTagFilter) {
      list = list.filter((c) =>
        (tagsByConv[c.id] ?? []).some(
          (t) => t.toLowerCase() === activeTagFilter.toLowerCase()
        )
      );
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery, folderFilter, activeTagFilter, tagsByConv]);

  const groups = React.useMemo(
    () => groupByDate(filteredConversations),
    [filteredConversations]
  );

  const handlePin = async (id: string, pinned: boolean) => {
    upsertConversation({
      ...conversations.find((c) => c.id === id)!,
      pinned: !pinned,
    });
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !pinned }),
      });
    } catch {
      // ignore
    }
  };

  const handleAssignFolder = async (id: string, folder: string | null) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    upsertConversation({ ...conv, folder });
    setFolderMenuId(null);
    // Persist folder name to localStorage so the tab survives even if all
    // conversations are later moved out.
    if (folder) {
      try {
        const raw = window.localStorage.getItem("zai-chat:folders");
        const arr: string[] = raw ? JSON.parse(raw) : [];
        if (!arr.includes(folder)) {
          arr.push(folder);
          window.localStorage.setItem("zai-chat:folders", JSON.stringify(arr));
        }
      } catch {
        // ignore
      }
    }
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });
    } catch {
      // ignore
    }
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    // Persist to localStorage so the tab shows even with no conversations.
    try {
      const raw = window.localStorage.getItem("zai-chat:folders");
      const arr: string[] = raw ? JSON.parse(raw) : [];
      if (!arr.includes(name)) {
        arr.push(name);
        window.localStorage.setItem("zai-chat:folders", JSON.stringify(arr));
      }
    } catch {
      // ignore
    }
    setFolderFilter(name);
    setNewFolderName("");
    setShowNewFolderInput(false);
  };

  const handleDelete = async (id: string) => {
    removeConversation(id);
    if (activeId === id) {
      setActive(null);
      resetMessages();
    }
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Header with subtle gradient — brand wordmark + v2 badge */}
      <div className="flex items-center justify-between gap-2 border-b border-sidebar-border/50 p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="brand-wordmark text-sm font-semibold tracking-tight">
                {BRAND_NAME}
              </span>
              <span className="brand-badge rounded-full px-1.5 py-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                v2
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {TAGLINE}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-8 w-8 text-muted-foreground hover:text-foreground lg:flex"
          onClick={() => setSidebarOpen(false)}
          aria-label="بستن نوار کناری"
        >
          <PanelLeftClose className="h-4 w-4 rtl:scale-x-[-1]" />
        </Button>
      </div>

      {/* New chat button */}
      <div className="px-3 pt-3 pb-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-500/20 transition-shadow hover:shadow-md hover:shadow-emerald-500/30"
        >
          <Plus className="h-4 w-4" />
          {t.newChat}
        </motion.button>
      </div>

      {/* Search */}
      {conversations.length > 0 && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-lg border border-sidebar-border/60 bg-sidebar-accent/20 py-1.5 ps-8 pe-7 text-[0.825rem] outline-none transition-all placeholder:text-muted-foreground/40 focus:border-emerald-500/40 focus:bg-background focus:shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="پاک‌سازی جست‌وجو"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Folder tabs row */}
      {conversations.length > 0 && (
        <div className="px-3 pb-2">
          <div className="folder-tabs flex items-center gap-1 overflow-x-auto pb-1">
            <FolderTab
              active={folderFilter === null}
              onClick={() => setFolderFilter(null)}
              icon={<Hash className="h-3 w-3" />}
              label={t.allChats}
            />
            <FolderTab
              active={folderFilter === ""}
              onClick={() => setFolderFilter("")}
              icon={<FolderIcon className="h-3 w-3" />}
              label="بدون پوشه"
            />
            {folders.map((f) => (
              <FolderTab
                key={f}
                active={folderFilter === f}
                onClick={() => setFolderFilter(f)}
                icon={<FolderOpen className="h-3 w-3" />}
                label={f}
              />
            ))}
            {/* New folder inline input */}
            {showNewFolderInput ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateFolder();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setShowNewFolderInput(false);
                      setNewFolderName("");
                    }
                  }}
                  onBlur={() => {
                    if (newFolderName.trim()) handleCreateFolder();
                    else setShowNewFolderInput(false);
                  }}
                  placeholder="نام پوشه…"
                  maxLength={40}
                  className="w-24 rounded-md border border-violet-500/40 bg-background px-2 py-1 text-[11px] outline-none focus:border-violet-500/70"
                />
              </div>
            ) : (
              <button
                onClick={() => setShowNewFolderInput(true)}
                className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-dashed border-border/60 px-2 text-[10px] font-medium text-muted-foreground/60 transition-all hover:border-violet-500/40 hover:text-violet-500"
                aria-label={t.addFolder}
              >
                <FolderPlus className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tag filter bar — shown only when at least one tag exists */}
      {conversations.length > 0 && <TagFilterBar />}

      {/* Conversation list */}
      <div className="custom-scrollbar flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-3 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
              <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {t.noConversations}
            </p>
            <p className="text-xs text-muted-foreground/60">
              یک گفت‌وگوی جدید شروع کنید
            </p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-3 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
              {folderFilter ? (
                <FolderIcon className="h-5 w-5 text-muted-foreground/40" />
              ) : (
                <Search className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {folderFilter
                ? "گفت‌وگویی در این پوشه نیست"
                : "موردی یافت نشد"}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {folderFilter
                ? "برای دسته‌بندی، گفت‌وگوها را با نشان پوشه منتقل کنید"
                : "عبارت دیگری را جست‌وجو کنید"}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-2">
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <div className="h-1 w-1 rounded-full bg-emerald-500/70" />
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">
                  {group.label}
                </span>
                <span className="text-[10px] font-medium tabular-nums text-muted-foreground/40">
                  {faNumber(group.items.length)}
                </span>
                <div className="ms-1 h-px flex-1 bg-sidebar-border/50" />
              </div>
              <div className="space-y-0.5">
                {group.items.map((c) => {
                  const persona = getPersona(c.personaId);
                  const Icon = ICONS[persona.icon] ?? Sparkles;
                  const active = c.id === activeId;
                  const isRenaming = renamingId === c.id;
                  const convTags = tagsByConv[c.id] ?? [];
                  const showTagEditor = tagEditorId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "group relative flex flex-col gap-1 rounded-lg px-2 py-2 text-sm transition-all duration-150",
                        active
                          ? "sidebar-active-item text-sidebar-accent-foreground shadow-sm font-medium"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                      )}
                    >
                      {isRenaming ? (
                        <>
                          <div
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                              ICON_BG[persona.accent] ?? ICON_BG.emerald
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commitRename(c.id);
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                cancelRename();
                              }
                            }}
                            onBlur={() => commitRename(c.id)}
                            className="min-w-0 flex-1 rounded-md border border-emerald-500/40 bg-background px-1.5 py-0.5 text-sm outline-none focus:border-emerald-500/70"
                            maxLength={120}
                          />
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              commitRename(c.id);
                            }}
                            className="rounded p-1 text-emerald-500 hover:bg-emerald-500/10"
                            aria-label="ذخیره نام"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="flex min-w-0 flex-1 items-center gap-2 text-right"
                            onClick={() => {
                              setActive(c.id);
                              setPersona(persona);
                              onSelect?.();
                            }}
                          >
                            <div
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                                ICON_BG[persona.accent] ?? ICON_BG.emerald,
                                active && "ring-1 ring-current/20"
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="line-clamp-2 text-[0.82rem] leading-snug" title={c.title}>{c.title}</span>
                          </button>
                          <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                            <button
                              onClick={() => handlePin(c.id, c.pinned)}
                              className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-background hover:text-foreground"
                              aria-label={c.pinned ? "برداشتن سنجاع" : "سنجاع"}
                              title={c.pinned ? "برداشتن سنجاع" : "سنجاع"}
                            >
                              {c.pinned ? (
                                <PinOff className="h-3 w-3" />
                              ) : (
                                <Pin className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              onClick={() => startRename(c)}
                              className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-background hover:text-foreground"
                              aria-label={t.rename}
                              title={t.rename}
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            {/* Tags toggle */}
                            <button
                              onClick={() =>
                                setTagEditorId(
                                  tagEditorId === c.id ? null : c.id
                                )
                              }
                              className={cn(
                                "rounded-md p-1 transition-colors hover:bg-background",
                                convTags.length > 0
                                  ? "text-amber-500"
                                  : "text-muted-foreground/60 hover:text-foreground"
                              )}
                              aria-label="ویرایش برچسب‌ها"
                              title="ویرایش برچسب‌ها"
                            >
                              <TagIcon className="h-3 w-3" />
                            </button>
                            {/* Folder menu */}
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setFolderMenuId(
                                    folderMenuId === c.id ? null : c.id
                                  )
                                }
                                className={cn(
                                  "rounded-md p-1 transition-colors hover:bg-background",
                                  c.folder
                                    ? "text-violet-500"
                                    : "text-muted-foreground/60 hover:text-foreground"
                                )}
                                aria-label="انتقال به پوشه"
                                title="انتقال به پوشه"
                              >
                                <FolderIcon className="h-3 w-3" />
                              </button>
                              {folderMenuId === c.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setFolderMenuId(null)}
                                  />
                                  <motion.div
                                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="absolute end-0 top-7 z-50 w-40 rounded-lg border border-border bg-popover p-1 shadow-lg"
                                  >
                                    <button
                                      onClick={() => handleAssignFolder(c.id, null)}
                                      className={cn(
                                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-right text-xs transition-colors hover:bg-accent",
                                        !c.folder && "bg-accent/60"
                                      )}
                                    >
                                      <FolderIcon className="h-3 w-3 text-muted-foreground" />
                                      بدون پوشه
                                    </button>
                                    {folders.length > 0 && (
                                      <div className="my-1 h-px bg-border" />
                                    )}
                                    {folders.map((f) => (
                                      <button
                                        key={f}
                                        onClick={() => handleAssignFolder(c.id, f)}
                                        className={cn(
                                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-right text-xs transition-colors hover:bg-accent",
                                          c.folder === f && "bg-accent/60 text-violet-600 dark:text-violet-400"
                                        )}
                                      >
                                        <FolderOpen className="h-3 w-3 text-violet-500" />
                                        <span className="truncate">{f}</span>
                                      </button>
                                    ))}
                                    <div className="my-1 h-px bg-border" />
                                    <button
                                      onClick={() => {
                                        setShowNewFolderInput(true);
                                        setFolderMenuId(null);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-right text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                    >
                                      <FolderPlus className="h-3 w-3" />
                                      پوشهٔ جدید…
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                if (!useSettings.getState().settings.confirmDelete) {
                                  handleDelete(c.id);
                                } else {
                                  setConfirmId(c.id);
                                }
                              }}
                              className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-background hover:text-destructive"
                              aria-label={t.delete}
                              title={t.delete}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          {c.pinned && (
                            <Pin className="absolute end-1 top-1 h-2 w-2 text-emerald-500/80" />
                          )}
                          {c.folder && (
                            <span className="absolute -start-0.5 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-violet-500/70" />
                          )}
                        </>
                      )}
                      {/* Inline tag editor (collapsible) */}
                      {showTagEditor && (
                        <TagInput conversationId={c.id} />
                      )}
                      {/* Compact tag chips preview below title */}
                      {!showTagEditor && convTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 ps-8">
                          {convTags.slice(0, 3).map((tg) => (
                            <span
                              key={tg}
                              className="inline-flex items-center rounded border border-amber-500/25 bg-amber-500/10 px-1 py-0 text-[9px] font-medium leading-tight text-amber-700 dark:text-amber-400"
                            >
                              <span className="max-w-[70px] truncate">{tg}</span>
                            </span>
                          ))}
                          {convTags.length > 3 && (
                            <span className="text-[9px] font-medium leading-tight text-amber-600/70 dark:text-amber-400/70">
                              +{toPersianDigits(convTags.length - 3)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer with tip + developer credit */}
      <div className="border-t border-sidebar-border/50 px-3 py-2.5">
        <div className="flex items-start gap-2 rounded-lg bg-sidebar-accent/30 px-3 py-2">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground/80">نکته:</span> هر زمان
            از نوار بالا شخصیت را تغییر دهید. برای پنل فرمان{" "}
            <kbd className="rounded border border-border/50 bg-muted/50 px-0.5 font-mono text-[9px]">⌘K</kbd>{" "}
            را بزنید.
          </p>
        </div>
        <div className="dev-credit mt-2 flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-[10px] text-muted-foreground">
          <Sparkles className="h-2.5 w-2.5 text-emerald-500" />
          <span>توسعه‌دهنده: {DEVELOPER}</span>
        </div>
      </div>

      <AlertDialog
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDeleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDeleteDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmId) handleDelete(confirmId);
                setConfirmId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FolderTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-all",
        active
          ? "bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30"
          : "text-muted-foreground/70 hover:bg-sidebar-accent/50 hover:text-foreground"
      )}
    >
      {icon}
      <span className="max-w-[80px] truncate">{label}</span>
    </button>
  );
}

/** Mobile sidebar drawer */
export function MobileSidebar({
  open,
  onClose,
  onNewChat,
}: {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-50 w-[280px] border-l border-border bg-background shadow-2xl lg:hidden"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-2 z-10 h-8 w-8 text-muted-foreground"
              onClick={onClose}
              aria-label="بستن"
            >
              <X className="h-4 w-4" />
            </Button>
            <ChatSidebar onNewChat={onNewChat} onSelect={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

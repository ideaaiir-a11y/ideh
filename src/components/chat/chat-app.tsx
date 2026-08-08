"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  PanelLeftOpen,
  Sparkles,
  ChevronDown,
  MoreHorizontal,
  Eraser,
  FileText,
  FileJson,
  FileDown,
  BarChart3,
  Trash2,
  Loader2,
  Search,
  Keyboard,
  Settings,
  FolderCode,
  Brain,
} from "lucide-react";
import { useChatStore, type ChatMessage, type ConversationSummary } from "@/store/chat-store";
import { getPersona } from "@/lib/personas";
import { ChatSidebar, MobileSidebar } from "./chat-sidebar";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { ChatWelcome } from "./chat-welcome";
import { PersonaPicker } from "./persona-picker";
import { PromptTemplatesModal } from "./prompt-templates";
import { CommandPalette } from "./command-palette";
import { KeyboardHelp } from "./keyboard-help";
import { SettingsDialog } from "./settings-dialog";
import { ProjectPanel } from "./project-panel";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useSettings, getProviderConfig } from "@/lib/settings";
import { useProjectStore } from "@/lib/project-store";
import { loadMemory } from "@/lib/memory-store";
import { t, faNumber, BRAND_NAME, DEVELOPER, toPersianDigits } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  exportAsMarkdown,
  exportAsJson,
  downloadFile,
  slugify,
} from "@/lib/export";

const ICONS_RECORD: Record<string, string> = {
  Sparkles: "✦",
  Code2: "⌘",
  Feather: "✎",
  GraduationCap: "🎓",
  TrendingUp: "📈",
  ChefHat: "🍳",
};

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ChatApp() {
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const messages = useChatStore((s) => s.messages);
  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const appendToMessage = useChatStore((s) => s.appendToMessage);
  const appendToReasoning = useChatStore((s) => s.appendToReasoning);
  const removeMessage = useChatStore((s) => s.removeMessage);
  const truncateAfter = useChatStore((s) => s.truncateAfter);
  const persona = useChatStore((s) => s.persona);
  const setPersona = useChatStore((s) => s.setPersona);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const setPersonaPickerOpen = useChatStore((s) => s.setPersonaPickerOpen);
  const loadedIds = useChatStore((s) => s.loadedConversationIds);
  const markLoaded = useChatStore((s) => s.markConversationLoaded);
  const resetMessages = useChatStore((s) => s.resetMessages);
  const thinkingEnabled = useChatStore((s) => s.thinkingEnabled);
  const setThinkingEnabled = useChatStore((s) => s.setThinkingEnabled);
  const setEditingId = useChatStore((s) => s.setEditingId);
  const setMessageReaction = useChatStore((s) => s.setMessageReaction);
  const removeConversation = useChatStore((s) => s.removeConversation);
  const ensureTemplatesLoaded = useChatStore((s) => s.ensureTemplatesLoaded);
  const setTemplatesOpen = useChatStore((s) => s.setTemplatesOpen);

  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [statsOpen, setStatsOpen] = React.useState(false);
  const [clearAllOpen, setClearAllOpen] = React.useState(false);
  const [imageGenerating, setImageGenerating] = React.useState(false);
  const [pdfExporting, setPdfExporting] = React.useState(false);
  const [inputDraft, setInputDraft] = React.useState("");
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [keyboardHelpOpen, setKeyboardHelpOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const projectPanelOpen = useProjectStore((s) => s.panelOpen);
  const setProjectPanelOpen = useProjectStore((s) => s.setPanelOpen);
  const abortRef = React.useRef<AbortController | null>(null);
  const loadedConversationsOnce = React.useRef(false);

  const initSettings = useSettings((s) => s.init);
  const initProject = useProjectStore((s) => s.init);
  const attachedCount = useProjectStore((s) => s.attachedIds.size);

  // Initialize settings + project store (idempotent)
  React.useEffect(() => {
    initSettings();
    initProject();
  }, [initSettings, initProject]);

  React.useEffect(() => {
    if (loadedConversationsOnce.current) return;
    loadedConversationsOnce.current = true;
    (async () => {
      try {
        const res = await fetch("/api/conversations");
        const data = await res.json();
        const list: ConversationSummary[] = (data.conversations ?? []).map(
          (c: any) => ({
            id: c.id,
            title: c.title,
            personaId: c.personaId,
            pinned: !!c.pinned,
            folder: c.folder ?? null,
            updatedAt: c.updatedAt,
            messageCount: c._count?.messages ?? 0,
          })
        );
        setConversations(list);
      } catch (e) {
        console.error("Failed to load conversations", e);
      }
    })();
  }, [setConversations]);

  // Load messages when active conversation changes
  React.useEffect(() => {
    if (!activeConversationId) {
      resetMessages();
      return;
    }
    if (loadedIds.has(activeConversationId)) return;
    (async () => {
      try {
        const res = await fetch(`/api/conversations/${activeConversationId}`);
        if (!res.ok) return;
        const data = await res.json();
        const conv = data.conversation;
        if (!conv) return;
        const p = getPersona(conv.personaId);
        setPersona(p);
        const msgs: ChatMessage[] = (conv.messages ?? []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          reasoning: m.reasoning ?? undefined,
          reaction: (m.reaction as "up" | "down" | null) ?? null,
          bookmarked: !!m.bookmarked,
          createdAt: new Date(m.createdAt).getTime(),
        }));
        setMessages(msgs);
        markLoaded(activeConversationId);
      } catch (e) {
        console.error("Failed to load conversation", e);
      }
    })();
  }, [
    activeConversationId,
    loadedIds,
    markLoaded,
    resetMessages,
    setMessages,
    setPersona,
  ]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
        return;
      }
      if (mod && e.key === "/") {
        e.preventDefault();
        setMobileSidebarOpen(true);
        setSidebarOpen(true);
        setTimeout(() => {
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[placeholder*="جست‌وجو"]'
          );
          searchInput?.focus();
        }, 100);
        return;
      }
      if (mod && e.shiftKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        startNewChat();
        return;
      }
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          setKeyboardHelpOpen((v) => !v);
          return;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const startNewChat = React.useCallback(() => {
    if (isStreaming) {
      abortRef.current?.abort();
    }
    setActiveConversation(null);
    resetMessages();
    setMobileSidebarOpen(false);
  }, [isStreaming, setActiveConversation, resetMessages]);

  const sendMessage = React.useCallback(
    async (text: string, opts?: { editMessageId?: string; images?: string[] }) => {
      if (isStreaming) return;

      const editingId = opts?.editMessageId;
      const images = opts?.images;
      const isVision = !!images && images.length > 0;

      if (text.startsWith("/image") && !editingId && !isVision) {
        const imagePrompt = text.slice(6).trim();
        if (imagePrompt) {
          await handleImageGeneration(imagePrompt);
          return;
        }
        text = text.slice(6).trim() || text;
      }

      if (editingId) {
        truncateAfter(editingId);
      }

      const userMsg: ChatMessage = {
        id: editingId ?? genId(),
        role: "user",
        content: text,
        createdAt: Date.now(),
        images: isVision ? images : undefined,
      };
      addMessage(userMsg);

      const assistantId = genId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        pending: true,
      };
      addMessage(assistantMsg);
      setStreaming(true);
      setEditingId(null);

      const controller = new AbortController();
      abortRef.current = controller;

      // Gather context: provider config + attached project files + memory
      const provider = getProviderConfig();
      const projectFiles = useProjectStore.getState().getAttachedFiles();
      const memory = loadMemory();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: activeConversationId,
            message: text,
            personaId: persona.id,
            editMessageId: editingId,
            thinking: thinkingEnabled,
            images: isVision ? images : undefined,
            isVision,
            provider,
            projectFiles: projectFiles.length > 0 ? projectFiles : undefined,
            memory: memory.length > 0 ? memory : undefined,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(t.requestFailed);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let receivedConversationId: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload) continue;
            try {
              const evt = JSON.parse(payload);
              if (evt.type === "meta") {
                receivedConversationId = evt.conversationId;
                if (evt.personaId) {
                  setPersona(getPersona(evt.personaId));
                }
              } else if (evt.type === "delta") {
                appendToMessage(assistantId, evt.content);
              } else if (evt.type === "reasoning") {
                appendToReasoning(assistantId, evt.content);
              } else if (evt.type === "done") {
                updateMessage(assistantId, { pending: false });
                if (evt.conversationId) {
                  receivedConversationId = evt.conversationId;
                }
              } else if (evt.type === "error") {
                updateMessage(assistantId, {
                  pending: false,
                  error: true,
                  content: evt.error || t.somethingWrong,
                });
                toast.error(t.aiFailed, { description: evt.error });
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        if (receivedConversationId) {
          if (receivedConversationId !== activeConversationId) {
            setActiveConversation(receivedConversationId);
          }
          try {
            const res = await fetch("/api/conversations");
            const data = await res.json();
            const list: ConversationSummary[] = (data.conversations ?? []).map(
              (c: any) => ({
                id: c.id,
                title: c.title,
                personaId: c.personaId,
                pinned: !!c.pinned,
                updatedAt: c.updatedAt,
                messageCount: c._count?.messages ?? 0,
              })
            );
            setConversations(list);
            markLoaded(receivedConversationId);
          } catch {
            // ignore
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          updateMessage(assistantId, {
            pending: false,
            aborted: true,
          });
        } else {
          const message = err instanceof Error ? err.message : "خطای ناشناخته";
          updateMessage(assistantId, {
            pending: false,
            error: true,
            content: message,
          });
          toast.error("ارسال پیام ناموفق بود", { description: message });
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
        updateMessage(assistantId, { pending: false });
      }
    },
    [
      activeConversationId,
      persona.id,
      addMessage,
      appendToMessage,
      appendToReasoning,
      updateMessage,
      setStreaming,
      setActiveConversation,
      setConversations,
      markLoaded,
      setPersona,
      isStreaming,
      thinkingEnabled,
      truncateAfter,
      setEditingId,
    ]
  );

  // Image generation handler
  const handleImageGeneration = React.useCallback(
    async (prompt: string) => {
      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        content: `/image ${prompt}`,
        createdAt: Date.now(),
      };
      addMessage(userMsg);

      const assistantId = genId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        pending: true,
      };
      addMessage(assistantMsg);
      setStreaming(true);
      setImageGenerating(true);

      try {
        const res = await fetch("/api/image-gen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "تولید تصویر ناموفق بود");
        }

        const data = await res.json();
        if (data.image) {
          updateMessage(assistantId, {
            pending: false,
            content: `![تصویر تولیدشده](${prompt})\n\nتصویری بر اساس این درخواست تولید کردم: **${prompt}**\n\n![image](data:image/png;base64,${data.image})`,
          });
        } else {
          throw new Error("دادهٔ تصویر دریافت نشد");
        }

        if (activeConversationId) {
          try {
            const convRes = await fetch("/api/conversations");
            const convData = await convRes.json();
            const list: ConversationSummary[] = (convData.conversations ?? []).map(
              (c: any) => ({
                id: c.id,
                title: c.title,
                personaId: c.personaId,
                pinned: !!c.pinned,
                updatedAt: c.updatedAt,
                messageCount: c._count?.messages ?? 0,
              })
            );
            setConversations(list);
          } catch {
            // ignore
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "خطای ناشناخته";
        updateMessage(assistantId, {
          pending: false,
          error: true,
          content: message,
        });
        toast.error("تولید تصویر ناموفق بود", { description: message });
      } finally {
        setStreaming(false);
        setImageGenerating(false);
      }
    },
    [
      activeConversationId,
      addMessage,
      updateMessage,
      setStreaming,
      setConversations,
    ]
  );

  const handleStop = React.useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleRegenerate = React.useCallback(() => {
    if (isStreaming) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (lastAssistant) {
      removeMessage(lastAssistant.id);
    }
    sendMessage(lastUser.content);
  }, [isStreaming, messages, removeMessage, sendMessage]);

  const handleRegenerateWithPersona = React.useCallback(
    (personaId: string) => {
      if (isStreaming) return;
      const newPersona = getPersona(personaId);
      setPersona(newPersona);
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      if (!lastUser) return;
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === "assistant");
      if (lastAssistant) {
        removeMessage(lastAssistant.id);
      }
      setTimeout(() => {
        sendMessage(lastUser.content);
      }, 0);
    },
    [isStreaming, messages, removeMessage, sendMessage, setPersona]
  );

  const handleEdit = React.useCallback(
    (messageId: string, newContent: string) => {
      if (isStreaming) return;
      sendMessage(newContent, { editMessageId: messageId });
    },
    [isStreaming, sendMessage]
  );

  const handleContinue = React.useCallback(() => {
    if (isStreaming) return;
    const abortedIdx = messages.findIndex((m) => m.aborted);
    if (abortedIdx < 0) return;
    const abortedMsg = messages[abortedIdx];
    const userMsg = [...messages.slice(0, abortedIdx)]
      .reverse()
      .find((m) => m.role === "user");
    if (!userMsg) return;
    removeMessage(abortedMsg.id);
    sendMessage(userMsg.content, {
      editMessageId: userMsg.id,
      images: userMsg.images,
    });
  }, [isStreaming, messages, removeMessage, sendMessage]);

  const handleReact = React.useCallback(
    (messageId: string, reaction: "up" | "down") => {
      const msg = useChatStore
        .getState()
        .messages.find((m) => m.id === messageId);
      const next = msg?.reaction === reaction ? null : reaction;
      setMessageReaction(messageId, next);
      fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: next }),
      }).catch(() => {
        setMessageReaction(messageId, msg?.reaction ?? null);
        toast.error("ذخیره واکنش ناموفق بود");
      });
    },
    [setMessageReaction]
  );

  const toggleBookmark = useChatStore((s) => s.toggleBookmark);
  const handleBookmark = React.useCallback(
    (messageId: string) => {
      const msg = useChatStore.getState().messages.find((m) => m.id === messageId);
      const newBookmarked = !msg?.bookmarked;
      toggleBookmark(messageId);
      fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarked: newBookmarked }),
      }).catch(() => {
        toggleBookmark(messageId);
        toast.error("ذخیره نشان ناموفق بود");
      });
    },
    [toggleBookmark]
  );

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const handleExportMarkdown = React.useCallback(() => {
    if (messages.length === 0) {
      toast.error("چیزی برای خروجی نیست", { description: "ابتدا پیامی بفرستید." });
      return;
    }
    const title = activeConv?.title ?? "گفت‌وگو";
    const md = exportAsMarkdown(title, persona, messages);
    downloadFile(`${slugify(title)}.md`, md, "text/markdown");
    toast.success("خروجی Markdown گرفته شد");
  }, [messages, activeConv, persona]);

  const handleExportJson = React.useCallback(() => {
    if (messages.length === 0) {
      toast.error("چیزی برای خروجی نیست", { description: "ابتدا پیامی بفرستید." });
      return;
    }
    const title = activeConv?.title ?? "گفت‌وگو";
    const json = exportAsJson(title, persona, messages);
    downloadFile(`${slugify(title)}.json`, json, "application/json");
    toast.success("خروجی JSON گرفته شد");
  }, [messages, activeConv, persona]);

  const handleExportPDF = React.useCallback(async () => {
    if (messages.length === 0) {
      toast.error("چیزی برای خروجی نیست", { description: "ابتدا پیامی بفرستید." });
      return;
    }
    if (!activeConversationId) {
      toast.error("گفت‌وگویی برای خروجی نیست");
      return;
    }
    setPdfExporting(true);
    const toastId = toast.loading("در حال تولید PDF…");
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConversationId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `خروجی ناموفق (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const title = activeConv?.title ?? "گفت‌وگو";
      a.download = `${slugify(title)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success("خروجی PDF گرفته شد", { id: toastId });
    } catch (e) {
      console.error("PDF export error:", e);
      toast.error("خروجی PDF ناموفق بود", {
        id: toastId,
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setPdfExporting(false);
    }
  }, [messages, activeConv, activeConversationId]);

  const handleClearMessages = React.useCallback(async () => {
    if (!activeConversationId) return;
    if (isStreaming) abortRef.current?.abort();
    try {
      await fetch(`/api/conversations/${activeConversationId}`, {
        method: "DELETE",
      });
    } catch {
      // ignore
    }
    useChatStore.getState().removeConversation(activeConversationId);
    setActiveConversation(null);
    resetMessages();
    toast.success("گفت‌وگو پاک شد");
  }, [activeConversationId, isStreaming, setActiveConversation, resetMessages]);

  const handleClearAll = React.useCallback(async () => {
    if (isStreaming) abortRef.current?.abort();
    try {
      for (const c of conversations) {
        await fetch(`/api/conversations/${c.id}`, { method: "DELETE" });
      }
    } catch {
      // ignore
    }
    setConversations([]);
    setActiveConversation(null);
    resetMessages();
    setClearAllOpen(false);
    toast.success("همهٔ گفت‌وگوها پاک شدند");
  }, [conversations, isStreaming, setConversations, setActiveConversation, resetMessages]);

  const stats = React.useMemo(() => {
    const userMsgs = messages.filter((m) => m.role === "user");
    const assistantMsgs = messages.filter((m) => m.role === "assistant");
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    const userChars = userMsgs.reduce((sum, m) => sum + m.content.length, 0);
    const assistantChars = assistantMsgs.reduce((sum, m) => sum + m.content.length, 0);
    const upReactions = assistantMsgs.filter((m) => m.reaction === "up").length;
    const downReactions = assistantMsgs.filter((m) => m.reaction === "down").length;
    const totalWords = messages.reduce((sum, m) => sum + m.content.split(/\s+/).filter(Boolean).length, 0);
    const readingTimeMin = Math.max(1, Math.ceil(totalWords / 200));
    return {
      total: messages.length,
      userCount: userMsgs.length,
      assistantCount: assistantMsgs.length,
      totalChars,
      userChars,
      assistantChars,
      upReactions,
      downReactions,
      totalWords,
      readingTimeMin,
    };
  }, [messages]);

  const showWelcome = messages.length === 0;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden shrink-0 overflow-hidden border-l border-border lg:block"
      >
        <div className="h-full w-[280px]">
          <ChatSidebar onNewChat={startNewChat} />
        </div>
      </motion.aside>

      {/* Mobile sidebar */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onNewChat={startNewChat}
      />

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar with glassmorphism */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-background/80 px-2 backdrop-blur-lg sm:px-4">
          <div className="flex min-w-0 items-center gap-1.5">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-9 w-9 text-muted-foreground hover:text-foreground lg:flex"
                onClick={() => setSidebarOpen(true)}
                aria-label="باز کردن نوار کناری"
              >
                <PanelLeftOpen className="h-4 w-4 rtl:scale-x-[-1]" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground lg:hidden"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="باز کردن منو"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <button
              onClick={() => setPersonaPickerOpen(true)}
              className="flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all hover:bg-muted"
            >
              <span className="text-base leading-none">
                {ICONS_RECORD[persona.icon] ?? "✦"}
              </span>
              <span className="truncate max-w-[200px] sm:max-w-[300px]">
                {activeConv?.title ?? persona.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Project files button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setProjectPanelOpen(true)}
              aria-label={t.projectsTitle}
              title={t.projectsTitle}
            >
              <FolderCode className="h-4 w-4" />
              {attachedCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                  {toPersianDigits(attachedCount)}
                </span>
              )}
            </Button>
            {/* Command palette trigger button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setCommandPaletteOpen(true)}
              aria-label={t.commandPalette}
              title={`${t.commandPalette} (⌘K)`}
            >
              <Search className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={startNewChat}>
                  <Sparkles className="ms-2 h-4 w-4" /> {t.newChat}
                  <span className="mr-auto text-[10px] text-muted-foreground">⌘⇧N</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCommandPaletteOpen(true)}>
                  <Search className="ms-2 h-4 w-4" /> {t.commandPalette}
                  <span className="mr-auto text-[10px] text-muted-foreground">⌘K</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setKeyboardHelpOpen(true)}>
                  <Keyboard className="ms-2 h-4 w-4" /> {t.keyboardShortcuts}
                  <span className="mr-auto text-[10px] text-muted-foreground">؟</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPersonaPickerOpen(true)}>
                  <span className="ms-2 text-base leading-none">✦</span>
                  {t.switchAssistant}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProjectPanelOpen(true)}>
                  <FolderCode className="ms-2 h-4 w-4" /> {t.projectsTitle}
                  {attachedCount > 0 && (
                    <span className="mr-auto text-[10px] font-bold text-emerald-500">
                      {toPersianDigits(attachedCount)}
                    </span>
                  )}
                </DropdownMenuItem>
                {activeConversationId && messages.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatsOpen(true)}>
                      <BarChart3 className="ms-2 h-4 w-4" /> {t.stats}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportMarkdown}>
                      <FileText className="ms-2 h-4 w-4" /> {t.exportMarkdown}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportJson}>
                      <FileJson className="ms-2 h-4 w-4" /> {t.exportJson}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExportPDF}
                      disabled={pdfExporting}
                    >
                      {pdfExporting ? (
                        <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="ms-2 h-4 w-4" />
                      )}
                      {pdfExporting ? "در حال تولید PDF…" : t.exportPdf}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleClearMessages}
                      className="text-destructive focus:text-destructive"
                    >
                      <Eraser className="ms-2 h-4 w-4" /> {t.clearMessages}
                    </DropdownMenuItem>
                  </>
                )}
                {conversations.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setClearAllOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="ms-2 h-4 w-4" /> {t.clearAll}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setSettingsOpen(true)}
              aria-label={t.settings}
              title={t.settings}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Body */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          {showWelcome ? (
            <div className="custom-scrollbar welcome-glow dot-pattern flex-1 overflow-y-auto">
              <ChatWelcome onPick={(text) => sendMessage(text)} />
            </div>
          ) : (
            <ChatMessages
              onRegenerate={handleRegenerate}
              onEdit={handleEdit}
              onReact={handleReact}
              onContinue={handleContinue}
              onBookmark={handleBookmark}
              onRegenerateWithPersona={handleRegenerateWithPersona}
            />
          )}

          <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent pt-2">
            <ChatInput
              onSend={sendMessage}
              onStop={handleStop}
              onOpenProjects={() => setProjectPanelOpen(true)}
              attachedProjectCount={attachedCount}
              slashCommandOpts={{
                onClear: handleClearMessages,
                onNewChat: startNewChat,
                onExport: handleExportMarkdown,
                onShowStats: () => setStatsOpen(true),
                onShowKeyboardHelp: () => setKeyboardHelpOpen(true),
                onToggleThinking: () => setThinkingEnabled(!thinkingEnabled),
                onToggleBookmark: () => {},
                onToggleImageGen: () => {
                  const textarea = document.querySelector<HTMLTextAreaElement>(
                    'textarea[placeholder*="پیام"]'
                  );
                  if (textarea) {
                    const nativeSetter = Object.getOwnPropertyDescriptor(
                      HTMLTextAreaElement.prototype, "value"
                    )?.set;
                    const v = textarea.value.startsWith("/image") ? textarea.value : "/image " + textarea.value;
                    nativeSetter?.call(textarea, v);
                    textarea.dispatchEvent(new Event("input", { bubbles: true }));
                    textarea.focus();
                  }
                },
                onOpenSettings: () => setSettingsOpen(true),
                onSearchInConv: () => {
                  window.dispatchEvent(new KeyboardEvent("keydown", { key: "f", ctrlKey: true, bubbles: true }));
                },
              }}
            />
          </div>
        </div>
      </div>

      <PersonaPicker />

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Project Files Panel */}
      <ProjectPanel open={projectPanelOpen} onOpenChange={setProjectPanelOpen} />

      {/* Keyboard Help */}
      <KeyboardHelp
        open={keyboardHelpOpen}
        onOpenChange={setKeyboardHelpOpen}
      />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNewChat={startNewChat}
        onExportMarkdown={handleExportMarkdown}
        onExportJson={handleExportJson}
        onShowStats={() => setStatsOpen(true)}
        onClearAll={() => setClearAllOpen(true)}
        onTogglePin={() => {
          if (!activeConversationId) return;
          const conv = conversations.find((c) => c.id === activeConversationId);
          if (!conv) return;
          const newPinned = !conv.pinned;
          upsertConversation({ ...conv, pinned: newPinned });
          fetch(`/api/conversations/${activeConversationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pinned: newPinned }),
          });
          toast.success(newPinned ? "گفت‌وگو سنجاق شد" : "سنجاق برداشته شد");
        }}
      />

      {/* Prompt Templates Modal */}
      <PromptTemplatesModal
        currentValue={inputDraft}
        onInsert={(content) => {
          setInputDraft(content);
          const textarea = document.querySelector<HTMLTextAreaElement>(
            'textarea[placeholder*="پیام"]'
          );
          if (textarea) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              HTMLTextAreaElement.prototype,
              "value"
            )?.set;
            nativeInputValueSetter?.call(textarea, content);
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
            textarea.focus();
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
            }, 0);
          }
        }}
      />

      {/* Conversation Stats Dialog */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              {t.stats}
            </DialogTitle>
            <DialogDescription>
              آمار این گفت‌وگو
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">توزیع پیام‌ها</span>
                <span className="font-medium">{faNumber(stats.total)} کل</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                {stats.total > 0 && (
                  <>
                    <div
                      className="grow-bar bg-emerald-500 transition-all"
                      style={{ width: `${(stats.userCount / stats.total) * 100}%` }}
                    />
                    <div
                      className="grow-bar bg-violet-500 transition-all"
                      style={{ width: `${(stats.assistantCount / stats.total) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  شما ({faNumber(stats.userCount)})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  ایده ({faNumber(stats.assistantCount)})
                </span>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="grid grid-cols-3 gap-3">
              <StatsCard label="کل نویسه‌ها" value={faNumber(stats.totalChars.toLocaleString("en-US"))} />
              <StatsCard label="نویسه‌های شما" value={faNumber(stats.userChars.toLocaleString("en-US"))} />
              <StatsCard label="نویسه‌های هوش" value={faNumber(stats.assistantChars.toLocaleString("en-US"))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatsCard
                label="کل واژه‌ها"
                value={faNumber(stats.totalWords.toLocaleString("en-US"))}
              />
              <StatsCard
                label="زمان مطالعه"
                value={`~${faNumber(stats.readingTimeMin)} دقیقه`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatsCard
                label="میانگین طول پیام"
                value={stats.total > 0 ? faNumber(Math.round(stats.totalChars / stats.total).toLocaleString("en-US")) + " نویسه" : "۰"}
              />
              <StatsCard
                label="میانگین پاسخ هوش"
                value={stats.assistantCount > 0 ? faNumber(Math.round(stats.assistantChars / stats.assistantCount).toLocaleString("en-US")) + " نویسه" : "۰"}
              />
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">واکنش‌ها</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">👍</span>
                  {faNumber(stats.upReactions)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">👎</span>
                  {faNumber(stats.downReactions)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">نشان‌شده‌ها</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">★</span>
                {faNumber(messages.filter((m) => m.bookmarked).length)}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.confirmClearTitle}</DialogTitle>
            <DialogDescription>
              این عمل همهٔ {faNumber(conversations.length)} گفت‌وگو و پیام‌های آن را برای همیشه حذف می‌کند. این عمل قابل بازگشت نیست.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearAllOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
            >
              حذف همه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatsCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

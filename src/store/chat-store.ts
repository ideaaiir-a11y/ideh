"use client";

import { create } from "zustand";
import { PERSONAS, getPersona, type Persona } from "@/lib/personas";
import {
  BUILTIN_TEMPLATES,
  loadUserTemplates,
  saveUserTemplates,
  makeTemplateId,
  type PromptTemplate,
} from "@/lib/prompt-templates";

/**
 * Split text into chunks of approximately `maxLen` characters at sentence
 * boundaries. Used for chunked TTS playback (the TTS API limits each
 * request to 1024 chars). Tries to break at ".", "!", "?", "。", "！", "？"
 * or newlines; falls back to word boundaries if no sentence end is found.
 */
function splitForTts(text: string, maxLen = 900): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return [clean];
  const chunks: string[] = [];
  let remaining = clean;
  while (remaining.length > maxLen) {
    const slice = remaining.slice(0, maxLen);
    // Find the last sentence boundary within the slice
    let breakAt = -1;
    for (const sep of [". ", "! ", "? ", "。", "！", "？", "\n"]) {
      const idx = slice.lastIndexOf(sep);
      if (idx > breakAt && idx > 200) breakAt = idx + sep.length;
    }
    // Fallback: break at the last space
    if (breakAt < 0) {
      const sp = slice.lastIndexOf(" ");
      breakAt = sp > 200 ? sp : maxLen;
    }
    chunks.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks.filter((c) => c.length > 0);
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  reaction?: "up" | "down" | null;
  bookmarked?: boolean;
  createdAt: number;
  pending?: boolean;
  error?: boolean;
  aborted?: boolean;
  // Optional image attachments (data URLs) for vision messages
  images?: string[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  personaId: string;
  pinned: boolean;
  folder?: string | null;
  updatedAt: string;
  messageCount: number;
}

interface ChatState {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  persona: Persona;
  isStreaming: boolean;
  sidebarOpen: boolean;
  personaPickerOpen: boolean;
  templatesOpen: boolean;
  loadedConversationIds: Set<string>;
  // thinking
  thinkingEnabled: boolean;
  editingId: string | null;
  searchQuery: string;
  // folder filter (null = All)
  folderFilter: string | null;
  // TTS state
  playingId: string | null;
  ttsLoadingId: string | null;
  ttsSpeak: (id: string, text: string) => void;
  ttsStop: () => void;
  _ttsSetPlayingId: (id: string | null) => void;
  _ttsSetLoadingId: (id: string | null) => void;
  // prompt templates
  userTemplates: PromptTemplate[];
  templatesLoaded: boolean;
  // image attachments for next message
  pendingImages: string[];

  setConversations: (c: ConversationSummary[]) => void;
  upsertConversation: (c: ConversationSummary) => void;
  removeConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (m: ChatMessage[]) => void;
  addMessage: (m: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  appendToMessage: (id: string, delta: string) => void;
  appendToReasoning: (id: string, delta: string) => void;
  removeMessage: (id: string) => void;
  truncateAfter: (messageId: string) => void;
  setMessageReaction: (id: string, reaction: "up" | "down" | null) => void;
  toggleBookmark: (id: string) => void;
  setPersona: (p: Persona) => void;
  setStreaming: (s: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setPersonaPickerOpen: (open: boolean) => void;
  setTemplatesOpen: (open: boolean) => void;
  markConversationLoaded: (id: string) => void;
  resetMessages: () => void;
  setThinkingEnabled: (v: boolean) => void;
  setEditingId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setFolderFilter: (f: string | null) => void;
  // templates
  addUserTemplate: (t: Omit<PromptTemplate, "id" | "builtin">) => void;
  removeUserTemplate: (id: string) => void;
  ensureTemplatesLoaded: () => void;
  // attachments
  addPendingImage: (dataUrl: string) => void;
  removePendingImage: (index: number) => void;
  clearPendingImages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  persona: PERSONAS[0],
  isStreaming: false,
  sidebarOpen: true,
  personaPickerOpen: false,
  templatesOpen: false,
  loadedConversationIds: new Set(),
  thinkingEnabled: false,
  editingId: null,
  searchQuery: "",
  folderFilter: null,
  playingId: null,
  ttsLoadingId: null,
  userTemplates: [],
  templatesLoaded: false,
  pendingImages: [],

  ttsSpeak: async (id, text) => {
    const store = useChatStore.getState();
    if (store.playingId === id) {
      store.ttsStop();
      return;
    }
    store.ttsStop();
    const cleanText = text
      .replace(/```[\s\S]*?```/g, " code block. ")
      .replace(/[#*`>_~]/g, "")
      .trim();
    if (!cleanText) return;

    // Split into chunks of ~900 chars at sentence boundaries so we can
    // play long messages sequentially (the TTS API limits each request
    // to 1024 chars).
    const chunks = splitForTts(cleanText, 900);
    if (chunks.length === 0) return;

    // Track playback state on window so ttsStop can cancel the queue.
    const w = window as unknown as {
      __ttsAudio?: HTMLAudioElement;
      __ttsUrl?: string;
      __ttsCancelled?: boolean;
      __ttsChunkIdx?: number;
      __ttsTotalChunks?: number;
    };
    w.__ttsCancelled = false;
    w.__ttsChunkIdx = 0;
    w.__ttsTotalChunks = chunks.length;

    store._ttsSetLoadingId(id);

    const playChunk = async (chunk: string, idx: number): Promise<void> => {
      if (w.__ttsCancelled) return;
      w.__ttsChunkIdx = idx;
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "TTS request failed");
      }
      const blob = await res.blob();
      if (w.__ttsCancelled) return;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      w.__ttsAudio = audio;
      w.__ttsUrl = url;
      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          w.__ttsUrl = undefined;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          w.__ttsUrl = undefined;
          reject(new Error("Audio playback error"));
        };
        audio.play().catch(reject);
      });
    };

    try {
      // First chunk: clear loading state and set playingId
      useChatStore.setState({ playingId: id });
      for (let i = 0; i < chunks.length; i++) {
        if (w.__ttsCancelled) break;
        // Set loading only for subsequent chunks (first chunk was already loading)
        if (i > 0) {
          // Brief loading indicator between chunks
          useChatStore.setState({ ttsLoadingId: id, playingId: null });
        } else {
          // First chunk: keep loading until playback starts
        }
        await playChunk(chunks[i], i);
        if (i === 0) {
          // First chunk started playing — clear loading
          useChatStore.setState({ ttsLoadingId: null, playingId: id });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("TTS error:", message);
    } finally {
      useChatStore.getState().ttsStop();
    }
  },
  ttsStop: () => {
    const w = window as unknown as {
      __ttsAudio?: HTMLAudioElement;
      __ttsUrl?: string;
      __ttsCancelled?: boolean;
    };
    w.__ttsCancelled = true;
    if (w.__ttsAudio) {
      w.__ttsAudio.pause();
      w.__ttsAudio.src = "";
      w.__ttsAudio = undefined;
    }
    if (w.__ttsUrl) {
      URL.revokeObjectURL(w.__ttsUrl);
      w.__ttsUrl = undefined;
    }
    useChatStore.setState({ playingId: null, ttsLoadingId: null });
  },
  _ttsSetPlayingId: (id) => set({ playingId: id }),
  _ttsSetLoadingId: (id) => set({ ttsLoadingId: id }),

  setConversations: (c) => set({ conversations: c }),
  upsertConversation: (c) =>
    set((state) => {
      const idx = state.conversations.findIndex((x) => x.id === c.id);
      let conversations: ConversationSummary[];
      if (idx >= 0) {
        conversations = [...state.conversations];
        conversations[idx] = { ...conversations[idx], ...c };
      } else {
        conversations = [c, ...state.conversations];
      }
      conversations.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      return { conversations };
    }),
  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
      messages: state.activeConversationId === id ? [] : state.messages,
    })),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setMessages: (m) => set({ messages: m }),
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  updateMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, ...patch } : m
      ),
    })),
  appendToMessage: (id, delta) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + delta } : m
      ),
    })),
  appendToReasoning: (id, delta) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id
          ? { ...m, reasoning: (m.reasoning ?? "") + delta }
          : m
      ),
    })),
  removeMessage: (id) =>
    set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
  truncateAfter: (messageId) =>
    set((s) => {
      const idx = s.messages.findIndex((m) => m.id === messageId);
      if (idx < 0) return {};
      return { messages: s.messages.slice(0, idx) };
    }),
  setMessageReaction: (id, reaction) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, reaction } : m
      ),
    })),
  toggleBookmark: (id) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, bookmarked: !m.bookmarked } : m
      ),
    })),
  setPersona: (p) => set({ persona: p }),
  setStreaming: (s) => set({ isStreaming: s }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setPersonaPickerOpen: (open) => set({ personaPickerOpen: open }),
  setTemplatesOpen: (open) => set({ templatesOpen: open }),
  markConversationLoaded: (id) =>
    set((s) => {
      const next = new Set(s.loadedConversationIds);
      next.add(id);
      return { loadedConversationIds: next };
    }),
  resetMessages: () => set({ messages: [] }),
  setThinkingEnabled: (v) => set({ thinkingEnabled: v }),
  setEditingId: (id) => set({ editingId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFolderFilter: (f) => set({ folderFilter: f }),

  ensureTemplatesLoaded: () => {
    if (get().templatesLoaded) return;
    const userT = loadUserTemplates();
    set({ userTemplates: userT, templatesLoaded: true });
  },
  addUserTemplate: (t) => {
    const newT: PromptTemplate = { ...t, id: makeTemplateId(), builtin: false };
    const next = [...get().userTemplates, newT];
    saveUserTemplates(next);
    set({ userTemplates: next });
  },
  removeUserTemplate: (id) => {
    const next = get().userTemplates.filter((t) => t.id !== id);
    saveUserTemplates(next);
    set({ userTemplates: next });
  },

  addPendingImage: (dataUrl) =>
    set((s) => {
      // Limit to 4 images
      if (s.pendingImages.length >= 4) return {};
      return { pendingImages: [...s.pendingImages, dataUrl] };
    }),
  removePendingImage: (index) =>
    set((s) => ({
      pendingImages: s.pendingImages.filter((_, i) => i !== index),
    })),
  clearPendingImages: () => set({ pendingImages: [] }),
}));

export { PERSONAS, getPersona, BUILTIN_TEMPLATES };

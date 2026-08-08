"use client";

import { create } from "zustand";

/**
 * Conversation Tags Store
 * ------------------------------------------------------------------
 * Stores user-defined tags/labels per conversation in localStorage
 * (key: `zai-chat:conv-tags`). Tags are NOT persisted in the database
 * — this is a client-only organizational layer.
 *
 * Shape on disk: `{ [conversationId: string]: string[] }`
 */

const STORAGE_KEY = "zai-chat:conv-tags";
const MAX_TAGS_PER_CONV = 8;
const MAX_TAG_LENGTH = 20;

interface TagsState {
  /** conversationId → array of tag strings */
  tagsByConv: Record<string, string[]>;
  /** currently active tag filter (null = no filter / "All") */
  activeTagFilter: string | null;
  /** whether the store has been hydrated from localStorage */
  hydrated: boolean;

  /** Load tagsByConv from localStorage (call once on client mount). */
  loadAllTags: () => void;
  /** Overwrite the entire tag list for a conversation. */
  setConvTags: (convId: string, tags: string[]) => void;
  /** Add a single tag to a conversation (with validation). Returns success. */
  addTagToConv: (convId: string, tag: string) => boolean;
  /** Remove a single tag from a conversation. */
  removeTagFromConv: (convId: string, tag: string) => void;
  /** Set the active tag filter (null clears it). */
  setActiveTagFilter: (tag: string | null) => void;
  /** Selector helper — get tags for a specific conversation. */
  getConvTags: (convId: string) => string[];
}

/** Normalize a raw tag string (trim, collapse whitespace, lowercase). */
function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
}

/** Persist current tagsByConv snapshot to localStorage. */
function persist(tagsByConv: Record<string, string[]>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tagsByConv));
  } catch {
    // ignore quota / disabled-storage errors
  }
}

/** Read tagsByConv from localStorage safely. Returns {} on server or error. */
function readFromStorage(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    const cleaned: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v)) {
        cleaned[k] = v.filter((t) => typeof t === "string").map(String);
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

/** Compute a sorted, de-duplicated list of every tag in use. */
export function selectAvailableTags(
  tagsByConv: Record<string, string[]>
): string[] {
  const set = new Set<string>();
  for (const tags of Object.values(tagsByConv)) {
    for (const t of tags) set.add(t);
  }
  return Array.from(set).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tagsByConv: {},
  activeTagFilter: null,
  hydrated: false,

  loadAllTags: () => {
    if (get().hydrated) return;
    const tagsByConv = readFromStorage();
    set({ tagsByConv, hydrated: true });
  },

  setConvTags: (convId, tags) => {
    const cleaned = Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));
    const next = { ...get().tagsByConv, [convId]: cleaned };
    persist(next);
    set({ tagsByConv: next });
  },

  addTagToConv: (convId, tag) => {
    const normalized = normalizeTag(tag);
    if (!normalized) return false;
    const current = get().tagsByConv[convId] ?? [];
    // Duplicate check (case-insensitive)
    const exists = current.some(
      (t) => t.toLowerCase() === normalized.toLowerCase()
    );
    if (exists) return false;
    // Max tags limit
    if (current.length >= MAX_TAGS_PER_CONV) return false;
    const next = { ...get().tagsByConv, [convId]: [...current, normalized] };
    persist(next);
    set({ tagsByConv: next });
    return true;
  },

  removeTagFromConv: (convId, tag) => {
    const current = get().tagsByConv[convId] ?? [];
    const next = {
      ...get().tagsByConv,
      [convId]: current.filter(
        (t) => t.toLowerCase() !== tag.toLowerCase()
      ),
    };
    persist(next);
    set({ tagsByConv: next });
  },

  setActiveTagFilter: (tag) => set({ activeTagFilter: tag }),

  getConvTags: (convId) => get().tagsByConv[convId] ?? [],
}));

export { MAX_TAGS_PER_CONV, MAX_TAG_LENGTH };

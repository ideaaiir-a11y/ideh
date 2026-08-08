import { create } from "zustand";
import { PERSONAS } from "./personas";

export type FontSize = "compact" | "comfortable" | "spacious";
export type MessageDensity = "cozy" | "normal" | "relaxed";
export type CodeTheme = "auto" | "light" | "dark";

export interface AppSettings {
  defaultPersonaId: string;
  defaultFolder: string;
  fontSize: FontSize;
  messageDensity: MessageDensity;
  codeTheme: CodeTheme;
  sendOnEnter: boolean;
  autoScroll: boolean;
  streamingCursor: boolean;
  showTokenCount: boolean;
  confirmDelete: boolean;
  // Custom AI provider (OpenAI-compatible)
  useCustomProvider: boolean;
  apiBaseUrl: string;
  apiKey: string;
  apiModel: string;
}

const STORAGE_KEY = "hosh-no:settings";

export const DEFAULT_SETTINGS: AppSettings = {
  defaultPersonaId: PERSONAS[0].id,
  defaultFolder: "",
  fontSize: "comfortable",
  messageDensity: "normal",
  codeTheme: "auto",
  sendOnEnter: true,
  autoScroll: true,
  streamingCursor: true,
  showTokenCount: true,
  confirmDelete: true,
  useCustomProvider: false,
  apiBaseUrl: "",
  apiKey: "",
  apiModel: "",
};

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

interface SettingsState {
  settings: AppSettings;
  initialized: boolean;
  init: () => void;
  update: (patch: Partial<AppSettings>) => void;
  reset: () => void;
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  initialized: false,
  init: () => {
    if (get().initialized) return;
    set({ settings: loadSettings(), initialized: true });
  },
  update: (patch) => {
    const next = { ...get().settings, ...patch };
    saveSettings(next);
    set({ settings: next });
  },
  reset: () => {
    saveSettings(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));

/**
 * Read the current provider config synchronously (for use in fetch
 * headers without subscribing to the store). Returns a safe snapshot.
 */
export function getProviderConfig(): {
  useCustomProvider: boolean;
  apiBaseUrl: string;
  apiKey: string;
  apiModel: string;
} {
  const s = useSettings.getState().settings;
  return {
    useCustomProvider: s.useCustomProvider,
    apiBaseUrl: s.apiBaseUrl,
    apiKey: s.apiKey,
    apiModel: s.apiModel,
  };
}

/**
 * Project Files / IDE Context — store & helpers
 * ------------------------------------------------------------------
 * A localStorage-backed store for project files plus a Zustand store
 * for UI state (attach set, panel open, search query, loaded flag).
 *
 * Files themselves are persisted under `hosh-no:project-files`.
 * The set of "attached" file ids (those included in the AI context)
 * is persisted under `hosh-no:project-attached` so attachments
 * survive reloads.
 *
 * The module is SSR-safe — every localStorage call guards
 * `typeof window === "undefined"`. It is imported by both client
 * components (the project panel) and server code (via
 * `project-context.ts`, which only uses the *type* export).
 */

import { create } from "zustand";

// ---------- Types ----------

export interface ProjectFile {
  id: string;
  path: string;
  name: string;
  content: string;
  size: number;
  language: string;
  addedAt: number;
}

export interface FileTreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileTreeNode[];
  file?: ProjectFile;
}

// ---------- Constants ----------

const STORAGE_KEY = "hosh-no:project-files";
const ATTACHED_KEY = "hosh-no:project-attached";

/** Maximum characters stored per file (200 KB). */
export const MAX_FILE_SIZE = 200 * 1024;
/** Maximum number of files kept in the store. */
export const MAX_FILES = 200;

/** Extensions recognised as plain-text source/config files. */
const TEXT_EXTENSIONS = new Set<string>([
  "ts", "tsx", "js", "jsx", "json", "md", "css", "html",
  "py", "go", "rs", "java", "c", "cpp", "h", "sh",
  "yml", "yaml", "toml", "sql", "vue", "svelte",
  "php", "rb", "kt", "swift", "txt", "env", "gitignore", "prisma",
]);

/** Map of extension → human-readable language label. */
const EXT_LANGUAGE: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript React",
  js: "JavaScript",
  jsx: "JavaScript React",
  json: "JSON",
  md: "Markdown",
  css: "CSS",
  html: "HTML",
  py: "Python",
  go: "Go",
  rs: "Rust",
  java: "Java",
  c: "C",
  cpp: "C++",
  h: "C Header",
  sh: "Shell",
  yml: "YAML",
  yaml: "YAML",
  toml: "TOML",
  sql: "SQL",
  vue: "Vue",
  svelte: "Svelte",
  php: "PHP",
  rb: "Ruby",
  kt: "Kotlin",
  swift: "Swift",
  txt: "Text",
  env: "Env",
  gitignore: "Git Ignore",
  prisma: "Prisma",
};

// ---------- Helpers ----------

/** Return the lowercased extension (no dot) of a file name. */
function getExt(name: string): string {
  // Dotfiles like ".gitignore" or ".env": treat the part after the
  // leading dot as the extension.
  if (name.startsWith(".")) {
    return name.slice(1).toLowerCase();
  }
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  return name.slice(dot + 1).toLowerCase();
}

/**
 * Determine whether a file name is recognised as plain text.
 * Used to skip binary uploads (images, archives, etc.).
 */
export function isTextFile(name: string): boolean {
  const ext = getExt(name);
  if (!ext) return false;
  return TEXT_EXTENSIONS.has(ext);
}

/** Detect a human-readable language label from a file path. */
export function detectLanguage(path: string): string {
  const name = path.split("/").pop() ?? path;
  const ext = getExt(name);
  return EXT_LANGUAGE[ext] ?? "Text";
}

/** Generate a short unique id for a project file. */
function genId(): string {
  return `pf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * For folder uploads the browser exposes the original relative path
 * via `webkitRelativePath` on each File. We use it to preserve the
 * directory structure inside the panel's tree view.
 */
function getRelativePath(file: File): string {
  const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return rel && rel.length > 0 ? rel : file.name;
}

// ---------- Storage: files ----------

/** Load all project files from localStorage (SSR-safe). */
export function loadProjectFiles(): ProjectFile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned: ProjectFile[] = [];
    for (const f of parsed) {
      if (!f || typeof f !== "object") continue;
      if (typeof f.id !== "string" || typeof f.path !== "string") continue;
      if (typeof f.content !== "string") continue;
      cleaned.push({
        id: f.id,
        path: f.path,
        name: typeof f.name === "string" ? f.name : (f.path.split("/").pop() ?? f.path),
        content: f.content,
        size: typeof f.size === "number" ? f.size : f.content.length,
        language: typeof f.language === "string" ? f.language : detectLanguage(f.path),
        addedAt: typeof f.addedAt === "number" ? f.addedAt : Date.now(),
      });
    }
    return cleaned;
  } catch {
    return [];
  }
}

/** Persist the full file list to localStorage (SSR-safe). */
export function saveProjectFiles(files: ProjectFile[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch {
    // ignore quota / disabled-storage errors
  }
}

// ---------- Storage: attached ids ----------

function loadAttachedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(ATTACHED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function saveAttachedIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ATTACHED_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}

// ---------- Public CRUD ----------

/**
 * Add files to the project store. Reads text content via `file.text()`
 * in parallel, skips binary files, caps each file at MAX_FILE_SIZE
 * characters and the total list at MAX_FILES entries.
 *
 * If a file with the same path already exists, it is replaced.
 *
 * Returns the list of newly added (or replaced) ProjectFile entries.
 */
export async function addProjectFiles(
  newFiles: FileList | File[]
): Promise<ProjectFile[]> {
  const list = Array.from(newFiles);
  const existing = loadProjectFiles();

  // Filter to text-only candidates first (no async needed).
  const candidates = list.filter((file) => {
    const path = getRelativePath(file);
    return file.type.startsWith("text/") || isTextFile(path);
  });

  // Read every candidate in parallel for speed.
  const readResults = await Promise.all(
    candidates.map(async (file): Promise<ProjectFile | null> => {
      const path = getRelativePath(file);
      try {
        let content = await file.text();
        if (content.length > MAX_FILE_SIZE) {
          content =
            content.slice(0, MAX_FILE_SIZE) +
            "\n\n/* [ایده] این فایل به‌دلیل محدودیت حجم برش خورد. */\n";
        }
        return {
          id: genId(),
          path,
          name: path.split("/").pop() ?? file.name,
          content,
          size: content.length,
          language: detectLanguage(path),
          addedAt: Date.now(),
        };
      } catch {
        return null;
      }
    })
  );

  const added = readResults.filter((f): f is ProjectFile => f !== null);
  if (added.length === 0) return [];

  // Replace any existing entries with the same path.
  const replacedPaths = new Set(added.map((a) => a.path));
  const kept = existing.filter((f) => !replacedPaths.has(f.path));
  const merged = [...kept, ...added];

  // Cap total at MAX_FILES (drop the oldest entries if over).
  const trimmed =
    merged.length > MAX_FILES
      ? merged.slice(merged.length - MAX_FILES)
      : merged;

  saveProjectFiles(trimmed);
  return added;
}

/** Remove a single project file by id (also removes from attached set). */
export function removeProjectFile(id: string): void {
  const files = loadProjectFiles();
  const next = files.filter((f) => f.id !== id);
  saveProjectFiles(next);
  const attached = loadAttachedIds();
  if (attached.has(id)) {
    attached.delete(id);
    saveAttachedIds(attached);
  }
}

/** Remove every project file (and reset the attached set). */
export function clearProjectFiles(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(ATTACHED_KEY);
  } catch {
    // ignore
  }
}

// ---------- Tree builder ----------

/**
 * Build a nested directory tree from a flat list of project files.
 * Directories are sorted first (alphabetically), then files. The
 * returned tree is ready for recursive rendering.
 */
export function buildFileTree(files: ProjectFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  // Stable ordering by path before tree construction.
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sorted) {
    const parts = file.path.split("/").filter(Boolean);
    let level = root;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      acc = acc ? `${acc}/${part}` : part;
      const isLast = i === parts.length - 1;
      if (isLast) {
        level.push({
          name: part,
          path: acc,
          isDir: false,
          file,
        });
      } else {
        let dir = level.find((n) => n.isDir && n.name === part);
        if (!dir) {
          dir = {
            name: part,
            path: acc,
            isDir: true,
            children: [],
          };
          level.push(dir);
        }
        if (dir.children) level = dir.children;
      }
    }
  }

  // Sort: directories first, then files; both alphabetical.
  function sortNodes(nodes: FileTreeNode[]) {
    nodes.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
    for (const n of nodes) if (n.children) sortNodes(n.children);
  }
  sortNodes(root);
  return root;
}

// ---------- Zustand UI store ----------

interface ProjectState {
  files: ProjectFile[];
  loaded: boolean;
  attachedIds: Set<string>;
  panelOpen: boolean;
  searchQuery: string;

  /** Hydrate files + attached set from localStorage (call once on mount). */
  init: () => void;
  /** Add a FileList / File[] to the store (reads text in parallel). */
  addFiles: (fileList: FileList | File[]) => Promise<void>;
  /** Remove a single file by id. */
  removeFile: (id: string) => void;
  /** Remove every file. */
  clearAll: () => void;
  /** Toggle the "attach as context" flag for one file. */
  toggleAttach: (id: string) => void;
  /** Attach every file currently in the store. */
  attachAll: () => void;
  /** Detach every file. */
  detachAll: () => void;
  /** Sync the panel open state (used by external openers). */
  setPanelOpen: (open: boolean) => void;
  /** Update the search query used to filter the tree. */
  setSearchQuery: (q: string) => void;
  /** Selector helper — returns the list of currently attached files. */
  getAttachedFiles: () => ProjectFile[];
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  files: [],
  loaded: false,
  attachedIds: new Set(),
  panelOpen: false,
  searchQuery: "",

  init: () => {
    if (get().loaded) return;
    set({
      files: loadProjectFiles(),
      attachedIds: loadAttachedIds(),
      loaded: true,
    });
  },

  addFiles: async (fileList) => {
    await addProjectFiles(fileList);
    set({ files: loadProjectFiles() });
  },

  removeFile: (id) => {
    removeProjectFile(id);
    const attached = new Set(get().attachedIds);
    if (attached.has(id)) attached.delete(id);
    saveAttachedIds(attached);
    set({ files: loadProjectFiles(), attachedIds: attached });
  },

  clearAll: () => {
    clearProjectFiles();
    set({ files: [], attachedIds: new Set() });
  },

  toggleAttach: (id) => {
    const attached = new Set(get().attachedIds);
    if (attached.has(id)) attached.delete(id);
    else attached.add(id);
    saveAttachedIds(attached);
    set({ attachedIds: attached });
  },

  attachAll: () => {
    const attached = new Set(get().files.map((f) => f.id));
    saveAttachedIds(attached);
    set({ attachedIds: attached });
  },

  detachAll: () => {
    saveAttachedIds(new Set());
    set({ attachedIds: new Set() });
  },

  setPanelOpen: (open) => set({ panelOpen: open }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  getAttachedFiles: () => {
    const { files, attachedIds } = get();
    return files.filter((f) => attachedIds.has(f.id));
  },
}));

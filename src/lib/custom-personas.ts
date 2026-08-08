import type { Persona } from "./personas";

const STORAGE_KEY = "zai-chat:custom-personas";

/**
 * Generate a unique ID with a "custom-" prefix so they're distinguishable
 * from builtins (whose IDs are short slugs like "default", "coder", etc.).
 */
export function makeCustomPersonaId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/**
 * Read all custom personas from localStorage.
 * Safe to call on the server (returns []).
 * Defensive against malformed/corrupted JSON.
 */
export function loadCustomPersonas(): Persona[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (p) =>
        p &&
        typeof p.id === "string" &&
        typeof p.name === "string" &&
        typeof p.systemPrompt === "string"
    );
  } catch {
    return [];
  }
}

/**
 * Persist all custom personas to localStorage.
 * Silently ignores quota / disabled-storage errors.
 */
export function saveCustomPersonas(personas: Persona[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
  } catch {
    // ignore quota errors
  }
}

/**
 * Append a new persona and return the updated list (also persisted).
 */
export function addCustomPersona(persona: Persona): Persona[] {
  const all = loadCustomPersonas();
  const next = [...all, persona];
  saveCustomPersonas(next);
  return next;
}

/**
 * Patch an existing persona by id and return the updated list (also persisted).
 */
export function updateCustomPersona(
  id: string,
  patch: Partial<Persona>
): Persona[] {
  const all = loadCustomPersonas();
  const next = all.map((p) => (p.id === id ? { ...p, ...patch } : p));
  saveCustomPersonas(next);
  return next;
}

/**
 * Delete a persona by id and return the updated list (also persisted).
 */
export function deleteCustomPersona(id: string): Persona[] {
  const all = loadCustomPersonas();
  const next = all.filter((p) => p.id !== id);
  saveCustomPersonas(next);
  return next;
}

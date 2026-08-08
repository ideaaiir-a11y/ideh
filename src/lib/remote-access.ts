import { randomBytes } from "crypto";

/**
 * Remote-access configuration for "ایده".
 *
 * On Cloudflare Workers: stores config in KV namespace (REMOTE_KV).
 * Locally: stores config in .hosh-no-remote.json file.
 */

const KV_KEY = "remote-access-config";

export interface RemoteAccessConfig {
  enabled: boolean;
  apiKey: string;
  createdAt: string;
  rotatedAt: string;
  defaultSystemPrompt?: string;
}

const DEFAULT_SYSTEM_PROMPT =
  "تو «ایده» هستی، یک دستیار هوشمند، دانش‌مند و دوستانه. همیشه و فقط به زبان فارسی پاسخ بده، حتی اگر کاربر به زبان دیگری سوال بپرسد — مگر اینکه کاربر صراحتاً و واضحاً بخواهد به زبان دیگری پاسخ دهی. پاسخ‌هایت باید کاملاً به فارسی باشند، از کلمات و عبارت‌های اصیل فارسی استفاده کن و از کلمات خارجی یا ترگل (Code-mixing) خودداری کن. ساختار جملات را طبیعی، روان و مطابق با زبان فارسی رسمی بنویس. از املای صحیح کلمات فارسی اطمینان حاصل کن. اعداد را به حروف فارسی بنویس (مثل: یک، دو، سه) مگر در موارد خاص مانند کد برنامه‌نویسی، فرمول‌های ریاضی یا شناسه‌ها که نیاز به اعداد هستند. در پاسخ‌هایت از Markdown برای قالب‌بندی استفاده کن: تیترها با #، فهرست‌ها با -، کدهای برنامه‌نویسی را در بلوک کد fenced با ذکر زبان قرار بده. لحن تو گرم، محترمانه و حرفه‌ای است. پاسخ‌ها باید دقیق، کاربردی و قابل فهم باشند.";

function generateApiKey(): string {
  return "hn_" + randomBytes(16).toString("hex");
}

async function getKV(): Promise<any | null> {
  try {
    const kv = (globalThis as any).REMOTE_KV;
    if (kv) return kv;
  } catch {
    // ignore
  }
  return null;
}

async function loadFromKV(): Promise<RemoteAccessConfig | null> {
  const kv = await getKV();
  if (!kv) return null;
  try {
    const raw = await kv.get(KV_KEY, "json");
    if (raw) return raw as RemoteAccessConfig;
  } catch {
    // ignore
  }
  return null;
}

async function saveToKV(cfg: RemoteAccessConfig): Promise<void> {
  const kv = await getKV();
  if (!kv) return;
  await kv.put(KV_KEY, JSON.stringify(cfg));
}

async function loadFromFile(): Promise<RemoteAccessConfig | null> {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const CONFIG_PATH = path.join(process.cwd(), ".hosh-no-remote.json");
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    return JSON.parse(raw) as RemoteAccessConfig;
  } catch {
    return null;
  }
}

async function saveToFile(cfg: RemoteAccessConfig): Promise<void> {
  const fs = await import("fs");
  const path = await import("path");
  const CONFIG_PATH = path.join(process.cwd(), ".hosh-no-remote.json");
  await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
}

async function ensureConfig(): Promise<RemoteAccessConfig> {
  // Try KV first (Cloudflare Workers)
  const kvConfig = await loadFromKV();
  if (kvConfig) {
    const cfg: RemoteAccessConfig = {
      enabled: kvConfig.enabled ?? true,
      apiKey:
        typeof kvConfig.apiKey === "string" && kvConfig.apiKey.length > 10
          ? kvConfig.apiKey
          : generateApiKey(),
      createdAt: kvConfig.createdAt ?? new Date().toISOString(),
      rotatedAt: kvConfig.rotatedAt ?? new Date().toISOString(),
      defaultSystemPrompt:
        kvConfig.defaultSystemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    };
    if (
      kvConfig.apiKey !== cfg.apiKey ||
      kvConfig.createdAt !== cfg.createdAt ||
      kvConfig.rotatedAt !== cfg.rotatedAt ||
      kvConfig.defaultSystemPrompt !== cfg.defaultSystemPrompt
    ) {
      await saveToKV(cfg);
    }
    return cfg;
  }

  // Fall back to file (local development)
  const fileConfig = await loadFromFile();
  if (fileConfig) {
    const cfg: RemoteAccessConfig = {
      enabled: fileConfig.enabled ?? true,
      apiKey:
        typeof fileConfig.apiKey === "string" && fileConfig.apiKey.length > 10
          ? fileConfig.apiKey
          : generateApiKey(),
      createdAt: fileConfig.createdAt ?? new Date().toISOString(),
      rotatedAt: fileConfig.rotatedAt ?? new Date().toISOString(),
      defaultSystemPrompt:
        fileConfig.defaultSystemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    };
    if (
      fileConfig.apiKey !== cfg.apiKey ||
      fileConfig.createdAt !== cfg.createdAt ||
      fileConfig.rotatedAt !== cfg.rotatedAt ||
      fileConfig.defaultSystemPrompt !== cfg.defaultSystemPrompt
    ) {
      await saveToFile(cfg);
    }
    return cfg;
  }

  // Create new config
  const now = new Date().toISOString();
  const cfg: RemoteAccessConfig = {
    enabled: true,
    apiKey: generateApiKey(),
    createdAt: now,
    rotatedAt: now,
    defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
  };
  await saveToKV(cfg);
  await saveToFile(cfg);
  return cfg;
}

export async function getRemoteAccessConfig(): Promise<RemoteAccessConfig> {
  return ensureConfig();
}

export async function validateRemoteApiKey(
  bearerToken: string | null | undefined
): Promise<{ ok: boolean; config: RemoteAccessConfig | null }> {
  const cfg = await getRemoteAccessConfig();
  if (!cfg.enabled) return { ok: false, config: cfg };
  if (!bearerToken) return { ok: false, config: cfg };
  const token = bearerToken.startsWith("Bearer ")
    ? bearerToken.slice(7).trim()
    : bearerToken.trim();
  if (!token || token.length < 5) return { ok: false, config: cfg };
  if (token.length !== cfg.apiKey.length) {
    return { ok: false, config: cfg };
  }
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ cfg.apiKey.charCodeAt(i);
  }
  return { ok: diff === 0, config: cfg };
}

export async function regenerateApiKey(): Promise<RemoteAccessConfig> {
  const cfg = await getRemoteAccessConfig();
  const updated: RemoteAccessConfig = {
    ...cfg,
    apiKey: generateApiKey(),
    rotatedAt: new Date().toISOString(),
  };
  await saveToKV(updated);
  await saveToFile(updated);
  return updated;
}

export async function setRemoteAccessEnabled(
  enabled: boolean
): Promise<RemoteAccessConfig> {
  const cfg = await getRemoteAccessConfig();
  const updated: RemoteAccessConfig = { ...cfg, enabled };
  await saveToKV(updated);
  await saveToFile(updated);
  return updated;
}

export async function setDefaultSystemPrompt(
  prompt: string
): Promise<RemoteAccessConfig> {
  const cfg = await getRemoteAccessConfig();
  const updated: RemoteAccessConfig = {
    ...cfg,
    defaultSystemPrompt: prompt || DEFAULT_SYSTEM_PROMPT,
  };
  await saveToKV(updated);
  await saveToFile(updated);
  return updated;
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 12) return "••••••••";
  return `${key.slice(0, 6)}••••••••••••${key.slice(-4)}`;
}

export const REMOTE_DEFAULT_SYSTEM_PROMPT = DEFAULT_SYSTEM_PROMPT;

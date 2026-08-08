"use client";

import * as React from "react";
import {
  Globe,
  KeyRound,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Code2,
  Terminal,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { t, faTime } from "@/lib/i18n";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RemoteConfig {
  enabled: boolean;
  apiKey: string; // masked on GET, full after POST
  apiKeyFull: string | null;
  createdAt: string;
  rotatedAt: string;
  defaultSystemPrompt: string;
  baseUrl: string;
  chatCompletionsPath: string;
  modelsPath: string;
}

export function RemoteAccessTab() {
  const [config, setConfig] = React.useState<RemoteConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showKey, setShowKey] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);
  const [toggling, setToggling] = React.useState(false);
  const [promptDraft, setPromptDraft] = React.useState("");
  const [savingPrompt, setSavingPrompt] = React.useState(false);
  const [origin, setOrigin] = React.useState("");
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const loadConfig = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/remote-access");
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as RemoteConfig;
      setConfig(data);
      setPromptDraft(data.defaultSystemPrompt ?? "");
    } catch {
      toast.error("بارگذاری پیکربندی ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fullBaseUrl = origin ? origin + (config?.baseUrl ?? "/api/v1") : "";

  const handleCopy = async (text: string, field: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(t.remoteCopied);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      toast.error("کپی ناموفق بود");
    }
  };

  const handleToggle = async (enabled: boolean) => {
    setToggling(true);
    try {
      const res = await fetch("/api/remote-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("toggle failed");
      const data = (await res.json()) as RemoteConfig;
      setConfig(data);
      toast.success(enabled ? t.remoteEnabledToast : t.remoteDisabledToast);
    } catch {
      toast.error("تغییر وضعیت ناموفق بود");
    } finally {
      setToggling(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm(t.remoteRegenerateConfirm)) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/remote-access", { method: "POST" });
      if (!res.ok) throw new Error("regenerate failed");
      const data = (await res.json()) as RemoteConfig;
      setConfig(data);
      setShowKey(true);
      toast.success(t.remoteKeyRegenerated);
    } catch {
      toast.error("ساخت کلید جدید ناموفق بود");
    } finally {
      setRegenerating(false);
    }
  };

  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    try {
      const res = await fetch("/api/remote-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultSystemPrompt: promptDraft }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = (await res.json()) as RemoteConfig;
      setConfig(data);
      toast.success(t.remotePromptSaved);
    } catch {
      toast.error("ذخیرهٔ پرامپت ناموفق بود");
    } finally {
      setSavingPrompt(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin ms-2" />
        <span className="text-sm">{t.remoteLoading}</span>
      </div>
    );
  }

  const displayKey =
    config.apiKeyFull && showKey ? config.apiKeyFull : config.apiKey;
  const statusOn = config.enabled;

  const curlExample = `curl ${fullBaseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${config.apiKeyFull && showKey ? config.apiKeyFull : "YOUR_API_KEY"}" \\
  -d '{
    "model": "hoosh-no",
    "messages": [
      {"role": "user", "content": "سلام، حالت چطوره؟"}
    ],
    "stream": false
  }'`;

  const pythonExample = `from openai import OpenAI

client = OpenAI(
    base_url="${fullBaseUrl}",
    api_key="${config.apiKeyFull && showKey ? config.apiKeyFull : "YOUR_API_KEY"}",
)

response = client.chat.completions.create(
    model="hoosh-no",
    messages=[
        {"role": "user", "content": "سلام، حالت چطوره؟"}
    ],
)

print(response.choices[0].message.content)`;

  const jsExample = `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${fullBaseUrl}",
  apiKey: "${config.apiKeyFull && showKey ? config.apiKeyFull : "YOUR_API_KEY"}",
});

const response = await client.chat.completions.create({
  model: "hoosh-no",
  messages: [
    { role: "user", content: "سلام، حالت چطوره؟" }
  ],
});

console.log(response.choices[0].message.content);`;

  return (
    <div className="max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar space-y-5">
      {/* Status banner */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border p-3 text-sm",
          statusOn
            ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
            : "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300"
        )}
      >
        {statusOn ? (
          <ShieldCheck className="h-5 w-5 shrink-0" />
        ) : (
          <ShieldAlert className="h-5 w-5 shrink-0" />
        )}
        <div className="flex-1">
          <p className="font-medium">
            {statusOn ? t.remoteStatusOn : t.remoteStatusOff}
          </p>
          {statusOn && (
            <p className="text-xs opacity-80 mt-0.5 font-mono" dir="ltr">
              {fullBaseUrl}
            </p>
          )}
        </div>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {t.remoteEnabled}
          </Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.remoteEnabledDesc}
          </p>
        </div>
        <Switch
          checked={config.enabled}
          disabled={toggling}
          onCheckedChange={handleToggle}
        />
      </div>

      <div className="h-px bg-border/60" />

      {/* Base URL */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          {t.remoteBaseUrl}
        </Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t.remoteBaseUrlDesc}
        </p>
        <div className="flex gap-2" dir="ltr">
          <Input
            readOnly
            value={fullBaseUrl}
            className="font-mono text-xs flex-1 bg-muted/40"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(fullBaseUrl, "baseUrl")}
            className="shrink-0"
          >
            {copiedField === "baseUrl" ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="text-[11px] text-muted-foreground space-y-0.5" dir="ltr">
          <div>
            <span className="opacity-60">{t.remoteChatPath}: </span>
            <code className="font-mono">{fullBaseUrl}/chat/completions</code>
          </div>
          <div>
            <span className="opacity-60">{t.remoteModelsPath}: </span>
            <code className="font-mono">{fullBaseUrl}/models</code>
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          {t.remoteApiKey}
        </Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t.remoteApiKeyDesc}
        </p>
        <div className="flex gap-2" dir="ltr">
          <Input
            readOnly
            type={showKey && config.apiKeyFull ? "text" : "text"}
            value={displayKey}
            className="font-mono text-xs flex-1 bg-muted/40"
            placeholder="hn_••••••••••••••••"
          />
          {config.apiKeyFull && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKey((s) => !s)}
              className="shrink-0"
              aria-label={showKey ? t.remoteHideKey : t.remoteShowKey}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleCopy(
                config.apiKeyFull && showKey
                  ? config.apiKeyFull
                  : config.apiKey,
                "apiKey"
              )
            }
            disabled={!config.apiKeyFull && !config.apiKey}
            className="shrink-0"
          >
            {copiedField === "apiKey" ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="text-[11px] text-muted-foreground">
            {t.remoteCreatedAt}: {faTime(config.createdAt)} ·{" "}
            {t.remoteRotatedAt}: {faTime(config.rotatedAt)}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="shrink-0 text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
          >
            {regenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ms-1.5">{t.remoteRegenerate}</span>
          </Button>
        </div>
        {!config.apiKeyFull && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5 pt-1">
            <Eye className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            برای دیدن کلید کامل، روی «{t.remoteRegenerate}» بزنید.
          </p>
        )}
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{t.remoteWarning}</p>
      </div>

      <div className="h-px bg-border/60" />

      {/* Default system prompt */}
      <div className="space-y-2">
        <Label className="text-sm font-medium" htmlFor="remote-default-prompt">
          {t.remoteDefaultPrompt}
        </Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t.remoteDefaultPromptDesc}
        </p>
        <Textarea
          id="remote-default-prompt"
          value={promptDraft}
          onChange={(e) => setPromptDraft(e.target.value)}
          rows={3}
          className="resize-y text-sm"
          dir="rtl"
        />
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSavePrompt}
            disabled={savingPrompt || promptDraft === config.defaultSystemPrompt}
          >
            {savingPrompt ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span className="ms-1.5">{t.saveProvider}</span>
          </Button>
        </div>
      </div>

      <div className="h-px bg-border/60" />

      {/* Examples */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          {t.remoteExamples}
        </Label>
        <Tabs defaultValue="curl">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="curl" className="flex-col gap-0.5 py-1.5">
              <Terminal className="h-3.5 w-3.5" />
              <span className="text-[10px]">{t.remoteExampleCurl}</span>
            </TabsTrigger>
            <TabsTrigger value="python" className="flex-col gap-0.5 py-1.5">
              <Code2 className="h-3.5 w-3.5" />
              <span className="text-[10px]">{t.remoteExamplePython}</span>
            </TabsTrigger>
            <TabsTrigger value="js" className="flex-col gap-0.5 py-1.5">
              <Code2 className="h-3.5 w-3.5" />
              <span className="text-[10px]">{t.remoteExampleJs}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="curl" className="mt-2">
            <div className="relative group">
              <pre
                className="overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-3 text-[11px] leading-relaxed font-mono text-muted-foreground max-h-64"
                dir="ltr"
              >
                {curlExample}
              </pre>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopy(curlExample, "curl")}
                className="absolute top-2 end-2 opacity-90"
              >
                {copiedField === "curl" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="python" className="mt-2">
            <div className="relative group">
              <pre
                className="overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-3 text-[11px] leading-relaxed font-mono text-muted-foreground max-h-64"
                dir="ltr"
              >
                {pythonExample}
              </pre>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopy(pythonExample, "python")}
                className="absolute top-2 end-2 opacity-90"
              >
                {copiedField === "python" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="js" className="mt-2">
            <div className="relative group">
              <pre
                className="overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-3 text-[11px] leading-relaxed font-mono text-muted-foreground max-h-64"
                dir="ltr"
              >
                {jsExample}
              </pre>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopy(jsExample, "js")}
                className="absolute top-2 end-2 opacity-90"
              >
                {copiedField === "js" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

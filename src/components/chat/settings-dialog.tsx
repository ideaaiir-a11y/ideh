"use client";

import * as React from "react";
import {
  Settings,
  Palette,
  SlidersHorizontal,
  RotateCcw,
  User,
  Folder,
  Check,
  Type,
  Server,
  FolderCode,
  Brain,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/lib/settings";
import { PERSONAS } from "@/lib/personas";
import { useProjectStore } from "@/lib/project-store";
import {
  loadMemory,
  saveMemory,
  makeMemoryId,
  type MemoryItem,
} from "@/lib/memory-store";
import { t, faNumber, toPersianDigits } from "@/lib/i18n";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PERSONA_ICONS: Record<string, string> = {
  Sparkles: "✦",
  Code2: "⌘",
  Feather: "✎",
  GraduationCap: "🎓",
  TrendingUp: "📈",
  ChefHat: "🍳",
};

const ACCENT_COLORS: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cyan: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  orange: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

function SettingRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1 space-y-0.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function RadioCard({
  value,
  currentValue,
  onValueChange,
  title,
  description,
}: {
  value: string;
  currentValue: string;
  onValueChange: (v: string) => void;
  title: string;
  description?: string;
}) {
  const selected = value === currentValue;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onValueChange(value)}
      className={[
        "flex flex-1 flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-right text-sm transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border hover:bg-muted/50",
      ].join(" ")}
    >
      <span className="flex w-full items-center justify-between">
        <span className="font-medium">{title}</span>
        {selected && (
          <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        )}
      </span>
      {description && (
        <span className="text-xs text-muted-foreground">{description}</span>
      )}
    </button>
  );
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const init = useSettings((s) => s.init);
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const reset = useSettings((s) => s.reset);

  const initProject = useProjectStore((s) => s.init);
  const projectFiles = useProjectStore((s) => s.files);

  React.useEffect(() => {
    init();
    initProject();
  }, [init, initProject]);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const sizeMap: Record<string, string> = {
      compact: "14px",
      comfortable: "16px",
      spacious: "18px",
    };
    document.documentElement.style.fontSize =
      sizeMap[settings.fontSize] ?? "16px";
  }, [settings.fontSize]);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute(
      "data-density",
      settings.messageDensity
    );
  }, [settings.messageDensity]);

  const [tab, setTab] = React.useState<
    | "general"
    | "appearance"
    | "behavior"
    | "provider"
    | "projects"
    | "memory"
  >("general");

  const handleReset = () => {
    reset();
    toast.success("تنظیمات بازنشانی شد");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            {t.settingsTitle}
          </DialogTitle>
          <DialogDescription>{t.settingsDesc}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) =>
        setTab(
          v as
            | "general"
            | "appearance"
            | "behavior"
            | "provider"
            | "projects"
            | "memory"
        )
          }
          className="px-6"
        >
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-6 h-auto">
            <TabsTrigger value="general" className="flex-col gap-0.5 py-1.5">
              <User className="h-3.5 w-3.5" />
              <span className="text-[10px]">{t.tabGeneral}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex-col gap-0.5 py-1.5">
              <Palette className="h-3.5 w-3.5" />
              <span className="text-[10px]">{t.tabAppearance}</span>
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex-col gap-0.5 py-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="text-[10px]">{t.tabBehavior}</span>
            </TabsTrigger>
            <TabsTrigger value="provider" className="flex-col gap-0.5 py-1.5">
              <Server className="h-3.5 w-3.5" />
              <span className="text-[10px]">{t.tabProvider}</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex-col gap-0.5 py-1.5">
              <FolderCode className="h-3.5 w-3.5" />
              <span className="text-[10px]">{t.tabProjects}</span>
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex-col gap-0.5 py-1.5">
              <Brain className="h-3.5 w-3.5" />
              <span className="text-[10px]">{t.tabMemory}</span>
            </TabsTrigger>
          </TabsList>

          {/* ---------- General ---------- */}
          <TabsContent value="general" className="mt-4">
            <div className="max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar divide-y divide-border/60">
              <SettingRow
                label={t.defaultPersona}
                description={t.defaultPersonaDesc}
                htmlFor="default-persona"
              >
                <Select
                  value={settings.defaultPersonaId}
                  onValueChange={(v) => update({ defaultPersonaId: v })}
                >
                  <SelectTrigger
                    id="default-persona"
                    className="w-[200px] justify-start"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSONAS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                              ACCENT_COLORS[p.accent] ?? ""
                            }`}
                          >
                            {PERSONA_ICONS[p.icon] ?? "✦"}
                          </span>
                          <span className="truncate">{p.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow
                label={t.defaultFolder}
                description={t.defaultFolderDesc}
                htmlFor="default-folder"
              >
                <div className="relative w-[200px]">
                  <Folder className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="default-folder"
                    value={settings.defaultFolder}
                    onChange={(e) =>
                      update({ defaultFolder: e.target.value })
                    }
                    placeholder={t.none}
                    className="h-9 ps-8"
                  />
                </div>
              </SettingRow>
            </div>
          </TabsContent>

          {/* ---------- Appearance ---------- */}
          <TabsContent value="appearance" className="mt-4">
            <div className="max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar divide-y divide-border/60">
              <div className="py-3">
                <div className="mb-2 flex items-center gap-2">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">{t.fontSize}</Label>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  {t.fontSizeDesc}
                </p>
                <div className="flex gap-2">
                  <RadioCard
                    value="compact"
                    currentValue={settings.fontSize}
                    onValueChange={(v) =>
                      update({ fontSize: v as "compact" })
                    }
                    title={t.compact}
                    description="متن کوچک‌تر و متراکم‌تر"
                  />
                  <RadioCard
                    value="comfortable"
                    currentValue={settings.fontSize}
                    onValueChange={(v) =>
                      update({ fontSize: v as "comfortable" })
                    }
                    title={t.comfortable}
                    description="اندازهٔ متعادل پیش‌فرض"
                  />
                  <RadioCard
                    value="spacious"
                    currentValue={settings.fontSize}
                    onValueChange={(v) =>
                      update({ fontSize: v as "spacious" })
                    }
                    title={t.spacious}
                    description="متن بزرگ‌تر برای خواندن"
                  />
                </div>
              </div>

              <div className="py-3">
                <Label className="text-sm font-medium">{t.messageDensity}</Label>
                <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
                  {t.messageDensityDesc}
                </p>
                <div className="flex gap-2">
                  <RadioCard
                    value="cozy"
                    currentValue={settings.messageDensity}
                    onValueChange={(v) =>
                      update({ messageDensity: v as "cozy" })
                    }
                    title={t.cozy}
                    description="کمترین فاصله"
                  />
                  <RadioCard
                    value="normal"
                    currentValue={settings.messageDensity}
                    onValueChange={(v) =>
                      update({ messageDensity: v as "normal" })
                    }
                    title={t.normal}
                    description="فاصلهٔ پیش‌فرض"
                  />
                  <RadioCard
                    value="relaxed"
                    currentValue={settings.messageDensity}
                    onValueChange={(v) =>
                      update({ messageDensity: v as "relaxed" })
                    }
                    title={t.relaxed}
                    description="فاصلهٔ وسیع‌تر"
                  />
                </div>
              </div>

              <div className="py-3">
                <Label className="text-sm font-medium">
                  {t.codeTheme}
                </Label>
                <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
                  {t.codeThemeDesc}
                </p>
                <RadioGroup
                  value={settings.codeTheme}
                  onValueChange={(v) =>
                    update({ codeTheme: v as "auto" | "light" | "dark" })
                  }
                  className="grid grid-cols-3 gap-2"
                >
                  {[
                    { value: "auto", label: t.auto },
                    { value: "light", label: t.light },
                    { value: "dark", label: t.dark },
                  ].map((opt) => (
                    <Label
                      key={opt.value}
                      htmlFor={`code-theme-${opt.value}`}
                      className={[
                        "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                        settings.codeTheme === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50",
                      ].join(" ")}
                    >
                      <RadioGroupItem
                        id={`code-theme-${opt.value}`}
                        value={opt.value}
                      />
                      {opt.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </TabsContent>

          {/* ---------- Behavior ---------- */}
          <TabsContent value="behavior" className="mt-4">
            <div className="max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar divide-y divide-border/60">
              <SettingRow
                label={t.sendOnEnter}
                description={t.sendOnEnterDesc}
              >
                <Switch
                  checked={settings.sendOnEnter}
                  onCheckedChange={(v) => update({ sendOnEnter: v })}
                  aria-label={t.sendOnEnter}
                />
              </SettingRow>
              <SettingRow
                label={t.autoScroll}
                description={t.autoScrollDesc}
              >
                <Switch
                  checked={settings.autoScroll}
                  onCheckedChange={(v) => update({ autoScroll: v })}
                  aria-label={t.autoScroll}
                />
              </SettingRow>
              <SettingRow
                label={t.streamingCursor}
                description={t.streamingCursorDesc}
              >
                <Switch
                  checked={settings.streamingCursor}
                  onCheckedChange={(v) => update({ streamingCursor: v })}
                  aria-label={t.streamingCursor}
                />
              </SettingRow>
              <SettingRow
                label={t.showTokenCount}
                description={t.showTokenCountDesc}
              >
                <Switch
                  checked={settings.showTokenCount}
                  onCheckedChange={(v) => update({ showTokenCount: v })}
                  aria-label={t.showTokenCount}
                />
              </SettingRow>
              <SettingRow
                label={t.confirmDelete}
                description={t.confirmDeleteDesc}
              >
                <Switch
                  checked={settings.confirmDelete}
                  onCheckedChange={(v) => update({ confirmDelete: v })}
                  aria-label={t.confirmDelete}
                />
              </SettingRow>
            </div>
          </TabsContent>

          {/* ---------- Provider (AI) ---------- */}
          <TabsContent value="provider" className="mt-4">
            <ProviderTab settings={settings} update={update} />
          </TabsContent>

          {/* ---------- Projects ---------- */}
          <TabsContent value="projects" className="mt-4">
            <ProjectsTab
              fileCount={projectFiles.length}
              onOpenPanel={() => {
                useProjectStore.getState().setPanelOpen(true);
                onOpenChange(false);
              }}
            />
          </TabsContent>

          {/* ---------- Memory ---------- */}
          <TabsContent value="memory" className="mt-4">
            <MemoryTab />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 flex-row items-center justify-between border-t border-border/60 px-6 py-4 sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <RotateCcw className="ms-2 h-4 w-4" />
            {t.resetDefaults}
          </Button>
          <Button onClick={() => onOpenChange(false)} className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20">
            <Check className="ms-1.5 h-4 w-4" />
            {t.done}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   Provider Tab — custom OpenAI-compatible endpoint config
   ============================================================ */
function ProviderTab({
  settings,
  update,
}: {
  settings: ReturnType<typeof useSettings.getState>["settings"];
  update: (patch: Partial<ReturnType<typeof useSettings.getState>["settings"]>) => void;
}) {
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [showKey, setShowKey] = React.useState(false);

  const handleTest = async () => {
    if (!settings.apiBaseUrl || !settings.apiKey) {
      setTestResult({ ok: false, message: "Base URL و API Key لازم است" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/provider-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useCustomProvider: true,
          apiBaseUrl: settings.apiBaseUrl,
          apiKey: settings.apiKey,
          apiModel: settings.apiModel,
        }),
      });
      const data = await res.json();
      setTestResult({ ok: !!data.ok, message: data.message ?? "" });
      if (data.ok) toast.success(t.testOk);
      else toast.error(t.testFail, { description: data.message });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطای ناشناخته";
      setTestResult({ ok: false, message: msg });
      toast.error(t.testFail, { description: msg });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar divide-y divide-border/60">
      <SettingRow
        label={t.useCustom}
        description={t.useCustomDesc}
      >
        <Switch
          checked={settings.useCustomProvider}
          onCheckedChange={(v) => update({ useCustomProvider: v })}
          aria-label={t.useCustom}
        />
      </SettingRow>

      <div className="py-3 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="api-base-url" className="text-sm font-medium flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-muted-foreground" />
            {t.baseUrl}
          </Label>
          <p className="text-xs text-muted-foreground">{t.baseUrlDesc}</p>
          <Input
            id="api-base-url"
            type="url"
            dir="ltr"
            data-ltr="true"
            value={settings.apiBaseUrl}
            onChange={(e) => update({ apiBaseUrl: e.target.value })}
            placeholder={t.baseUrlPlaceholder}
            className="text-left font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="api-key" className="text-sm font-medium flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            {t.apiKey}
          </Label>
          <p className="text-xs text-muted-foreground">{t.apiKeyDesc}</p>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? "text" : "password"}
              dir="ltr"
              data-ltr="true"
              value={settings.apiKey}
              onChange={(e) => update({ apiKey: e.target.value })}
              placeholder={t.apiKeyPlaceholder}
              className="text-left font-mono text-sm pe-9"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showKey ? "پنهان کردن" : "نمایش"}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="api-model" className="text-sm font-medium">
            {t.model}
          </Label>
          <p className="text-xs text-muted-foreground">{t.modelDesc}</p>
          <Input
            id="api-model"
            dir="ltr"
            data-ltr="true"
            value={settings.apiModel}
            onChange={(e) => update({ apiModel: e.target.value })}
            placeholder={t.modelPlaceholder}
            className="text-left font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testing || !settings.apiBaseUrl || !settings.apiKey}
          >
            {testing ? (
              <Loader2 className="ms-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Server className="ms-1.5 h-3.5 w-3.5" />
            )}
            {testing ? t.testing : t.testConnection}
          </Button>
          {testResult && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                testResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
              )}
            >
              {testResult.ok ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5" />
              )}
              {testResult.message}
            </span>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-amber-700 dark:text-amber-400">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{t.providerNote}</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Projects Tab — summary + open full panel
   ============================================================ */
function ProjectsTab({
  fileCount,
  onOpenPanel,
}: {
  fileCount: number;
  onOpenPanel: () => void;
}) {
  return (
    <div className="max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
      <div className="space-y-4 py-2">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FolderCode className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{t.projectsTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {t.fileCount(fileCount)}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={onOpenPanel}>
              <ExternalLink className="ms-1.5 h-3.5 w-3.5" />
              مدیریت فایل‌ها
            </Button>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t.projectHint}
        </p>
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <FolderCode className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            فایل‌های پروژه را از پنل مدیریت اضافه کنید، سپس آن‌ها را به‌عنوان زمینه به پیام‌هایتان پیوست کنید تا ایده بتواند کد شما را بخواند.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Memory Tab — long-term user facts
   ============================================================ */
function MemoryTab() {
  const [items, setItems] = React.useState<MemoryItem[]>([]);
  const [text, setText] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setItems(loadMemory());
    setLoaded(true);
  }, []);

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newItem: MemoryItem = {
      id: makeMemoryId(),
      text: trimmed,
      createdAt: Date.now(),
    };
    const next = [...items, newItem];
    setItems(next);
    saveMemory(next);
    setText("");
    toast.success("خاطره افزوده شد");
  };

  const handleDelete = (id: string) => {
    const next = items.filter((m) => m.id !== id);
    setItems(next);
    saveMemory(next);
    toast.success("خاطره حذف شد");
  };

  return (
    <div className="max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
      <div className="space-y-3 py-2">
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-4 w-4 text-violet-500" />
            <p className="text-sm font-medium">{t.memoryTitle}</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.memoryDesc}
          </p>
        </div>

        <div className="flex gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.memoryPlaceholder}
            rows={2}
            className="resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!text.trim()}
            className="self-end"
          >
            <Plus className="h-4 w-4" />
            {t.addMemory}
          </Button>
        </div>

        {loaded && items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <Brain className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">{t.noMemory}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((m) => (
              <div
                key={m.id}
                className="group flex items-start gap-2 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-500">
                  <Brain className="h-3.5 w-3.5" />
                </div>
                <p className="flex-1 text-sm leading-relaxed">{m.text}</p>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {t.memoryCount(items.length)}
          </p>
        )}
      </div>
    </div>
  );
}

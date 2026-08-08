"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Code2,
  Feather,
  GraduationCap,
  TrendingUp,
  ChefHat,
  Plus,
  Trash2,
  Check,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { type Persona } from "@/lib/personas";
import {
  addCustomPersona,
  updateCustomPersona,
  makeCustomPersonaId,
} from "@/lib/custom-personas";
import { toPersianDigits } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Static option maps (mirrors the ones in persona-picker.tsx)
// ---------------------------------------------------------------------------

const ICON_OPTIONS: {
  key: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "Sparkles", label: "جرقه", Icon: Sparkles },
  { key: "Code2", label: "کد", Icon: Code2 },
  { key: "Feather", label: "قلم", Icon: Feather },
  { key: "GraduationCap", label: "دانشمند", Icon: GraduationCap },
  { key: "TrendingUp", label: "روند", Icon: TrendingUp },
  { key: "ChefHat", label: "آشپز", Icon: ChefHat },
];

const ACCENT_OPTIONS: { key: string; label: string; swatch: string }[] = [
  { key: "emerald", label: "زمردی", swatch: "bg-emerald-500" },
  { key: "cyan", label: "فیروزه‌ای", swatch: "bg-cyan-500" },
  { key: "rose", label: "سرخابی", swatch: "bg-rose-500" },
  { key: "amber", label: "کهربایی", swatch: "bg-amber-500" },
  { key: "violet", label: "بنفش", swatch: "bg-violet-500" },
  { key: "orange", label: "نارنجی", swatch: "bg-orange-500" },
];

// Accent → tailwind classes (mirrors persona-picker.tsx)
const ACCENT_RING: Record<string, string> = {
  emerald: "ring-emerald-500",
  cyan: "ring-cyan-500",
  rose: "ring-rose-500",
  amber: "ring-amber-500",
  violet: "ring-violet-500",
  orange: "ring-orange-500",
};

const ICON_BG: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cyan: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  orange: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
};

const ACCENT_TEXT: Record<string, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  rose: "text-rose-600 dark:text-rose-400",
  amber: "text-amber-600 dark:text-amber-400",
  violet: "text-violet-600 dark:text-violet-400",
  orange: "text-orange-600 dark:text-orange-400",
};

const MAX_SUGGESTIONS = 4;

interface PersonaCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editPersona?: Persona | null;
  onSaved?: () => void;
}

export function PersonaCreator({
  open,
  onOpenChange,
  editPersona,
  onSaved,
}: PersonaCreatorProps) {
  const isEditing = !!editPersona;

  // ----- Form state --------------------------------------------------------
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [systemPrompt, setSystemPrompt] = React.useState("");
  const [accent, setAccent] = React.useState<string>("emerald");
  const [icon, setIcon] = React.useState<string>("Sparkles");
  const [greeting, setGreeting] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<string[]>(["", "", "", ""]);

  // ----- Reset / pre-fill when opened -------------------------------------
  React.useEffect(() => {
    if (!open) return;
    if (editPersona) {
      setName(editPersona.name);
      setDescription(editPersona.description);
      setSystemPrompt(editPersona.systemPrompt);
      setAccent(editPersona.accent ?? "emerald");
      setIcon(editPersona.icon ?? "Sparkles");
      setGreeting(editPersona.greeting ?? "");
      const s = editPersona.suggestions ?? [];
      setSuggestions([
        s[0] ?? "",
        s[1] ?? "",
        s[2] ?? "",
        s[3] ?? "",
      ]);
    } else {
      setName("");
      setDescription("");
      setSystemPrompt("");
      setAccent("emerald");
      setIcon("Sparkles");
      setGreeting("");
      setSuggestions(["", "", "", ""]);
    }
  }, [open, editPersona]);

  // ----- Derived -----------------------------------------------------------
  const trimmedName = name.trim();
  const trimmedDesc = description.trim();
  const trimmedPrompt = systemPrompt.trim();
  const isValid =
    trimmedName.length > 0 &&
    trimmedName.length <= 40 &&
    trimmedDesc.length > 0 &&
    trimmedDesc.length <= 100 &&
    trimmedPrompt.length > 0 &&
    trimmedPrompt.length <= 2000;

  const validSuggestions = suggestions
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, MAX_SUGGESTIONS);

  // Preview Icon component
  const PreviewIcon =
    ICON_OPTIONS.find((o) => o.key === icon)?.Icon ?? Sparkles;

  // ----- Save --------------------------------------------------------------
  const handleSave = () => {
    if (!isValid) return;

    const persona: Persona = {
      id: editPersona?.id ?? makeCustomPersonaId(),
      name: trimmedName,
      description: trimmedDesc,
      systemPrompt: trimmedPrompt,
      icon,
      accent,
      ...(greeting.trim() ? { greeting: greeting.trim() } : {}),
      ...(validSuggestions.length > 0 ? { suggestions: validSuggestions } : {}),
    };

    if (isEditing && editPersona) {
      updateCustomPersona(editPersona.id, persona);
      toast.success("شخصیت به‌روز شد", {
        description: `${persona.name} ذخیره شد.`,
      });
    } else {
      addCustomPersona(persona);
      toast.success("شخصیت ساخته شد", {
        description: `${persona.name} اکنون در انتخابگر موجود است.`,
      });
    }

    onSaved?.();
    onOpenChange(false);
  };

  // ----- Suggestion input helpers -----------------------------------------
  const setSuggestionAt = (idx: number, value: string) => {
    setSuggestions((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const addSuggestion = () => {
    setSuggestions((prev) => {
      if (prev.length >= MAX_SUGGESTIONS) return prev;
      return [...prev, ""];
    });
  };

  const removeSuggestion = (idx: number) => {
    setSuggestions((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Pencil className="h-4 w-4 text-muted-foreground" />
                ویرایش شخصیت
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-emerald-500" />
                ساخت شخصیت دلخواه
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "جزئیات دستیار دلخواه خود را به‌روز کنید."
              : "دستیار ایده خود را با شخصیت و تخصص منحصربه‌فرد طراحی کنید."}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          {/* Live preview card */}
          <div className="rounded-xl border border-border bg-muted/30 p-3.5">
            <div className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
              پیش‌نمایش
            </div>
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  ICON_BG[accent] ?? ICON_BG.emerald
                )}
              >
                <PreviewIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "truncate font-semibold",
                    ACCENT_TEXT[accent] ?? ACCENT_TEXT.emerald
                  )}
                >
                  {trimmedName || "شخصیت بدون نام"}
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {trimmedDesc || "توضیح کوتاهی از شخصیت شما اینجا نمایش داده می‌شود."}
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="persona-name">
              نام <span className="text-destructive">*</span>
            </Label>
            <Input
              id="persona-name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="مثلاً مربی ورزشی"
              maxLength={40}
            />
            <div className="flex justify-end text-[11px] text-muted-foreground/70">
              {toPersianDigits(name.length)}/۴۰
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="persona-description">
              توضیح <span className="text-destructive">*</span>
            </Label>
            <Input
              id="persona-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 100))}
              placeholder="خلاصهٔ یک‌خطی که در انتخابگر نمایش داده می‌شود."
              maxLength={100}
            />
            <div className="flex justify-end text-[11px] text-muted-foreground/70">
              {toPersianDigits(description.length)}/۱۰۰
            </div>
          </div>

          {/* System prompt */}
          <div className="space-y-1.5">
            <Label htmlFor="persona-system-prompt">
              پرامپت سیستمی <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="persona-system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value.slice(0, 2000))}
              placeholder="نقش، لحن، تخصص و رفتار شخصیت را تعریف کنید. مثلاً: «تو یک مربی ورزشی حامی هستی که توصیه‌های علمی و عملی برای تمرین و تغذیه می‌دهی…»"
              maxLength={2000}
              className="min-h-28 font-mono text-xs leading-relaxed"
            />
            <div className="flex justify-end text-[11px] text-muted-foreground/70">
              {toPersianDigits(systemPrompt.length)}/۲۰۰۰
            </div>
            <p className="text-[11px] text-muted-foreground/80">
              این به‌عنوان دستورالعمل آغازین برای هر گفت‌وگو به ایده ارسال می‌شود.
            </p>
          </div>

          {/* Accent color */}
          <div className="space-y-1.5">
            <Label>رنگ</Label>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_OPTIONS.map((opt) => {
                const selected = accent === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setAccent(opt.key)}
                    title={opt.label}
                    aria-label={opt.label}
                    aria-pressed={selected}
                    className={cn(
                      "relative flex h-8 w-8 items-center justify-center rounded-full transition-all",
                      opt.swatch,
                      selected
                        ? cn(
                            "ring-2 ring-offset-2 ring-offset-background",
                            ACCENT_RING[opt.key]
                          )
                        : "ring-1 ring-black/10 dark:ring-white/15 hover:scale-110"
                    )}
                  >
                    {selected && (
                      <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon picker */}
          <div className="space-y-1.5">
            <Label>نماد</Label>
            <div className="flex flex-wrap items-center gap-2">
              {ICON_OPTIONS.map((opt) => {
                const selected = icon === opt.key;
                const { Icon } = opt;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setIcon(opt.key)}
                    title={opt.label}
                    aria-label={opt.label}
                    aria-pressed={selected}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg border transition-all",
                      selected
                        ? cn(
                            ICON_BG[accent] ?? ICON_BG.emerald,
                            "border-transparent ring-2 ring-offset-1 ring-offset-background",
                            ACCENT_RING[accent] ?? ACCENT_RING.emerald
                          )
                        : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Greeting */}
          <div className="space-y-1.5">
            <Label htmlFor="persona-greeting">خوش‌آمد (اختیاری)</Label>
            <Input
              id="persona-greeting"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value.slice(0, 200))}
              placeholder="اولین پیامی که شخصیت در آغاز گفت‌وگو می‌فرستد."
              maxLength={200}
            />
            <div className="flex justify-end text-[11px] text-muted-foreground/70">
              {toPersianDigits(greeting.length)}/۲۰۰
            </div>
          </div>

          {/* Suggestions */}
          <div className="space-y-1.5">
            <Label>پیشنهادها (اختیاری، نهایتاً {toPersianDigits(MAX_SUGGESTIONS)})</Label>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {suggestions.map((s, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={s}
                      onChange={(e) => setSuggestionAt(idx, e.target.value.slice(0, 120))}
                      placeholder={`پیشنهاد ${toPersianDigits(idx + 1)} (مثلاً «یک برنامهٔ دویدن ۴هفته‌ای برنامه‌ریزی کن»)`}
                      maxLength={120}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeSuggestion(idx)}
                      aria-label="حذف پیشنهاد"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {suggestions.length < MAX_SUGGESTIONS && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={addSuggestion}
                >
                  <Plus className="h-3.5 w-3.5" />
                  افزودن پیشنهاد
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {isEditing ? (
              <>
                <Check className="h-4 w-4" />
                ذخیرهٔ تغییرات
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                ساخت شخصیت
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

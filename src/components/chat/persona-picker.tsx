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
  Check,
  X,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PERSONAS, type Persona } from "@/lib/personas";
import {
  loadCustomPersonas,
  deleteCustomPersona,
} from "@/lib/custom-personas";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";
import { PersonaCreator } from "./persona-creator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Code2,
  Feather,
  GraduationCap,
  TrendingUp,
  ChefHat,
};

const ACCENT_CLASSES: Record<string, string> = {
  emerald:
    "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 hover:bg-emerald-500/10",
  cyan: "border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/60 hover:bg-cyan-500/10",
  rose: "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60 hover:bg-rose-500/10",
  amber:
    "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10",
  violet:
    "border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60 hover:bg-violet-500/10",
  orange:
    "border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60 hover:bg-orange-500/10",
};

const ICON_BG: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cyan: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  orange: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
};

const ACCENT_RING: Record<string, string> = {
  emerald: "ring-emerald-500",
  cyan: "ring-cyan-500",
  rose: "ring-rose-500",
  amber: "ring-amber-500",
  violet: "ring-violet-500",
  orange: "ring-orange-500",
};

export function PersonaPicker() {
  const open = useChatStore((s) => s.personaPickerOpen);
  const setOpen = useChatStore((s) => s.setPersonaPickerOpen);
  const persona = useChatStore((s) => s.persona);
  const setPersona = useChatStore((s) => s.setPersona);

  // Custom personas state
  const [customPersonas, setCustomPersonas] = React.useState<Persona[]>([]);
  const [creatorOpen, setCreatorOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Persona | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Persona | null>(null);

  const reloadCustom = React.useCallback(() => {
    setCustomPersonas(loadCustomPersonas());
  }, []);

  // Load on mount and whenever the picker opens (in case localStorage changed
  // in another tab or via the creator dialog).
  React.useEffect(() => {
    reloadCustom();
  }, [open, reloadCustom]);

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [open, setOpen]);

  const openCreate = () => {
    setEditTarget(null);
    setCreatorOpen(true);
  };

  const openEdit = (p: Persona) => {
    setEditTarget(p);
    setCreatorOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    deleteCustomPersona(deleteTarget.id);
    reloadCustom();
    // If the currently-active persona is the one being deleted, fall back to
    // the default builtin so the chat doesn't reference a stale persona.
    if (persona.id === deleteTarget.id) {
      setPersona(PERSONAS[0]);
    }
    setDeleteTarget(null);
    toast.success("شخصیت حذف شد", {
      description: `${name} حذف شد.`,
    });
  };

  const handleSaved = () => {
    reloadCustom();
  };

  const handlePick = (p: Persona) => {
    setPersona(p);
    setOpen(false);
  };

  // Combine builtins + custom for rendering
  const allPersonas = React.useMemo(
    () => [...PERSONAS, ...customPersonas],
    [customPersonas]
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="بستن"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-5">
                <h2 className="text-lg font-semibold tracking-tight">
                  انتخاب دستیار
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  شخصیتی را برای گفت‌وگو انتخاب کنید.
                </p>
              </div>

              {/* Create new persona button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={openCreate}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                <Plus className="h-4 w-4" />
                ساخت شخصیت دلخواه
              </motion.button>

              <div className="grid max-h-[55vh] gap-3 overflow-y-auto pr-1 custom-scrollbar sm:grid-cols-2">
                {allPersonas.map((p) => {
                  const Icon = ICONS[p.icon] ?? Sparkles;
                  const active = p.id === persona.id;
                  const isCustom = p.id.startsWith("custom-");
                  return (
                    <motion.div
                      key={p.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "group relative flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all persona-glow",
                        ACCENT_CLASSES[p.accent] ?? ACCENT_CLASSES.emerald,
                        active && "ring-2 ring-offset-1 ring-offset-background",
                        active &&
                          (ACCENT_RING[p.accent] ?? ACCENT_RING.emerald)
                      )}
                    >
                      {/* Main click target: select the persona */}
                      <button
                        type="button"
                        onClick={() => handlePick(p)}
                        className="absolute inset-0 rounded-xl"
                        aria-label={`انتخاب ${p.name}`}
                      />

                      <div
                        className={cn(
                          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          ICON_BG[p.accent] ?? ICON_BG.emerald
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1 ps-12 pe-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{p.name}</span>
                          {active && (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                          {isCustom && (
                            <span className="ms-1 inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                              دلخواه
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {p.description}
                        </p>
                      </div>

                      {/* Edit / delete actions (custom personas only) */}
                      {isCustom && (
                        <div className="absolute left-2 top-2 z-10 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(p);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
                            aria-label={`ویرایش ${p.name}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(p);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`حذف ${p.name}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creator / editor dialog */}
      <PersonaCreator
        open={creatorOpen}
        onOpenChange={setCreatorOpen}
        editPersona={editTarget}
        onSaved={handleSaved}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف شخصیت؟</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `«${deleteTarget.name}» برای همیشه حذف می‌شود. این عمل قابل بازگشت نیست.`
                : "این شخصیت برای همیشه حذف می‌شود."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

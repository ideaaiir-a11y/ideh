"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  Folder,
  FileText,
  FilePlus,
  FolderPlus,
  Trash2,
  Search,
  Check,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { t, faNumber } from "@/lib/i18n";
import {
  useProjectStore,
  buildFileTree,
  type FileTreeNode,
} from "@/lib/project-store";

// ---------- Helpers ----------

/** Format a byte count as a short Persian string. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${faNumber(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${faNumber((bytes / 1024).toFixed(1))} ک‌ب`;
  return `${faNumber((bytes / (1024 * 1024)).toFixed(1))} م‌ب`;
}

// Non-standard `webkitdirectory` / `directory` attributes for the folder
// input. React 16+ passes unknown lowercase attributes through to the DOM,
// but TypeScript's InputHTMLAttributes does not include them — cast here
// to keep the type-checker happy without resorting to @ts-expect-error.
const FOLDER_INPUT_EXTRA_PROPS = {
  webkitdirectory: "",
  directory: "",
} as unknown as React.InputHTMLAttributes<HTMLInputElement>;

// ---------- Tree row components ----------

interface RowProps {
  node: FileTreeNode;
  depth: number;
}

/** Recursive tree row — handles both directories and file leaves. */
function FileTreeRow({ node, depth }: RowProps) {
  if (node.isDir) return <DirectoryRow node={node} depth={depth} />;
  return <FileLeafRow node={node} depth={depth} />;
}

function DirectoryRow({ node, depth }: RowProps) {
  const [open, setOpen] = React.useState(true);
  const pad = `${depth * 12 + 8}px`;
  const childCount = node.children?.length ?? 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60 transition-colors"
        style={{ paddingInlineStart: pad }}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        {open ? (
          <FolderOpen className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
        )}
        <span className="truncate font-medium">{node.name}</span>
        <span className="ms-auto text-[10px] text-muted-foreground tabular-nums">
          {faNumber(childCount)}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-0.5">
          {node.children?.map((child) => (
            <FileTreeRow key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FileLeafRow({ node, depth }: RowProps) {
  const file = node.file!;
  const attachedIds = useProjectStore((s) => s.attachedIds);
  const toggleAttach = useProjectStore((s) => s.toggleAttach);
  const removeFile = useProjectStore((s) => s.removeFile);

  const [expanded, setExpanded] = React.useState(false);
  const attached = attachedIds.has(file.id);
  const pad = `${depth * 12 + 8}px`;

  const preview = React.useMemo(
    () => file.content.split("\n").slice(0, 30).join("\n"),
    [file.content]
  );
  const lineCount = React.useMemo(
    () => file.content.split("\n").length,
    [file.content]
  );

  return (
    <div style={{ paddingInlineStart: pad, paddingInlineEnd: "8px" }}>
      <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 transition-colors">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex min-w-0 flex-1 items-center gap-2 text-start"
          aria-expanded={expanded}
          aria-label={`${expanded ? "بستن" : "باز کردن"} پیش‌نمایش ${node.name}`}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <FileText className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span className="truncate text-sm font-medium">{node.name}</span>
        </button>
        <Badge
          variant="secondary"
          className="h-5 shrink-0 px-1.5 text-[10px] leading-none"
        >
          {file.language}
        </Badge>
        <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
          {formatSize(file.size)}
        </span>
        <button
          type="button"
          onClick={() => removeFile(file.id)}
          className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`حذف ${node.name}`}
          title="حذف فایل"
        >
          <Trash2 className="h-3 w-3" />
        </button>
        <Switch
          checked={attached}
          onCheckedChange={() => toggleAttach(file.id)}
          aria-label={attached ? t.detachContext : t.attachContext}
          title={attached ? t.detachContext : t.attachContext}
          className="scale-90 shrink-0"
        />
      </div>

      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="my-1 mx-2 overflow-hidden rounded-md border border-border/60 bg-muted/40">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 px-2 py-1 text-[10px] text-muted-foreground">
                <span className="truncate font-mono" dir="ltr">
                  {node.path}
                </span>
                <span className="shrink-0 tabular-nums">
                  {faNumber(lineCount)} خط
                </span>
              </div>
              <pre
                dir="ltr"
                className="max-h-48 overflow-auto custom-scrollbar whitespace-pre-wrap break-words p-2 text-left font-mono text-[11px] leading-relaxed text-muted-foreground"
              >
                {preview}
              </pre>
            </div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ---------- Main panel ----------

interface ProjectPanelProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ProjectPanel({ open, onOpenChange }: ProjectPanelProps) {
  const init = useProjectStore((s) => s.init);
  const files = useProjectStore((s) => s.files);
  const loaded = useProjectStore((s) => s.loaded);
  const attachedIds = useProjectStore((s) => s.attachedIds);
  const searchQuery = useProjectStore((s) => s.searchQuery);
  const addFiles = useProjectStore((s) => s.addFiles);
  const clearAll = useProjectStore((s) => s.clearAll);
  const setPanelOpen = useProjectStore((s) => s.setPanelOpen);
  const setSearchQuery = useProjectStore((s) => s.setSearchQuery);
  const attachAll = useProjectStore((s) => s.attachAll);
  const detachAll = useProjectStore((s) => s.detachAll);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  // Hydrate the store from localStorage on first mount.
  React.useEffect(() => {
    init();
  }, [init]);

  // Keep the store's `panelOpen` flag in sync with the controlled prop.
  React.useEffect(() => {
    setPanelOpen(open);
  }, [open, setPanelOpen]);

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return files;
    return files.filter(
      (f) =>
        f.path.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.language.toLowerCase().includes(q)
    );
  }, [files, searchQuery]);

  const tree = React.useMemo(() => buildFileTree(filtered), [filtered]);

  const attachedCount = React.useMemo(() => {
    let n = 0;
    for (const f of files) if (attachedIds.has(f.id)) n++;
    return n;
  }, [files, attachedIds]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      await addFiles(e.target.files);
    }
    // Reset so the same file/folder can be re-selected later.
    e.target.value = "";
  };

  const handleFolderChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      await addFiles(e.target.files);
    }
    e.target.value = "";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-md"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border/60 px-5 pb-3 pt-5">
          <SheetTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            {t.projectsTitle}
          </SheetTitle>
          <SheetDescription className="text-xs leading-relaxed">
            {t.projectsDesc}
          </SheetDescription>
        </SheetHeader>

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-5 py-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
          >
            <FilePlus className="h-3.5 w-3.5" />
            {t.addFiles}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => folderInputRef.current?.click()}
          >
            <FolderPlus className="h-3.5 w-3.5" />
            {t.addFolder}
          </Button>
          <div className="ms-auto" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={files.length === 0}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t.clearFiles}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.clearFiles}؟</AlertDialogTitle>
                <AlertDialogDescription>
                  همهٔ فایل‌های پروژه از مرورگر پاک می‌شوند. این عمل قابل بازگشت نیست.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => clearAll()}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {t.confirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Search + bulk attach controls */}
        <div className="flex flex-col gap-2 border-b border-border/60 px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-inline-start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-9 ps-8"
            />
          </div>
          {files.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {t.fileCount(files.length)}
                {attachedCount > 0 && (
                  <span className="ms-2 text-emerald-600 dark:text-emerald-400">
                    {t.contextAttached}: {faNumber(attachedCount)}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => attachAll()}
                  className="h-7 px-2 text-xs"
                  title={t.attachContext}
                >
                  <Check className="h-3 w-3" />
                  همه
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => detachAll()}
                  className="h-7 px-2 text-xs"
                  title={t.detachContext}
                >
                  <X className="h-3 w-3" />
                  هیچ
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* File tree (scrollable) */}
        <div className="min-h-0 flex-1 px-3 py-2">
          <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-0.5">
            {loaded && files.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <FolderOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t.noFiles}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  با دکمهٔ «{t.addFiles}» یا «{t.addFolder}» شروع کنید.
                </p>
              </motion.div>
            ) : tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  نتیجه‌ای یافت نشد.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-1"
                >
                  {tree.map((node) => (
                    <FileTreeRow key={node.path} node={node} depth={0} />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-border/60 px-5 py-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">
            <Check className="h-3 w-3" />
            {faNumber(attachedCount)} پیوست
          </span>
          <p className="ms-2 flex-1 text-xs leading-relaxed text-muted-foreground">
            {t.projectHint}
          </p>
        </SheetFooter>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFolderChange}
          {...FOLDER_INPUT_EXTRA_PROPS}
        />
      </SheetContent>
    </Sheet>
  );
}

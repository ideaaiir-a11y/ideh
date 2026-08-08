"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const isDark = resolvedTheme === "dark";
  const lineCount = value.split("\n").length;
  const isLong = lineCount > 20;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border bg-muted/40">
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/60 px-3 py-1.5">
        <div className="flex items-center gap-2">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400/60" />
            <span className="h-2 w-2 rounded-full bg-amber-400/60" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            {language || "code"}
          </span>
          {isLong && (
            <span className="font-mono text-[10px] text-muted-foreground/50">
               {lineCount} خط
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isLong && (
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              aria-label={collapsed ? "بازکردن کد" : "بستن کد"}
            >
              {collapsed ? "بازکردن" : "بستن"}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            aria-label="کپی کد"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" /> کپی شد
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> کپی
              </>
            )}
          </button>
        </div>
      </div>
      <div className={collapsed ? "max-h-32 overflow-hidden" : ""}>
        <SyntaxHighlighter
          language={language || "text"}
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            background: "transparent",
            fontSize: "0.8125rem",
            padding: "0.875rem 1rem",
          }}
          codeTagProps={{
            style: { fontFamily: "var(--font-geist-mono), monospace" },
          }}
          wrapLongLines={false}
        >
          {value}
        </SyntaxHighlighter>
        {collapsed && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-muted/90 to-transparent" />
        )}
      </div>
    </div>
  );
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={
        "prose-chat max-w-none break-words text-[0.925rem] leading-relaxed " +
        (className ?? "")
      }
    >
      <ReactMarkdown
        components={{
          p({ children }) {
            return <p className="mb-3 last:mb-0">{children}</p>;
          },
          h1({ children }) {
            return (
              <h1 className="mb-3 mt-4 text-xl font-semibold first:mt-0">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="mb-2.5 mt-4 text-lg font-semibold first:mt-0">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="mb-2 mt-3 text-base font-semibold first:mt-0">
                {children}
              </h3>
            );
          },
          ul({ children }) {
            return <ul className="mb-3 ml-5 list-disc space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="mb-3 ml-5 list-decimal space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="pl-1">{children}</li>;
          },
          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-600 underline decoration-emerald-600/30 underline-offset-2 transition-all hover:decoration-emerald-600 hover:decoration-2 dark:text-emerald-400 dark:decoration-emerald-400/30 dark:hover:decoration-emerald-400"
              >
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 border-l-2 border-emerald-500/50 bg-muted/40 px-3 py-1.5 italic text-muted-foreground">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border-b border-border bg-muted/60 px-3 py-2 text-left font-semibold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border-b border-border/60 px-3 py-2">{children}</td>
            );
          },
          hr() {
            return <hr className="my-4 border-border" />;
          },
          strong({ children }) {
            return <strong className="font-semibold text-foreground">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
          del({ children }) {
            return <del className="line-through text-muted-foreground">{children}</del>;
          },
          // Inline code (not in a fenced block)
          // @ts-expect-error - inline is supported by react-markdown v10
          code({ inline, className: cls, children, ...props }) {
            const match = /language-(\w+)/.exec(cls || "");
            const value = String(children).replace(/\n$/, "");
            if (!inline && match) {
              return <CodeBlock language={match[1]} value={value} />;
            }
            if (!inline && value.includes("\n")) {
              return <CodeBlock language="" value={value} />;
            }
            return (
              <code
                className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-0.5 font-mono text-[0.82em] text-foreground"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

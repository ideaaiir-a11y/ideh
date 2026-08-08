import type { Metadata, Viewport } from "next";
import { Vazirmatn, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { BRAND_NAME, TAGLINE, DEVELOPER } from "@/lib/i18n";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} — ${TAGLINE}`,
  description: `دستیار هوشمند مصنوعی فارسی‌زبان با شخصیت‌های متنوع، پاسخ‌های زنده، جست‌وجو، حافظه و پشتیبانی از پروژه‌های کدنویسی. توسعه‌دهنده: ${DEVELOPER}.`,
  keywords: [
    "ایده",
    "دستیار هوشمند",
    "گفت‌وگوی AI",
    "ChatGPT فارسی",
    "ایده",
    "AI chat",
    "Persian AI",
    "Next.js",
  ],
  authors: [{ name: DEVELOPER }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: `${BRAND_NAME} — ${TAGLINE}`,
    description: "دستیار هوشمند فارسی‌زبان با شخصیت‌ها، استریم و حافظهٔ پایدار.",
    siteName: BRAND_NAME,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            richColors
            position="top-center"
            dir="rtl"
            toastOptions={{
              style: { fontFamily: "var(--font-sans)" },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

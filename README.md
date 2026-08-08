<div align="center">

# ✦ ایده

### دستیار هوشمند فارسی‌زبان — Persian AI Assistant



**یک اپلیکیشن کامل گفت‌وگو به‌سبک ChatGPT، کاملاً فارسی و راست‌چین، با قابلیت تبدیل شدن به سرور API سازگار با OpenAI.**

A complete, production-ready ChatGPT-style AI chat application — fully localized in Persian (Farsi) with RTL layout — that can also act as an OpenAI-compatible API server.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2d3748?logo=prisma)](https://www.prisma.io/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-New%20York-000)](https://ui.shadcn.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](#-license)

**توسعه‌دهنده / Developer:** `Ali.Be.b`

</div>

---

## 📑 فهرست مطالب | Table of Contents

- [✨ معرفی | Overview](#-معرفی--overview)
- [🌟 امکانات | Features](#-امکانات--features)
- [🛠 تکنولوژی‌ها | Tech Stack](#-تکنولوژی‌ها--tech-stack)
- [🚀 نصب و اجرا | Getting Started](#-نصب-و-اجرا--getting-started)
- [📡 دسترسی از راه دور | Remote Access API](#-دسترسی-از-راه-دور--remote-access-api)
- [🎨 شخصیت‌ها | Personas](#-شخصیت‌ها--personas)
- [⌨️ میان‌برهای صفحه‌کلید | Keyboard Shortcuts](#️-میان‌برهای-صفحه‌کلید--keyboard-shortcuts)
- [📁 ساختار پروژه | Project Structure](#-ساختار-پروژه--project-structure)
- [🔧 پیکربندی | Configuration](#-پیکربندی--configuration)
- [📸 تصاویر | Screenshots](#-تصاویر--screenshots)
- [🤝 مشارکت | Contributing](#-مشارکت--contributing)
- [📄 لایسنس | License](#-license)

---

## ✨ معرفی | Overview

**ایده** یک اپلیکیشن کامل و آمادهٔ تولید برای گفت‌وگو با ایده است که با تمرکز بر تجربهٔ کاربری فارسی‌زبانان طراحی شده است. این پروژه با الگوبرداری از ChatGPT، DeepSeek، Qwen و Character.AI ساخته شده و امکانات پیشرفته‌ای را در یک رابط کاربری زیبا، راست‌چین و واکنش‌گرا ارائه می‌دهد.

**Hoosh-e No** (lit. "New Intelligence") is a complete, production-ready AI chat application built with a focus on Persian-language user experience. Inspired by ChatGPT, DeepSeek, Qwen, and Character.AI, it delivers advanced features in a beautiful, fully RTL, responsive interface.

> 💡 **نکته:** ایده فقط فارسی پاسخ می‌دهد — تمام شخصیت‌ها برای پاسخگویی به فارسی پیکربندی شده‌اند.
> All personas are configured to always reply in Persian.

---

## 🌟 امکانات | Features

### 💬 گفت‌وگوی هوشمند | Smart Chat
- **پاسخ‌های زنده (Streaming)** — پاسخ‌های ایده به‌صورت زنده و توکن‌به‌توکن نمایش داده می‌شوند
- **پشتیبانی از استدلال (Reasoning)** — نمایش زنجیرهٔ افکار ایده در کنار پاسخ نهایی
- **رندر Markdown کامل** — پشتیبانی از کد، جدول، لیست، ریاضی، و کلاه‌های راهنما
- **کپی کد با یک کلیک** — هر بلوک کد دکمهٔ کپی دارد
- **ویرایش و بازتولید پیام** — ویرایش پیام قبلی یا تولید دوبارهٔ پاسخ
- **اشتراک‌گذاری پیام** — ارسال پیام به‌عنوان پرامپت به گفت‌وگوی دیگر

### 🎭 سیستم شخصیت‌ها | Persona System
- **۶ شخصیت پیش‌فرض** — دستیار، جادوگر کد، الهام، دانشمند، استراتژیست، آشپز
- **ساخت شخصیت دلخواه** — با نام، توضیح، پرامپت سیستمی، رنگ، نماد، خوش‌آمد و پیشنهادها
- **ویرایش و حذف شخصیت‌ها** — مدیریت کامل شخصیت‌های سفارشی
- **پیش‌نمایش زنده** — هنگام ساخت شخصیت، پیش‌نمایش لحظه‌ای نشان داده می‌شود

### 🗂 مدیریت گفت‌وگوها | Conversation Management
- **ذخیره خودکار** — تمام گفت‌وگوها در پایگاه داده SQLite ذخیره می‌شوند
- **عنوان‌گذاری هوشمند** — عنوان هر گفت‌وگو به‌صورت خودکار از اولین پیام تولید می‌شود
- **سنجاق کردن گفت‌وگو** — برای دسترسی سریع به گفت‌وگوهای مهم
- **پوشه‌بندی** — دسته‌بندی گفت‌وگوها در پوشه‌های دلخواه
- **برچسب‌گذاری** — افزودن برچسب به گفت‌وگوها برای جست‌وجوی بهتر
- **جست‌ووجوی کامل** — جست‌وجو در عنوان و محتوای گفت‌وگوها
- **گروه‌بندی زمانی** — امروز، دیروز، هفت روز اخیر، ماه‌ها…
- **خروجی‌گیری** — Markdown یا متن خام

### 🔍 جست‌وجو و ناوبری | Search & Navigation
- **پنل فرمان (Command Palette)** — دسترسی سریع به همهٔ عملیات با `Ctrl+K`
- **فرمان‌های اسلش (Slash Commands)** — `/clear`، `/new`، `/think`، `/export`، `/stats`، `/help`، `/search`، `/bookmark`، `/image`، `/settings`
- **پنل کمک میان‌برها** — فشردن `?` برای دیدن همهٔ میان‌برها
- **فیلتر برچسب‌ها** — فیلتر کردن گفت‌وگوها بر اساس برچسب

### 🎨 ظاهر و سفارشی‌سازی | Appearance & Customization
- **حالت روشن/تاریک** — با تشخیص خودکار سیستم
- **۳ اندازهٔ قلم** — فشرده، راحت، جادار
- **۳ چگالی پیام** — دنج، عادی، расслабленный
- **۳ تم کد** — خودکار، روشن، تاریک
- **رنگ‌های لهجهٔ متنوع** — ۶ رنگ برای شخصیت‌ها
- **قلم فارسی Vazirmatn** — برای خوانایی بهتر فارسی
- **قلم JetBrains Mono** — برای کد و داده‌های یکنواخت

### 🔌 ارائه‌دهندهٔ ایده سفارشی | Custom AI Provider
- **پشتیبانی از OpenAI-compatible** — هر نقطهٔ پایانی سازگار با OpenAI (OpenAI, DeepSeek, Together, Groq, …)
- **تنظیم Base URL + API Key + Model** — در تنظیمات
- **آزمون اتصال** — بررسی اتصال پیش از استفاده
- **Streaming کامل** — پاسخ‌های زنده از ارائه‌دهندهٔ سفارشی
- **ذخیره محلی** — کلیدها فقط در مرورگر شما ذخیره می‌شوند

### 📁 دسترسی به پروژه و کد | Project & Code Access
- **بارگذاری فایل و پوشه** — با `webkitdirectory` برای بارگذاری کل پوشه‌ها
- **مرور درختی فایل‌ها** — نمایش ساختار پروژه
- **پیوست به گفت‌وگو** — فایل‌های انتخاب‌شده به‌عنوان زمینه به ایده ارسال می‌شوند
- **تزریق خودکار به پرامپت** — محتوای فایل‌ها در `<project_files>` به سیستم‌پرامپت افزوده می‌شود

### 🧠 حافظهٔ بلندمدت | Long-term Memory
- **ذخیرهٔ حقایق کاربر** — آنچه ایده باید دربارهٔ شما بداند
- **تزریق خودکار** — حافظه در `<user_memory>` به هر پرامپت افزوده می‌شود
- **مدیریت CRUD** — افزودن، ویرایش، حذف خاطرات
- **ذخیره محلی** — در مرورگر شما

### 📡 دسترسی از راه دور (API) | Remote Access API
- **سرور OpenAI-compatible داخلی** — خود برنامه به یک سرور API تبدیل می‌شود
- **`/api/v1/chat/completions`** — streaming و non-streaming
- **`/api/v1/models`** — فهرست مدل‌ها
- **احراز هویت با API Key** — تولید، چرخش و غیرفعال‌سازی کلید
- **پرامپت سیستمی پیش‌فرض** — قابل تنظیم برای همهٔ درخواست‌های از راه دور
- **نمونهٔ کد آماده** — cURL، Python، JavaScript با کپی به کلیپ‌بورد
- *(جزئیات کامل در [بخش دسترسی از راه دور](#-دسترسی-از-راه-دور--remote-access-api))*

### 🎯 امکانات دیگر | Other Features
- **پاسخ به تصویر (Vision)** — ارسال تصویر و پرسیدن سؤال دربارهٔ آن
- **تولید تصویر** — با فرمان `/image` و توضیف متنی
- **تشخیص صوت (ASR)** — تبدیل گفتار به متن
- **تولید صوت (TTS)** — تبدیل پاسخ به گفتار
- **خواندن وب** — استخراج محتوای صفحهٔ وب
- **جست‌وجوی وب** — برای اطلاعات به‌روز
- **الگوهای پرامپت** — ۱۲ الگوی آماده + ذخیرهٔ الگوهای دلخواه
- **آمار گفت‌وگو** — تعداد گفت‌وگوها، پیام‌ها، توزیع شخصیت‌ها
- **نشانه‌گذاری پیام** — bookmark کردن پیام‌های مهم
- **واکنش به پیام** — لایک/دیس‌لایک
- **کپی سریع** — کپی هر پیام با یک کلیک
- **سفارشی‌سازی کامل** — رفتار برنامه در تنظیمات

---

## 🛠 تکنولوژی‌ها | Tech Stack

| دسته | تکنولوژی |
|------|----------|
| **فریم‌ورک** | [Next.js 16](https://nextjs.org/) (App Router, React 19) |
| **زبان** | [TypeScript 5](https://www.typescriptlang.org/) |
| **استایل** | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (New York) |
| **آیکون‌ها** | [Lucide React](https://lucide.dev/) |
| **پایگاه داده** | [Prisma ORM](https://www.prisma.io/) + SQLite |
| **مدیریت وضعیت** | [Zustand](https://zustand-demo.pmnd.rs/) (client) + [TanStack Query](https://tanstack.com/query) (server) |
| **ایده** | [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) |
| **قلم فارسی** | [Vazirmatn](https://github.com/rastikerdar/vazirmatn) + [JetBrains Mono](https://www.jetbrains.com/lp/mono/) |
| **Markdown** | [react-markdown](https://github.com/remarkjs/react-markdown) + [rehype](https://github.com/rehypejs/rehype) + [Shiki](https://shiki.style/) |
| **اعلان‌ها** | [Sonner](https://sonner.emilkowal.ski/) |
| **انیمیشن** | [Framer Motion](https://www.framer.com/motion/) |

---

## 🚀 نصب و اجرا | Getting Started

### پیش‌نیازها | Prerequisites

- [Node.js](https://nodejs.org/) ≥ 20 یا [Bun](https://bun.sh/) ≥ 1.3
- هیچ کلید API خارجی لازم نیست — ارائه‌دهندهٔ پیش‌فرض به‌صورت خودکار پیکربندی شده است

### مراحل نصب | Installation

```bash
# ۱. کلون کردن مخزن
git clone https://github.com/Ali-Be-b/hoosh-no.git
cd hoosh-no

# ۲. نصب وابستگی‌ها
bun install
# یا: npm install / pnpm install

# ۳. راه‌اندازی پایگاه داده
bun run db:push

# ۴. اجرای سرور توسعه
bun run dev
```

سپس مرورگر را روی [`http://localhost:3000`](http://localhost:3000) باز کنید.

> 📝 **یادداشت:** برای تولید (production) از `bun run build && bun run start` استفاده کنید.

---

## 📡 دسترسی از راه دور | Remote Access API

ایده می‌تواند خودش به یک **سرور API سازگار با OpenAI** تبدیل شود تا از هر کلاینتی (Python، JavaScript، curl، LangChain، …) از راه دور به آن وصل شوید.

### فعال‌سازی | Enable

۱. در برنامه، به **تنظیمات → تب «دسترسی از راه دور»** بروید.
۲. مطمئن شوید سوئیچ «فعال‌سازی دسترسی از راه دور» روشن است.
۳. روی «ساخت کلید جدید» بزنید و کلید را کپی کنید (فقط یک بار نمایش داده می‌شود).

### استفاده | Usage

**Python (با کتابخانهٔ OpenAI):**

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://your-app-url/api/v1",
    api_key="hn_your_api_key_here",
)

response = client.chat.completions.create(
    model="hoosh-no",
    messages=[
        {"role": "user", "content": "سلام، حالت چطوره؟"}
    ],
)

print(response.choices[0].message.content)
# → سلام! من ایده هستم، یک دستیار هوشمند فارسی‌زبان...
```

**JavaScript / TypeScript:**

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://your-app-url/api/v1",
  apiKey: "hn_your_api_key_here",
});

const response = await client.chat.completions.create({
  model: "hoosh-no",
  messages: [{ role: "user", content: "سلام" }],
});
```

**cURL:**

```bash
curl https://your-app-url/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hn_your_api_key_here" \
  -d '{
    "model": "hoosh-no",
    "messages": [{"role": "user", "content": "سلام"}],
    "stream": false
  }'
```

### نقاط پایانی | Endpoints

| متد | مسیر | توضیح |
|------|------|-------|
| `POST` | `/api/v1/chat/completions` | تکمیل گفت‌وگو (streaming + non-streaming) |
| `GET` | `/api/v1/models` | فهرست مدل‌های موجود |
| `GET` | `/api/remote-access` | وضعیت فعلی (کلید ماسک‌شده) |
| `POST` | `/api/remote-access` | چرخش کلید |
| `PATCH` | `/api/remote-access` | فعال/غیرفعال‌سازی یا تغییر پرامپت پیش‌فرض |

### مدل‌ها | Models

| ID | توضیح |
|----|-------|
| `hoosh-no` | مدل پیش‌فرض، همیشه فارسی پاسخ می‌دهد |
| `hoosh-no-reasoning` | مدل با استدلال |

> ⚠️ **هشدار امنیتی:** کلید API را محرمانه نگه دارید. هر کسی که این کلید را داشته باشد می‌تواند از طریق API به ایده دسترسی پیدا کند.

---

## 🎨 شخصیت‌ها | Personas

| نماد | نام | توضیح |
|------|-----|-------|
| ✦ | **دستیار ایده** | دستیار همه‌کارهٔ فارسی‌زبان |
| ⌘ | **جادوگر کد** | متخصص برنامه‌نویسی و توسعهٔ نرم‌افزار |
| ✎ | **الهام** | الهام‌بخش خلاقیت و نوشتن |
| 🎓 | **دانشمند** | پژوهشگر علمی و آکادمیک |
| 📈 | **استراتژیست** | مشاور استراتژیک و تحلیلی |
| 🍳 | **آشپز** | راهنمای آشپزی و غذا |

هر شخصیت دارای:
- پرامپت سیستمی اختصاصی
- رنگ لهجهٔ منحصربه‌فرد
- پیام خوش‌آمدگویی
- پیشنهادهای شروع گفت‌وگو

شما می‌توانید شخصیت‌های دلخواه خود را نیز بسازید.

---

## ⌨️ میان‌برهای صفحه‌کلید | Keyboard Shortcuts

| کلید | عملکرد |
|------|--------|
| `Ctrl + K` | باز کردن پنل فرمان |
| `Ctrl + /` | باز کردن فرمان‌های اسلش |
| `?` | نمایش کمک میان‌برها |
| `Ctrl + B` | بستن/باز کردن نوار کناری |
| `Ctrl + N` | گفت‌وگوی جدید |
| `Enter` | ارسال پیام |
| `Shift + Enter` | خط جدید در پیام |
| `Esc` | بستن دیالوگ |

---

## 📁 ساختار پروژه | Project Structure

```
hoosh-no/
├── prisma/
│   └── schema.prisma              # مدل داده: Conversation, Message
├── public/
│   └── hoosh-no-banner.png        # بنر پروژه
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/              # نقطهٔ پایانی گفت‌وگو (SSE streaming)
│   │   │   ├── conversations/     # CRUD گفت‌وگوها
│   │   │   ├── messages/          # CRUD پیام‌ها
│   │   │   ├── personas/          # فهرست شخصیت‌ها
│   │   │   ├── v1/
│   │   │   │   ├── chat/completions/  # OpenAI-compatible endpoint
│   │   │   │   └── models/            # OpenAI-compatible models list
│   │   │   ├── asr/               # تشخیص صوت
│   │   │   ├── tts/               # تولید صوت
│   │   │   ├── image-gen/         # تولید تصویر
│   │   │   ├── vision/            # درک تصویر
│   │   │   └── export/            # خروجی‌گیری
│   │   ├── layout.tsx             # RTL, Vazirmatn, metadata
│   │   ├── page.tsx               # صفحهٔ اصلی
│   │   └── globals.css            # استایل‌های سراسری + RTL utilities
│   ├── components/
│   │   ├── chat/                  # ۱۸ کامپوننت گفت‌وگو
│   │   │   ├── chat-app.tsx       # ارکستراسیون اصلی
│   │   │   ├── chat-input.tsx     # ورودی پیام + toolbar
│   │   │   ├── chat-messages.tsx  # نمایش پیام‌ها
│   │   │   ├── chat-sidebar.tsx   # نوار کناری گفت‌وگوها
│   │   │   ├── chat-welcome.tsx   # صفحهٔ خوش‌آمد
│   │   │   ├── message-bubble.tsx # حباب پیام + انیمیشن
│   │   │   ├── markdown-renderer.tsx
│   │   │   ├── settings-dialog.tsx    # ۷ تب تنظیمات
│   │   │   ├── persona-picker.tsx
│   │   │   ├── persona-creator.tsx
│   │   │   ├── project-panel.tsx
│   │   │   ├── command-palette.tsx
│   │   │   ├── slash-commands.tsx
│   │   │   ├── keyboard-help.tsx
│   │   │   ├── prompt-templates.tsx
│   │   │   ├── tag-input.tsx
│   │   │   └── tag-filter-bar.tsx
│   │   └── ui/                    # کامپوننت‌های shadcn/ui
│   ├── lib/
│   │   ├── db.ts                  # Prisma client
│   │   ├── personas.ts            # ۶ شخصیت پیش‌فرض
│   │   ├── prompt-templates.ts    # ۱۲ الگوی پرامپت
│   │   ├── settings.ts            # Zustand store تنظیمات
│   │   ├── remote-access.ts       # مدیریت کلید API از راه دور
│   │   ├── memory-store.ts        # حافظهٔ بلندمدت
│   │   ├── project-store.ts       # فایل‌های پروژه
│   │   ├── project-context.ts     # قالب‌بندی زمینهٔ پروژه
│   │   └── i18n.ts                # دیکشنری فارسی + کمک‌کننده‌ها
│   └── store/
│       └── chat-store.ts          # Zustand store گفت‌وگو
├── .gitignore
├── package.json
└── README.md
```


## 🤝 مشارکت | Contributing

مشارکت استقبال می‌شود! اگر باگ پیدا کردید یا قابلیت جدیدی پیشنهاد دارید:

1. یک Issue باز کنید
2. یک fork ایجاد کنید
3. شاخهٔ feature بسازید (`git checkout -b feature/amazing-feature`)
4. تغییرات را commit کنید (`git commit -m 'Add amazing feature'`)
5. push کنید (`git push origin feature/amazing-feature`)
6. یک Pull Request باز کنید

### استانداردهای کد | Code Standards

- TypeScript با نوع‌دهی سخت‌گیرانه
- ESLint بدون خطا (`bun run lint`)
- کامپوننت‌های shadcn/ui به‌جای ساخت از صفر
- ترجمهٔ همهٔ رشته‌های کاربر-رو به فارسی
- استفاده از خصوصیات منطقی Tailwind (`ms-*`, `me-*`, `ps-*`, `pe-*`) برای RTL

---

## 📄 لایسنس | License

این پروژه تحت لایسنس **MIT** منتشر شده است. برای جزئیات بیشتر فایل [LICENSE](LICENSE) را ببینید.

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

### ✦ ساخته‌شده با ❤️ برای جامعهٔ فارسی‌زبان

**توسعه‌دهنده / Developer:** علی بهزاد بهبهانی   ali behzad behbahani

**ایده** — *دستیار هوشمند فارسی‌زبان*

اگر این پروژه برایتان مفید بود، یک ⭐ روی GitHub بدهید!

</div>

"# idea" 
"# idea" 
"# idea" 
"# idea" 
"# idea" 
"# vite-react" 
"# idea" 
"# base" 

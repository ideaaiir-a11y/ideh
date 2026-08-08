/**
 * Prompt Template Library (Persian / ایده)
 * Built-in templates plus user-saved templates stored in localStorage.
 * Templates are categorized and can be inserted into the chat input
 * with one click — a major productivity boost for repeated prompts.
 */

export interface PromptTemplate {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  icon?: string;
  builtin?: boolean;
}

export const BUILTIN_TEMPLATES: PromptTemplate[] = [
  {
    id: "builtin-explain",
    title: "ساده توضیح بده",
    description: "مفهومی پیچیده را ساده کن",
    content:
      "مفهوم زیر را طوری توضیح بده که یک کودک ۵ ساله بتواند بفهمد. از واژه‌های ساده، تشبیه‌های روزمره و دور از اصطلاحات فنی استفاده کن:\n\n",
    category: "یادگیری",
    icon: "GraduationCap",
    builtin: true,
  },
  {
    id: "builtin-summarize",
    title: "خلاصهٔ نکات کلیدی",
    description: "ایده‌های اصلی متن را بیرون بکش",
    content:
      "متن زیر را در ۵ نقطهٔ موجز خلاصه کن و فقط اطلاعات کلیدی را بیاور:\n\n",
    category: "نوشتن",
    icon: "List",
    builtin: true,
  },
  {
    id: "builtin-code-review",
    title: "کد من را بازبینی کن",
    description: "باگ‌ها را پیدا کن و بهبود پیشنهاد بده",
    content:
      "لطفاً کد زیر را بازبینی کن. باگ‌های بالقوه، مشکلات امنیتی و کارایی را شناسایی کن و بهبودهای مشخص با مثال کد پیشنهاد بده:\n\n```\n",
    category: "برنامه‌نویسی",
    icon: "Code2",
    builtin: true,
  },
  {
    id: "builtin-refactor",
    title: "بازنویسی برای خوانایی",
    description: "ساختار کد را بهبود بده",
    content:
      "کد زیر را برای خوانایی، نگه‌داری و پیروی از بهترین روش‌ها بازنویسی کن. هر تغییر را توضیح بده:\n\n```\n",
    category: "برنامه‌نویسی",
    icon: "Wrench",
    builtin: true,
  },
  {
    id: "builtin-translate",
    title: "ترجمه به انگلیسی",
    description: "هر متنی را ترجمه کن",
    content:
      "متن زیر را به انگلیسی ترجمه کن. معنی، لحن و قالب‌بندی اصلی را حفظ کن:\n\n",
    category: "نوشتن",
    icon: "Languages",
    builtin: true,
  },
  {
    id: "builtin-email",
    title: "ایمیل حرفه‌ای بنویس",
    description: "یک ایمیل مرتب بنویس",
    content:
      "یک ایمیل حرفه‌ای و موجز دربارهٔ موضوع زیر بنویس. لحن دوستانه اما رسمی داشته باش، موضوع روشن بیاور و زیر ۱۵۰ واژه بمان:\n\nموضوع: ",
    category: "نوشتن",
    icon: "Mail",
    builtin: true,
  },
  {
    id: "builtin-brainstorm",
    title: "طوفان فکری",
    description: "۱۰ ایدهٔ خلاقانه تولید کن",
    content:
      "برای موضوع زیر ۱۰ ایدهٔ خلاقانه و متنوع تولید کن. برای هر ایده یک خط توضیح بنویس. از چارچوب‌های معمول خارج شو:\n\n",
    category: "خلاقیت",
    icon: "Lightbulb",
    builtin: true,
  },
  {
    id: "builtin-meeting-notes",
    title: "صورت‌جلسه",
    description: "یادداشت جلسه را قالب‌بندی کن",
    content:
      "صورت جلسهٔ زیر را به یادداشت‌های ساختاریافته با این بخش‌ها تبدیل کن: حاضرین، تصمیمات کلیدی، اقدامات (با مسئول)، و گام‌های بعدی. از Markdown استفاده کن:\n\n",
    category: "کار",
    icon: "ClipboardList",
    builtin: true,
  },
  {
    id: "builtin-debug",
    title: "رفع این خطا",
    description: "علت خطا را تشخیص بده و درست کن",
    content:
      "این خطا را دریافت می‌کنم. لطفاً علت ریشه‌ای را تشخیص بده و راه‌حل با توضیح بده. در صورت لزوم کد اصلاح‌شده را بیاور:\n\nخطا:\n",
    category: "برنامه‌نویسی",
    icon: "Bug",
    builtin: true,
  },
  {
    id: "builtin-rewrite",
    title: "نوشته‌ام را بهبود بده",
    description: "لحن و وضوح را بهتر کن",
    content:
      "متن زیر را از نظر وضوح، ایجاز و روانی بهبود بده. معنی اصلی را حفظ کن اما جذاب‌تر و حرفه‌ای‌ترش کن. ابتدا نسخهٔ بازنویسی‌شده را نشان بده، سپس به‌طور کوتاه تغییراتت را توضیح بده:\n\n",
    category: "نوشتن",
    icon: "PenLine",
    builtin: true,
  },
  {
    id: "builtin-study-plan",
    title: "برنامهٔ مطالعه بساز",
    description: "یک زمان‌بندی یادگیری بریز",
    content:
      "یک برنامهٔ مطالعهٔ ساختاریافتهٔ ۴ هفته‌ای برای یادگیری موضوع زیر بساز. آن را به جلسات روزانهٔ ۱ ساعته با منابع مشخص، تمرین‌ها و نقاط عطف هفتگی تقسیم کن:\n\nموضوع: ",
    category: "یادگیری",
    icon: "Calendar",
    builtin: true,
  },
  {
    id: "builtin-pros-cons",
    title: "تحلیل مزایا و معایب",
    description: "گزینه‌ها را بی‌طرفانه بسنج",
    content:
      "تصمیم زیر را با فهرست ۵ مزیت و ۵ عیب در یک جدول Markdown تحلیل کن. سپس یک توصیهٔ متوازن با استدلال بده:\n\nتصمیم: ",
    category: "کار",
    icon: "Scale",
    builtin: true,
  },
];

const STORAGE_KEY = "hosh-no:user-templates";

/**
 * Load user-saved templates from localStorage.
 */
export function loadUserTemplates(): PromptTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t) => t && typeof t.id === "string" && typeof t.content === "string"
    );
  } catch {
    return [];
  }
}

/**
 * Persist user templates to localStorage.
 */
export function saveUserTemplates(templates: PromptTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // storage may be full or disabled
  }
}

/**
 * All templates grouped by category.
 */
export function groupByCategory(
  templates: PromptTemplate[]
): { category: string; items: PromptTemplate[] }[] {
  const map = new Map<string, PromptTemplate[]>();
  for (const t of templates) {
    const arr = map.get(t.category) ?? [];
    arr.push(t);
    map.set(t.category, arr);
  }
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

export function makeTemplateId(): string {
  return "user-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

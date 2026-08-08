/**
 * Ide (ایده) — Persian (Farsi) localization layer.
 *
 * This module centralizes:
 *  - The app brand name + developer credit
 *  - Persian digit conversion
 *  - Persian (Jalali-friendly) relative date labels
 *  - A dictionary of common UI strings used across components
 *
 * The whole UI is right-to-left (dir="rtl") and lang="fa".
 */

export const BRAND_NAME = "ایده";
export const BRAND_NAME_LATIN = "Ide";
export const DEVELOPER = "Ali.Be.b";
export const TAGLINE = "دستیار هوشمند فارسی‌زبان";

/** Convert Latin digits in a string to Persian digits (۰-۹). */
export function toPersianDigits(input: string | number): string {
  const s = String(input);
  const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return s.replace(/[0-9]/g, (d) => fa[Number(d)]);
}

/** Convert Persian/Arabic digits to Latin digits (for numeric parsing). */
export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Format a number with Persian digits and thousands separator. */
export function faNumber(n: number): string {
  return toPersianDigits(n.toLocaleString("en-US"));
}

/**
 * Persian relative date label for sidebar grouping.
 * Returns one of: "سنجاق‌شده", "امروز", "دیروز", "هفتهٔ اخیر", "قدیمی‌تر".
 */
export function faRelativeBucket(ts: number | string): string {
  const d = new Date(ts);
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const day = new Date(d);
  day.setHours(0, 0, 0, 0);

  if (day.getTime() === today.getTime()) return "امروز";
  if (day.getTime() === yesterday.getTime()) return "دیروز";
  if (day.getTime() >= weekAgo.getTime()) return "هفتهٔ اخیر";
  return "قدیمی‌تر";
}

/** Short Persian time label (e.g. ۱۴:۳۰). */
export function faTime(ts: number | string): string {
  try {
    const d = new Date(ts);
    return toPersianDigits(
      d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "";
  }
}

/** Persian date divider label: "امروز" / "دیروز" / تاریخ شمسی. */
export function faDateLabel(ts: number | string): string {
  try {
    const d = new Date(ts);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    if (day.getTime() === today.getTime()) return "امروز";
    if (day.getTime() === yesterday.getTime()) return "دیروز";
    // Use fa-IR locale which renders Jalali (شمسی) dates.
    return toPersianDigits(
      d.toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  } catch {
    return "";
  }
}

/**
 * Dictionary of common UI strings. Components import `t` and reference
 * keys here so repeated strings stay consistent and editable in one place.
 */
export const t = {
  // Brand / header
  newChat: "گفت‌وگوی جدید",
  searchPlaceholder: "جست‌وجو در گفت‌وگوها…",
  searchInConv: "جست‌وجو در این گفت‌وگو…",
  searchInConvShort: "جست‌وجو",
  clearAll: "پاک‌سازی همه",
  settings: "تنظیمات",
  commandPalette: "پنل فرمان",
  keyboardShortcuts: "میان‌برهای صفحه‌کلید",

  // Sidebar
  conversations: "گفت‌وگوها",
  noConversations: "هنوز گفت‌وگویی ندارید",
  pinned: "سنجاق‌شده",
  today: "امروز",
  yesterday: "دیروز",
  thisWeek: "هفتهٔ اخیر",
  earlier: "قدیمی‌تر",
  allChats: "همه",
  folders: "پوشه‌ها",
  addFolder: "پوشهٔ جدید",
  rename: "تغییر نام",
  delete: "حذف",
  pin: "سنجاق",
  unpin: "برداشتن سنجاع",
  bookmark: "نشان‌گذاری",
  bookmarks: "نشان‌شده‌ها",
  showAll: "نمایش همه",
  messageCount: (n: number) => `${faNumber(n)} پیام`,

  // Welcome
  chatWith: (name: string) => `گفت‌وگو با ${name}`,
  switchAssistant: "تغییر دستیار",
  pressForCommands: "برای فرمان‌ها",
  forShortcuts: "برای میان‌برها",

  // Input
  messagePlaceholder: (name: string) => `پیام به ${name}…`,
  askAboutImages: " دربارهٔ این تصویرها بپرس…",
  send: "ارسال",
  stop: "توقف",
  thinking: "تفکر",
  think: "تفکر",
  templates: "الگوها",
  mic: "میکروفون",
  stopRec: "توقف ضبط",
  image: "تصویر",
  attach: "پیوست",
  dropImages: "تصاویر را اینجا رها کنید",
  enterToSend: "Enter برای ارسال",
  shiftEnterNewline: "Shift+Enter خط جدید",
  cmdEnterToSend: "⌘+Enter برای ارسال",
  enterNewline: "Enter خط جدید",
  reasoningOn: "تفکر فعال",
  visionMode: (n: number) => `حالت بینایی (${faNumber(n)})`,
  imageGenMode: "حالت تولید تصویر",
  whatInImage: "در این تصویر چه هست؟",

  // Message actions
  copy: "کپی",
  copied: "کپی شد",
  regenerate: "تولید دوباره",
  continue: "ادامه",
  edit: "ویرایش",
  save: "ذخیره",
  cancel: "انصراف",
  speak: "خواندن",
  stopSpeak: "توقف خواندن",
  reactUp: "خوب بود",
  reactDown: "بد بود",
  share: "اشتراک",
  moreActions: "بیشتر",
  tokenCount: (n: number) => `${faNumber(n)} توکن`,
  aborted: "متوقف‌شده",

  // Empty / errors
  somethingWrong: "خطایی رخ داد.",
  requestFailed: "درخواست ناموفق بود",
  aiFailed: "پاسخ ایده ناموفق بود",
  generating: "در حال تولید…",
  thinkingLabel: "در حال تفکر…",

  // Export
  exportMarkdown: "خروجی Markdown",
  exportJson: "خروجی JSON",
  exportPdf: "خروجی PDF",
  stats: "آمار",
  clearMessages: "پاک‌سازی پیام‌ها",

  // Settings dialog
  settingsTitle: "تنظیمات",
  settingsDesc: "تجربهٔ ایده را شخصی‌سازی کنید",
  tabGeneral: "عمومی",
  tabAppearance: "ظاهر",
  tabBehavior: "رفتار",
  tabProvider: "ارائه‌دهندهٔ ایده",
  tabProjects: "پروژه‌ها",
  tabMemory: "حافظه",
  defaultPersona: "شخصیت پیش‌فرض",
  defaultPersonaDesc: "شخصیتی که برای گفت‌وگوهای جدید انتخاب می‌شود.",
  defaultFolder: "پوشهٔ پیش‌فرض",
  defaultFolderDesc: "گفت‌وگوهای جدید خودکار در این پوشه قرار می‌گیرند (خالی = هیچ‌کدام).",
  fontSize: "اندازهٔ قلم",
  fontSizeDesc: "اندازهٔ پایهٔ متن پیام‌ها و رابط.",
  compact: "فشرده",
  comfortable: "راحت",
  spacious: "وسیع",
  messageDensity: "تراکم پیام‌ها",
  messageDensityDesc: "فاصلهٔ بین پیام‌های متوالی.",
  cozy: "نزدیک",
  normal: "معمولی",
  relaxed: "وسیع",
  codeTheme: "تم کد",
  codeThemeDesc: "تم نمایش بلوک‌های کد.",
  auto: "خودکار",
  light: "روشن",
  dark: "تیره",
  sendOnEnter: "ارسال با Enter",
  sendOnEnterDesc: "اگر روشن باشد، Enter پیام را می‌فرستد. اگر خاموش، Enter خط جدید و ⌘/Ctrl+Enter ارسال می‌کند.",
  autoScroll: "پیمایش خودکار",
  autoScrollDesc: "هنگام رسیدن محتوای جدید، خودکار به پایین پیمایش کن.",
  streamingCursor: "نشانگر استریم",
  streamingCursorDesc: "نمایش مکان‌نمای چشمک‌زن در انتهای پیام دستیار هنگام استریم.",
  showTokenCount: "شمارش توکن",
  showTokenCountDesc: "نمایش نشانگر تعداد توکن تقریبی روی پیام‌های دستیار.",
  confirmDelete: "تأیید پیش از حذف",
  confirmDeleteDesc: "نمایش پنجرهٔ تأیید پیش از حذف گفت‌وگوها.",
  resetDefaults: "بازنشانی به پیش‌فرض",
  done: "انجام شد",
  none: "هیچ‌کدام",

  // Provider tab
  providerTitle: "ارائه‌دهندهٔ ایده",
  providerDesc: "از ارائه‌دهندهٔ پیش‌فرض استفاده کنید، یا Base URL و API Key اختصاصی خود را وارد کنید (سازگار با OpenAI).",
  useCustom: "استفاده از ارائه‌دهندهٔ سفارشی",
  useCustomDesc: "اگر فعال باشد، درخواست‌ها به جای SDK پیش‌فرض به Base URL شما ارسال می‌شوند.",
  baseUrl: "Base URL (آدرس پایه)",
  baseUrlPlaceholder: "https://api.example.com/v1",
  baseUrlDesc: "نقطهٔ پایانی سازگار با OpenAI (با /chat/completions).",
  apiKey: "API Key (کلید API)",
  apiKeyPlaceholder: "sk-…",
  apiKeyDesc: "کلید شما در مرورگر ذخیره می‌شود و برای ارسال درخواست به ارائه‌دهنده، به سرور ارسال می‌گردد اما در سرور ذخیره نمی‌شود.",
  model: "مدل",
  modelPlaceholder: "gpt-4o-mini",
  modelDesc: "نام مدل مورد استفاده برای پاسخ‌ها.",
  testConnection: "آزمون اتصال",
  testing: "در حال آزمون…",
  testOk: "اتصال موفق بود ✓",
  testFail: "اتصال ناموفق بود",
  saveProvider: "ذخیرهٔ تنظیمات",
  providerNote: "⚠ این تنظیمات فقط در همین مرورگر ذخیره می‌شوند.",

  // Projects tab
  projectsTitle: "پروژه‌ها و فایل‌ها",
  projectsDesc: "فایل‌های پروژه را اضافه کنید تا ایده بتواند کد شما را بخواند و روی آن کار کند.",
  addFiles: "افزودن فایل",
  addFolder: "افزودن پوشه",
  noFiles: "هنوز فایلی اضافه نشده",
  fileCount: (n: number) => `${faNumber(n)} فایل`,
  contextAttached: "پیوست به زمینه",
  attachContext: "پیوست به گفت‌وگو",
  detachContext: "جدا کردن",
  clearFiles: "پاک‌سازی همهٔ فایل‌ها",
  projectHint: "فایل‌ها به‌صورت محلی در مرورگر ذخیره می‌شوند. می‌توانید آن‌ها را به‌عنوان زمینه به هر پیامی پیوست کنید.",

  // Remote access tab
  tabRemote: "دسترسی از راه دور",
  remoteTitle: "دسترسی از راه دور (API)",
  remoteDesc: "این برنامه را به یک سرور API سازگار با OpenAI تبدیل می‌کند تا بتوانید از هر کلاینت (curl، Python، JavaScript، …) از راه دور به ایده وصل شوید.",
  remoteEnabled: "فعال‌سازی دسترسی از راه دور",
  remoteEnabledDesc: "اگر فعال باشد، نقطهٔ پایانی /api/v1/chat/completions در دسترس خواهد بود.",
  remoteBaseUrl: "Base URL (آدرس پایه)",
  remoteBaseUrlDesc: "آدرس پایه برای کلاینت‌ها. این آدرس را در کلاینت OpenAI خود وارد کنید.",
  remoteApiKey: "API Key (کلید API)",
  remoteApiKeyDesc: "این کلید را به‌عنوان هدر Authorization: Bearer <key> ارسال کنید. کلید فقط پس از ساخت دوباره به‌صورت کامل نمایش داده می‌شود.",
  remoteCopyBaseUrl: "کپی Base URL",
  remoteCopyKey: "کپی کلید",
  remoteRegenerate: "ساخت کلید جدید",
  remoteRegenerateConfirm: "کلید قبلی بلافاصله غیرفعال می‌شود. مطمئن هستید؟",
  remoteShowKey: "نمایش کلید",
  remoteHideKey: "پنهان کردن",
  remoteDefaultPrompt: "پرامپت سیستمی پیش‌فرض",
  remoteDefaultPromptDesc: "این پرامپت پیش از پیام‌های کلاینت به هر درخواست از راه دور افزوده می‌شود (مگر آنکه کلاینت no_default_system_prompt ارسال کند).",
  remoteModelsPath: "مسیر فهرست مدل‌ها",
  remoteChatPath: "مسیر تکمیل گفت‌وگو",
  remoteStatusOn: "● فعال و آمادهٔ اتصال",
  remoteStatusOff: "● غیرفعال",
  remoteCreatedAt: "تاریخ ساخت",
  remoteRotatedAt: "آخرین ساخت کلید",
  remoteExamples: "نمونهٔ استفاده",
  remoteExampleCurl: "cURL",
  remoteExamplePython: "Python",
  remoteExampleJs: "JavaScript",
  remoteCopied: "در کلیپ‌بورد کپی شد",
  remoteKeyRegenerated: "کلید جدید ساخته شد — آن را ذخیره کنید (دیگر نمایش داده نمی‌شود)",
  remoteEnabledToast: "دسترسی از راه دور فعال شد",
  remoteDisabledToast: "دسترسی از راه دور غیرفعال شد",
  remotePromptSaved: "پرامپت پیش‌فرض ذخیره شد",
  remoteLoading: "در حال بارگذاری…",
  remoteNeverRotated: "هرگز",
  remoteWarning: "⚠ این کلید را محرمانه نگه دارید. هر کسی که این کلید را داشته باشد می‌تواند از طریق API به ایده دسترسی پیدا کند.",

  // Memory tab
  memoryTitle: "حافظهٔ بلندمدت",
  memoryDesc: "حقایقی که ایده باید دربارهٔ شما به خاطر بسپارد. این موارد به систем‌پرامپت افزوده می‌شوند.",
  addMemory: "افزودن حافظه",
  memoryPlaceholder: "مثلاً: من توسعه‌دهندهٔ Python هستم و طرح‌بندی RTL را ترجیح می‌دهم.",
  noMemory: "هنوز خاطره‌ای ثبت نشده",
  memoryCount: (n: number) => `${faNumber(n)} خاطره`,

  // Stats
  totalConversations: "کل گفت‌وگوها",
  totalMessages: "کل پیام‌ها",
  messagesByPersona: "پیام‌ها بر اساس شخصیت",
  pinnedCount: "سنجاع‌شده‌ها",
  bookmarkedCount: "نشان‌شده‌ها",

  // Confirm dialogs
  confirmClearTitle: "پاک‌سازی همهٔ گفت‌وگوها؟",
  confirmClearDesc: "این عمل همهٔ گفت‌وگوها و پیام‌ها را برای همیشه حذف می‌کند. این عمل قابل بازگشت نیست.",
  confirmDeleteTitle: "حذف گفت‌وگو؟",
  confirmDeleteDesc: "این گفت‌وگو و همهٔ پیام‌های آن حذف می‌شوند.",
  confirm: "تأیید",
} as const;




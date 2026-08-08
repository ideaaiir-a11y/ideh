const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const translations = {
  "Quantum Computing Explained": "راهنمای کامپیوتر کوانتومی",
  "React Component Imports": "واردات کامپوننت‌های React",
  "Introductions and Assistance": "معرفی و راهنمایی",
  "Capabilities Inquiry": "بررسی قابلیت‌ها",
  "Visual Sharing": "به‌اشتراک‌گذاری تصویری",
  "React useEffect Double Execution": "اجرای دوتایی useEffect در React",
  "Python Bubble Sort Implementation": "پیاده‌سازی Bubble Sort در پایتون",
  "Photosynthesis Process Explained": "فرآیند فتوسنتز توضیح داده شد",
  "AI History Overview": "تاریخچهٔ هوش مصنوعی",
  "Internet Evolution": "تکامل اینترنت",
  "Math Helper": "دستیار ریاضی",
  "Percentage Calculation": "محاسبهٔ درصد",
  "Initial User Inquiry": "پرسش اولیهٔ کاربر",
};

async function main() {
  // Update conversation titles
  const convs = await prisma.conversation.findMany({
    select: { id: true, title: true },
  });

  for (const conv of convs) {
    let updated = false;
    let newTitle = conv.title;
    for (const [en, fa] of Object.entries(translations)) {
      if (newTitle.includes(en)) {
        newTitle = newTitle.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fa);
        updated = true;
      }
    }
    if (updated) {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { title: newTitle },
      });
      console.log(`Updated conversation: ${conv.id} -> ${newTitle}`);
    }
  }

  // Update messages
  const msgs = await prisma.message.findMany({
    where: {
      OR: Object.keys(translations).map(en => ({ content: { contains: en } })),
    },
    select: { id: true, content: true },
  });

  for (const msg of msgs) {
    let updated = false;
    let newContent = msg.content;
    for (const [en, fa] of Object.entries(translations)) {
      if (newContent.includes(en)) {
        newContent = newContent.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fa);
        updated = true;
      }
    }
    if (updated) {
      await prisma.message.update({
        where: { id: msg.id },
        data: { content: newContent },
      });
      console.log(`Updated message: ${msg.id}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    // Case-insensitive search using raw SQL
    const msgs = await prisma.$queryRaw`
      SELECT id, content FROM Message WHERE LOWER(content) LIKE '%quantum%' LIMIT 20
    `;
    console.log("Messages with quantum (raw):", msgs.length);
    (msgs || []).forEach(m => console.log(`  ${m.id}: ${String(m.content).substring(0, 100)}`));

    const convs = await prisma.$queryRaw`
      SELECT id, title FROM Conversation WHERE LOWER(title) LIKE '%quantum%' LIMIT 20
    `;
    console.log("\nConversations with quantum (raw):", (convs || []).length);
    (convs || []).forEach(c => console.log(`  ${c.id}: ${c.title}`));

    // Also try searching for other keywords
    const msgs2 = await prisma.$queryRaw`
      SELECT id, content FROM Message WHERE LOWER(content) LIKE '%photosynthesis%' OR LOWER(content) LIKE '%bubble sort%' OR LOWER(content) LIKE '%useEffect%' LIMIT 20
    `;
    console.log("\nOther messages:", (msgs2 || []).length);
  } catch (e) {
    console.error("Raw query error:", e.message);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

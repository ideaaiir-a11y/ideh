const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const convs = await prisma.conversation.findMany({
    select: { id: true, title: true },
  });
  console.log("All conversations:");
  convs.forEach(c => console.log(`  ${c.id}: ${c.title}`));
  
  const msgs = await prisma.message.findMany({
    where: { content: { contains: "Ocean" } },
    select: { id: true, content: true, role: true },
    take: 20,
  });
  console.log("\nMessages with Ocean:", msgs.length);
  msgs.forEach(m => console.log(`  ${m.id} (${m.role}): ${m.content.substring(0, 100)}`));
  
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

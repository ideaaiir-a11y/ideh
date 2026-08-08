const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const msgs = await prisma.message.findMany({
    where: { 
      OR: [
        { content: { contains: "Ocean" } },
        { content: { contains: "endless" } },
        { content: { contains: "blue" } },
      ]
    },
    select: { id: true, content: true, role: true },
  });
  console.log(JSON.stringify(msgs, null, 2));
  
  const convs = await prisma.conversation.findMany({
    where: { 
      OR: [
        { title: { contains: "Ocean" } },
        { title: { contains: "endless" } },
        { title: { contains: "blue" } },
      ]
    },
    select: { id: true, title: true },
  });
  console.log("Conversations:", JSON.stringify(convs, null, 2));
  
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

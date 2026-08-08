const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Update conversation titles
  const convs = await prisma.conversation.findMany({
    where: { title: { contains: "Ocean" } },
    select: { id: true, title: true },
  });
  console.log("Found conversations:", JSON.stringify(convs, null, 2));

  for (const conv of convs) {
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { title: conv.title.replace(/Ocean's endless blue/gi, "آبی بی‌پایان اقیانوس") },
    });
    console.log("Updated conversation:", conv.id);
  }

  // Update messages
  const msgs = await prisma.message.findMany({
    where: { content: { contains: "Ocean" } },
    select: { id: true, content: true },
  });
  console.log("Found messages:", msgs.length);

  for (const msg of msgs) {
    await prisma.message.update({
      where: { id: msg.id },
      data: { content: msg.content.replace(/Ocean's endless blue/gi, "آبی بی‌پایان اقیانوس") },
    });
    console.log("Updated message:", msg.id);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

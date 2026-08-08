const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Try raw query to find the text
  const results = await prisma.$queryRaw`
    SELECT id, conversationId, role, content FROM Message WHERE content LIKE '%Ocean%'
  `;
  console.log("Raw query results:", JSON.stringify(results, null, 2));
  
  const convResults = await prisma.$queryRaw`
    SELECT id, title FROM Conversation WHERE title LIKE '%Ocean%'
  `;
  console.log("Conversation results:", JSON.stringify(convResults, null, 2));
  
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

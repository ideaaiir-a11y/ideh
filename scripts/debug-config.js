const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const fs = require("fs");
  const path = require("path");

  const candidates = [
    path.join(process.cwd(), ".hosh-no-remote.json"),
    path.join(__dirname, ".hosh-no-remote.json"),
    path.join(__dirname, "../../.hosh-no-remote.json"),
  ];

  console.log("Current working directory:", process.cwd());
  console.log("Looking for .hosh-no-remote.json in:");
  
  for (const p of candidates) {
    const exists = fs.existsSync(p);
    console.log(`  ${p} -> exists: ${exists}`);
    if (exists) {
      const content = fs.readFileSync(p, "utf8");
      const parsed = JSON.parse(content);
      console.log(`    apiKey: ${parsed.apiKey}`);
      console.log(`    enabled: ${parsed.enabled}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

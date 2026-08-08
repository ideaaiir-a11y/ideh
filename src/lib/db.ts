import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Check if running on Cloudflare Workers with D1 binding
  const d1 = (globalThis as any).DB
  if (d1) {
    const adapter = new PrismaD1(d1)
    return new PrismaClient({ adapter })
  }
  
  // Local development with SQLite
  return new PrismaClient({
    log: ['query'],
  })
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('\n❌ ERROR: DATABASE_URL is not defined in .env file')
  throw new Error('DATABASE_URL is not defined')
}

if (connectionString.includes('user:password@host')) {
  console.error('\n❌ ERROR: DATABASE_URL is still a placeholder!')
  throw new Error('DATABASE_URL is not configured')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

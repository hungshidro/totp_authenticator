import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('\n❌ ERROR: DATABASE_URL is not defined in .env file')
  console.log('\n📖 Quick setup:')
  console.log('   1. Go to https://neon.tech')
  console.log('   2. Create free database')
  console.log('   3. Copy connection string to .env')
  console.log('\n📚 Read LOCAL-SETUP.md for detailed instructions\n')
  throw new Error('DATABASE_URL is not defined')
}

if (connectionString.includes('user:password@host')) {
  console.error('\n❌ ERROR: DATABASE_URL is still a placeholder!')
  console.log('\n⚠️  Please replace it with a real PostgreSQL connection string')
  console.log('📖 Read LOCAL-SETUP.md for setup instructions\n')
  throw new Error('DATABASE_URL is not configured')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

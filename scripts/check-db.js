#!/usr/bin/env node

/**
 * Check if DATABASE_URL is configured properly
 */

require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL

console.log('🔍 Checking database connection...\n')

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env file')
  console.log('\n📖 Read LOCAL-SETUP.md for setup instructions')
  process.exit(1)
}

if (connectionString.includes('user:password@host')) {
  console.error('❌ ERROR: DATABASE_URL is still a placeholder!')
  console.log('\n⚠️  You need to replace it with a real PostgreSQL connection string')
  console.log('\n📖 Quick setup (2 minutes):')
  console.log('   1. Go to https://neon.tech')
  console.log('   2. Sign up with GitHub')
  console.log('   3. Create project → Copy connection string')
  console.log('   4. Update .env file')
  console.log('\n📖 Or read LOCAL-SETUP.md for more options')
  process.exit(1)
}

if (!connectionString.startsWith('postgresql://')) {
  console.error('❌ ERROR: DATABASE_URL must be a PostgreSQL connection string')
  console.log('   Format: postgresql://user:password@host:5432/database?sslmode=require')
  process.exit(1)
}

// Try to connect
async function checkConnection() {
  const pool = new Pool({ connectionString })
  
  try {
    const client = await pool.connect()
    console.log('✅ Database connection successful!')
    console.log('   Host:', client.host)
    console.log('   Database:', client.database)
    console.log('   User:', client.user)
    
    client.release()
    await pool.end()
    
    console.log('\n✅ Your database is ready to use!')
    console.log('\n📝 Next steps:')
    console.log('   1. Run migrations: npx prisma migrate deploy')
    console.log('   2. Start dev server: npm run dev')
    
  } catch (error) {
    console.error('❌ Cannot connect to database!')
    console.error('   Error:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('   - Check if connection string is correct')
    console.log('   - Verify database is running')
    console.log('   - Check firewall/network settings')
    console.log('\n📖 Read LOCAL-SETUP.md for help')
    
    await pool.end()
    process.exit(1)
  }
}

checkConnection()

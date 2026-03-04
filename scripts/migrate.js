#!/usr/bin/env node

/**
 * Manual migration runner for Prisma 7
 * Since Prisma 7 CLI doesn't support migrations yet with the new config
 */

require('dotenv').config();
const pg = require('pg');

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL not found')
  process.exit(1)
}

const migrationSQL = `
-- CreateTable
CREATE TABLE IF NOT EXISTS "TOTPSecret" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "secret" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL DEFAULT '',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TOTPSecret_token_key" ON "TOTPSecret"("token");

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='TOTPSecret' AND column_name='deviceId') THEN
        ALTER TABLE "TOTPSecret" ADD COLUMN "deviceId" TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='TOTPSecret' AND column_name='isPublic') THEN
        ALTER TABLE "TOTPSecret" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;
`

async function runMigration() {
  const pool = new Pool({ connectionString })
  
  try {
    console.log('🔄 Running database migration...\n')
    
    await pool.query(migrationSQL)
    
    console.log('✅ Migration completed successfully!')
    console.log('   Table "TOTPSecret" created')
    console.log('   Unique index on "token" created')
    console.log('\n📝 Next step: npm run dev')
    
    await pool.end()
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    await pool.end()
    process.exit(1)
  }
}

runMigration()

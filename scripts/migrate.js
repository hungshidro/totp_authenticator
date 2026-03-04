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
-- CreateTable TOTPSecret
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

-- CreateTable DeviceAccess
CREATE TABLE IF NOT EXISTS "DeviceAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isSaved" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "firstAccess" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccess" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TOTPSecret_token_key" ON "TOTPSecret"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "DeviceAccess_token_deviceId_key" ON "DeviceAccess"("token", "deviceId");
CREATE INDEX IF NOT EXISTS "DeviceAccess_token_idx" ON "DeviceAccess"("token");
CREATE INDEX IF NOT EXISTS "DeviceAccess_deviceId_idx" ON "DeviceAccess"("deviceId");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'DeviceAccess_token_fkey'
    ) THEN
        ALTER TABLE "DeviceAccess" ADD CONSTRAINT "DeviceAccess_token_fkey" 
        FOREIGN KEY ("token") REFERENCES "TOTPSecret"("token") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add columns to TOTPSecret if they don't exist (for existing tables)
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
    console.log('   Table "DeviceAccess" created')
    console.log('   Indexes and foreign keys created')
    console.log('\n📝 Next step: npm run dev')
    
    await pool.end()
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    await pool.end()
    process.exit(1)
  }
}

runMigration()

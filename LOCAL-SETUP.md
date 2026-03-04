# Quick Setup for Local Development

## Prisma 7 requires PostgreSQL

Due to upgrade to Prisma 7, SQLite is no longer supported. You need to setup a PostgreSQL database.

### Fastest Way (2 minutes):

#### 1. Create database on Neon

```bash
# Open browser:
https://neon.tech

# Steps:
1. Sign up with GitHub (1 click)
2. Create new project
3. Copy connection string
```

#### 2. Update .env

Paste connection string into `.env` file:

```env
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

#### 3. Run migration

```bash
npx prisma migrate deploy
```

#### 4. Restart dev server

```bash
npm run dev
```

Done! Everything should work.

---

## Other Options:

### Option 2: Local PostgreSQL (More complex)

**macOS:**
```bash
# Install PostgreSQL
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb totp_dev

# Update .env
DATABASE_URL="postgresql://$(whoami)@localhost:5432/totp_dev"

# Run migration
npx prisma migrate deploy
```

**Windows:**
- Download PostgreSQL from postgresql.org
- Install and setup
- Create database `totp_dev`
- Update .env

### Option 3: Docker (For developers)

```bash
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: totp
      POSTGRES_PASSWORD: totp123
      POSTGRES_DB: totp_dev
    ports:
      - "5432:5432"

# Start
docker-compose up -d

# .env
DATABASE_URL="postgresql://totp:totp123@localhost:5432/totp_dev"

# Migrate
npx prisma migrate deploy
```

---

## If you want to revert to Prisma 5 with SQLite

If you find PostgreSQL too complex for local dev:

```bash
# Downgrade Prisma
npm uninstall @prisma/adapter-pg @prisma/client prisma pg
npm install prisma@5.22.0 --save-dev
npm install @prisma/client@5.22.0

# Remove Prisma 7 config
rm prisma/prisma.config.ts

# Update schema.prisma
# Add back: url = env("DATABASE_URL")

# Update .env
DATABASE_URL="file:./dev.db"

# Update lib/prisma.ts (remove adapter code)

# Migrate
npx prisma migrate dev
```

## Troubleshooting

### Error: "Can't reach database server"
→ DATABASE_URL in .env is incorrect or database not setup

### Error: "Table does not exist"  
→ Migration not run yet:
```bash
npx prisma migrate deploy
```

### Error: "Connection refused"
→ PostgreSQL not started (if using local)

---

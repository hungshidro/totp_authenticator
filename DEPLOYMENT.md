# Deployment Guide for Vercel

## Step 1: Create PostgreSQL Database

### Option 1: Neon (Recommended)
1. Visit https://neon.tech
2. Sign up (use GitHub)
3. Create new project
4. Copy **Connection String** (format: `postgresql://user:password@host/database?sslmode=require`)

### Option 2: Supabase
1. Visit https://supabase.com
2. Sign up
3. Create new project
4. Go to Settings → Database → Copy **Connection String** (URI)

### Option 3: Railway
1. Visit https://railway.app
2. Sign up
3. New Project → Provision PostgreSQL
4. Copy **DATABASE_URL**

## Step 2: Update Prisma Schema

File `prisma/schema.prisma` is already configured:

```prisma
datasource db {
  provider = "postgresql"
}
```

File `prisma/prisma.config.ts` contains connection URL:

```typescript
import { defineConfig } from '@prisma/client/config'

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

## Step 3: Create .env.production file (Local testing)

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

## Step 4: Test migration with PostgreSQL (Local)

```bash
# Set DATABASE_URL temporarily
export DATABASE_URL="postgresql://your-connection-string"

# Run migration
npx prisma migrate deploy

# Test locally
npm run dev
```

## Step 5: Deploy to Vercel

### Method 1: Deploy via GitHub

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Visit https://vercel.com
   - Sign up with GitHub
   - Click "Add New" → "Project"
   - Import your repository
   - Click "Deploy"

3. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add:
     - Key: `DATABASE_URL`
     - Value: `postgresql://your-connection-string`
   - Click "Save"

4. **Redeploy:**
   - Go to Deployments → Click "..." → "Redeploy"

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variable
vercel env add DATABASE_URL

# Paste connection string and choose Production

# Redeploy
vercel --prod
```

## Step 6: Run Database Migration on Production

Vercel will **automatically run migration** during build via `vercel.json`:

```json
{
  "buildCommand": "npm install && prisma generate && node scripts/migrate.js && next build"
}
```

If you need to run manually:

```bash
# Local
npm run migrate

# Or with DATABASE_URL directly
DATABASE_URL="your-connection-string" npm run migrate
```

## Step 7: Verification

1. Open the URL provided by Vercel (e.g., `https://your-app.vercel.app`)
2. Try creating a new TOTP
3. Check if OTP works

## Done!

Your app is now live at: `https://your-app.vercel.app`

### Error: "Cannot find module @prisma/client"
```bash
# Add to package.json (already included)
"scripts": {
  "postinstall": "prisma generate"
}
```

### Error: "The datasource property `url` is no longer supported"
**Solution:** This project has resolved this issue by:
- Keeping `url` in schema.prisma (CLI tools need it)
- Using adapter pattern at runtime (lib/prisma.ts)
- Using custom migration script instead of prisma migrate

### Database connection error
- Check `DATABASE_URL` in Vercel environment variables
- Ensure `?sslmode=require` is at the end of connection string
- Check IP whitelist on database provider (Neon/Supabase)

### OTP not generating
- Check logs on Vercel Dashboard
- Go to Functions → Select API route → View logs

## Advanced

After successful deployment, you can:

1. **Add Custom Domain:**
   - Vercel Dashboard → Settings → Domains
   - Add your domain

2. **Add Analytics:**
   - Vercel has integrated Analytics

3. **Setup CI/CD:**
   - Already automated with GitHub integration

4. **Monitor Performance:**
   - Vercel Dashboard → Analytics → Web Vitals

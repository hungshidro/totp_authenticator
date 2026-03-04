# Deployment Checklist - Prisma 7

## Pre-Deployment

### 1. Database Setup
- [ ] Create PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com)
- [ ] Copy connection string
- [ ] Test connection locally:
  ```bash
  export DATABASE_URL="postgresql://..."
  npx prisma db pull
  ```

### 2. Dependencies Check
```bash
# Verify Prisma 7 installed
npx prisma --version
# Should show: prisma: 7.x.x
```

Required packages:
- `@prisma/client@^7.4.2`
- `@prisma/adapter-pg@^7.4.2`
- `pg@^8.19.0`
- `prisma@^7.4.2` (devDependency)

### 3. Config Files Check
- `prisma/schema.prisma` - NO `url` property in datasource
- `prisma/prisma.config.ts` - Contains DATABASE_URL config
- `lib/prisma.ts` - Uses PrismaPg adapter
- `vercel.json` - Build command includes prisma generate
- `.env.example` - Template for DATABASE_URL

## Deployment Steps (Vercel)

### Option A: Via GitHub (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment with Prisma 7"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Import your repository
   - Framework: Next.js (auto-detected)

3. **Add Environment Variable:**
   - Key: `DATABASE_URL`
   - Value: `postgresql://user:password@host:5432/db?sslmode=require`
   - Scope: Production, Preview, Development

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Done!

### Option B: Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variable
vercel env add DATABASE_URL

# Production deployment
vercel --prod
```

## Post-Deployment Checks

### 1. Verify Build Logs
Check that these steps succeeded:
- `npm install` - Installed dependencies
- `prisma generate` - Generated Prisma Client
- `node scripts/migrate.js` - Applied migrations (custom script)
- `next build` - Built Next.js app

### 2. Test App
- [ ] Visit deployed URL
- [ ] Try adding a TOTP account
- [ ] Verify OTP generation works
- [ ] Test save/remove from device

### 3. Check Database
```bash
# Connect to production DB
export DATABASE_URL="your-production-url"
npx prisma studio
```

Verify:
- [ ] `TOTPSecret` table exists
- [ ] Can insert records
- [ ] Data persists

## Troubleshooting

### Error: "Cannot find @prisma/client"
**Fix:** Ensure `postinstall` script in package.json:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Error: "PrismaPg is not defined"
**Fix:** Install adapter:
```bash
npm install @prisma/adapter-pg pg
```

### Error: "Connection refused"
**Fix:** Check DATABASE_URL:
- Has `?sslmode=require` at the end
- Correct username/password
- Database is not paused (tier limitation)
- IP whitelist allows all (0.0.0.0/0)

### Error: "Table TOTPSecret does not exist"
**Fix:** Run migrations:
```bash
# Vercel runs migrations automatically during build via vercel.json
# If needed, run manually:
export DATABASE_URL="..."
npm run migrate
```

### Error: "The datasource property `url` is no longer supported"
**Fix:** Already handled! Project uses:
- `url` in schema.prisma for CLI compatibility
- Custom migration script instead of prisma migrate
- Adapter pattern in runtime (lib/prisma.ts)
This is a known Prisma 7 limitation we've worked around.

### App deployed but shows 500 error
**Fix:** Check Vercel logs:
1. Go to Vercel Dashboard
2. Click your project
3. Go to "Functions" or "Logs"
4. Look for error messages
5. Most common: DATABASE_URL not set or invalid

### Code Updates
```bash
# 1. Make changes locally
# 2. Update migration script if needed (scripts/migrate.js)
# 3. Test locally
npm run migrate

# 4. Push to git
git add prisma/ scripts/
git commit -m "feat: update schema"
git push

# 5. Vercel deploys and runs migrations automatically
```

### Schema Changes
```bash
# 1. Update schema.prisma
# 2. Create migration
npx prisma migrate dev --name describe_change

# 3. Push to git
git add prisma/migrations
git commit -m "feat: add new field"
git push

# 4. Vercel deploys and runs migrations automatically
```

### Rollback
If deployment fails:
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

## Success Criteria

Your deployment is successful when:
- App accessible via HTTPS URL
- Can create new TOTP accounts
- OTP codes generate every 30s
- Save/remove from device works
- Data persists across refreshes
- No console errors
- Database connection stable

## You're Live!

Share your app:
- Production URL: `https://your-app.vercel.app`
- Custom domain: Add in Vercel settings

---

**Need help?** Check:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full guide
- [Vercel Docs](https://vercel.com/docs)
- [Prisma 7 Docs](https://www.prisma.io/docs)

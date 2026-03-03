# Hướng dẫn Deploy lên Vercel (Miễn phí)

## Bước 1: Tạo Database PostgreSQL miễn phí

### Lựa chọn 1: Neon (Khuyên dùng)
1. Truy cập https://neon.tech
2. Sign up miễn phí (dùng GitHub)
3. Create new project
4. Copy **Connection String** (format: `postgresql://user:password@host/database?sslmode=require`)

### Lựa chọn 2: Supabase
1. Truy cập https://supabase.com
2. Sign up miễn phí
3. Create new project
4. Vào Settings → Database → Copy **Connection String** (URI)

### Lựa chọn 3: Railway
1. Truy cập https://railway.app
2. Sign up miễn phí
3. New Project → Provision PostgreSQL
4. Copy **DATABASE_URL**

## Bước 2: Cập nhật Prisma Schema

⚠️ **Lưu ý:** Prisma 7 không cần `url` trong schema.prisma nữa!

File `prisma/schema.prisma` đã được cấu hình đúng:

```prisma
datasource db {
  provider = "postgresql"
  // Không có url property - được config trong prisma.config.ts
}
```

File `prisma/prisma.config.ts` chứa connection URL:

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

## Bước 3: Tạo file .env.production (Local testing)

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

⚠️ **Không commit file này lên Git!**

## Bước 4: Test migration với PostgreSQL (Local)

```bash
# Set DATABASE_URL tạm thời
export DATABASE_URL="postgresql://your-connection-string"

# Chạy migration
npx prisma migrate deploy

# Test local
npm run dev
```

## Bước 5: Deploy lên Vercel

### Cách 1: Deploy qua GitHub (Khuyên dùng)

1. **Push code lên GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```

2. **Deploy trên Vercel:**
   - Truy cập https://vercel.com
   - Sign up bằng GitHub
   - Click "Add New" → "Project"
   - Import repository của bạn
   - Click "Deploy"

3. **Thêm Environment Variables:**
   - Vào Project Settings → Environment Variables
   - Thêm:
     - Key: `DATABASE_URL`
     - Value: `postgresql://your-connection-string`
   - Click "Save"

4. **Redeploy:**
   - Vào Deployments → Click "..." → "Redeploy"

### Cách 2: Deploy qua Vercel CLI

```bash
# Cài Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Thêm environment variable
vercel env add DATABASE_URL

# Paste connection string và chọn Production

# Redeploy
vercel --prod
```

## Bước 6: Chạy Database Migration trên Production

Vercel sẽ **tự động chạy migration** khi build thông qua `vercel.json`:

```json
{
  "buildCommand": "npm install && prisma generate && node scripts/migrate.js && next build"
}
```

Nếu cần chạy manual:

```bash
# Local
npm run migrate

# Hoặc với DATABASE_URL trực tiếp
DATABASE_URL="your-connection-string" npm run migrate
```

## Bước 7: Kiểm tra

1. Mở URL Vercel cung cấp (vd: `https://your-app.vercel.app`)
2. Thử tạo một TOTP mới
3. Kiểm tra OTP có hoạt động không

## Hoàn thành!

App của bạn đã live tại: `https://your-app.vercel.app`

## Lưu ý

- **Miễn phí hoàn toàn:** Vercel Free tier + Neon Free tier
- **Giới hạn Free:**
  - Vercel: 100 GB bandwidth/tháng, 100 deployments/ngày
  - Neon: 1 project, 10 GB storage
  - Supabase: 2 projects, 500 MB database
- **Custom Domain:** Có thể thêm domain riêng miễn phí trên Vercel
- **Auto Deploy:** Mỗi khi push code lên GitHub, Vercel tự động deploy

## 🔧 Troubleshooting

### Lỗi: "Cannot find module @prisma/client"
```bash
# Thêm vào package.json (đã có sẵn)
"scripts": {
  "postinstall": "prisma generate"
}
```

### Lỗi: "The datasource property `url` is no longer supported"
**Giải pháp:** Project này đã giải quyết issue này bằng cách:
- Giữ `url` trong schema.prisma (CLI tools cần)
- Dùng adapter pattern trong runtime (lib/prisma.ts)
- Dùng custom migration script thay vì prisma migrate

### Lỗi database connection
- Kiểm tra `DATABASE_URL` trong Vercel environment variables
- Đảm bảo có `?sslmode=require` ở cuối connection string
- Kiểm tra IP whitelist trên database provider (Neon/Supabase)

### OTP không generate
- Check logs trên Vercel Dashboard
- Vào Functions → Chọn API route → Xem logs

## Nâng cao

Sau khi deploy thành công, bạn có thể:

1. **Thêm Custom Domain:**
   - Vercel Dashboard → Settings → Domains
   - Thêm domain của bạn

2. **Thêm Analytics:**
   - Vercel tích hợp Analytics miễn phí

3. **Setup CI/CD:**
   - Đã tự động với GitHub integration

4. **Monitor Performance:**
   - Vercel Dashboard → Analytics → Web Vitals

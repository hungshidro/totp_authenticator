# Quick Setup for Local Development

## Prisma 7 cần PostgreSQL để chạy

Vì upgrade lên Prisma 7, không thể dùng SQLite nữa. Bạn cần setup PostgreSQL database.

### ⚡ Cách nhanh nhất (2 phút):

#### 1. Tạo database miễn phí trên Neon

```bash
# Mở trình duyệt:
https://neon.tech

# Các bước:
1. Sign up với GitHub (1 click)
2. Create new project
3. Copy connection string
```

#### 2. Cập nhật .env

Paste connection string vào file `.env`:

```env
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

#### 3. Chạy migration

```bash
npx prisma migrate deploy
```

#### 4. Khởi động lại dev server

```bash
npm run dev
```

Done! Mọi thứ sẽ hoạt động.

---

## Các option khác:

### Option 2: PostgreSQL local (Phức tạp hơn)

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
- Download PostgreSQL từ postgresql.org
- Install và setup
- Tạo database `totp_dev`
- Update .env

### Option 3: Docker (Cho developers)

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

## ⚠️ Nếu muốn quay lại Prisma 5 với SQLite

Nếu bạn thấy PostgreSQL phức tạp cho local dev:

```bash
# Downgrade Prisma
npm uninstall @prisma/adapter-pg @prisma/client prisma pg
npm install prisma@5.22.0 --save-dev
npm install @prisma/client@5.22.0

# Xóa config Prisma 7
rm prisma/prisma.config.ts

# Update schema.prisma
# Thêm lại: url = env("DATABASE_URL")

# Update .env
DATABASE_URL="file:./dev.db"

# Update lib/prisma.ts (xóa adapter code)

# Migrate
npx prisma migrate dev
```

---

## Khuyến nghị

**Dùng Neon** - Lý do:
- ✅ Free forever
- ✅ Setup 2 phút
- ✅ Giống production
- ✅ Không cần install gì
- ✅ Backup tự động
- ✅ Có thể dùng ở bất kỳ đâu (không bind với localhost)

---

## Troubleshooting

### Lỗi: "Can't reach database server"
→ DATABASE_URL trong .env chưa đúng hoặc chưa setup database

### Lỗi: "Table does not exist"  
→ Chưa chạy migration:
```bash
npx prisma migrate deploy
```

### Lỗi: "Connection refused"
→ PostgreSQL chưa start (nếu dùng local)

---

**Cần giúp?** Hãy chọn Neon - đơn giản nhất! 🚀

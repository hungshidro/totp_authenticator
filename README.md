# TOTP Authenticator

Web-based TOTP Authenticator tương tự Microsoft Authenticator, xây dựng với Next.js 14, Prisma 7, và PostgreSQL.

## ⚠️ Quan trọng: Prisma 7 yêu cầu PostgreSQL

Project này sử dụng **Prisma 7** - cần PostgreSQL database (không support SQLite).

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd authen_totp
npm install
```

### 2. Setup Database (2 phút)

**Option A: Neon (Miễn phí - Khuyên dùng):**

```bash
# 1. Truy cập https://neon.tech
# 2. Sign up với GitHub
# 3. Create project → Copy connection string
# 4. Tạo file .env:

DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"
```

**Option B: PostgreSQL local:**

Xem hướng dẫn chi tiết tại [LOCAL-SETUP.md](./LOCAL-SETUP.md)

### 3. Check Connection

```bash
npm run check-db
```

### 4. Run Migrations

```bash
npx prisma migrate deploy
```

### 5. Start Dev Server

```bash
npm run dev
```

Mở http://localhost:3000

## 🚀 Deploy lên Server Public (Miễn phí)

**Xem hướng dẫn chi tiết tại: [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Quick Deploy:
1. Tạo database PostgreSQL miễn phí tại [Neon.tech](https://neon.tech)
2. Push code lên GitHub
3. Deploy tại [Vercel.com](https://vercel.com)
4. Thêm `DATABASE_URL` vào Environment Variables
5. Redeploy

## Tính năng

- ✅ Nhập OTP URI từ QR code hoặc text
- ✅ Nhập thủ công secret key
- ✅ Tạo link unique cho mỗi tài khoản
- ✅ Hiển thị OTP code tự động refresh mỗi 30 giây
- ✅ Countdown timer cho OTP
- ✅ Copy OTP với 1 click
- ✅ Lưu trữ an toàn trong database

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Tạo database và chạy migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

## Chạy ứng dụng

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Mở trình duyệt tại `http://localhost:3000`

## Cấu trúc Database

```prisma
model TOTPSecret {
  id        String   @id @default(cuid())
  token     String   @unique  // Token unique để access OTP
  name      String            // Tên tài khoản
  issuer    String?           // Issuer (Google, Microsoft, etc.)
  secret    String            // Secret key (base32)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## API Endpoints

### POST /api/totp
Tạo TOTP secret mới

**Request body (URI mode):**
```json
{
  "uri": "otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example"
}
```

**Request body (Manual mode):**
```json
{
  "name": "user@example.com",
  "issuer": "Google",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

**Response:**
```json
{
  "success": true,
  "token": "abc123xyz456",
  "url": "/otp/abc123xyz456"
}
```

### GET /api/totp/[token]
Lấy OTP code hiện tại

**Response:**
```json
{
  "code": "123456",
  "timeRemaining": 25,
  "name": "user@example.com",
  "issuer": "Google"
}
```

## Sử dụng

1. **Thêm tài khoản mới:**
   - Chọn "QR Code / URI" và paste chuỗi otpauth://
   - Hoặc chọn "Nhập thủ công" và nhập Name + Secret Key

2. **Xem OTP:**
   - Sau khi tạo, hệ thống sẽ tạo link unique: `/otp/{token}`
   - Mã OTP sẽ tự động refresh mỗi 30 giây
   - Click "Sao chép mã" để copy OTP

3. **Lưu link:**
   - Mỗi tài khoản có 1 link riêng
   - Bookmark link để truy cập nhanh

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite + Prisma ORM
- **TOTP:** otpauth library
- **UI:** Tailwind CSS
- **TypeScript:** Type-safe development

## Scripts hữu ích

```bash
# Xem database với Prisma Studio
npm run prisma:studio

# Reset database
npx prisma migrate reset

# Tạo migration mới
npx prisma migrate dev --name <migration-name>
```

## Bảo mật

⚠️ **Lưu ý quan trọng:**
- Project này dùng SQLite nên chỉ phù hợp cho development/personal use
- Với production, nên:
  - Chuyển sang PostgreSQL hoặc MySQL
  - Thêm authentication (NextAuth.js)
  - Encrypt secrets trong database
  - Sử dụng HTTPS
  - Rate limiting cho API

## License

MIT
# totp_authenticator

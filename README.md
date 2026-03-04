# TOTP Authenticator

Web-based TOTP Authenticator similar to Microsoft Authenticator, built with Next.js 14, Prisma 7, and PostgreSQL.

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd authen_totp
npm install
```

### 2. Setup Database

**Option A: Neon:**

```bash
# 1. Visit https://neon.tech
# 2. Sign up with GitHub
# 3. Create project → Copy connection string
# 4. Create .env file:

DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"
```

**Option B: Local PostgreSQL:**

See detailed guide at [LOCAL-SETUP.md](./LOCAL-SETUP.md)

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

Open http://localhost:3000

## Deploy to Public Server

**See detailed guide at: [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Quick Deploy:
1. Create free PostgreSQL database at [Neon.tech](https://neon.tech)
2. Push code to GitHub
3. Deploy at [Vercel.com](https://vercel.com)
4. Add `DATABASE_URL` to Environment Variables
5. Redeploy

## Features

- Import OTP URI from QR code or text
- Manual secret key input
- Generate unique link for each account
- Display OTP code with auto-refresh every 30 seconds
- Countdown timer for OTP
- Copy OTP with 1 click
- Secure storage in database
- Device-based access control
- Public/private link sharing
- QR code scanning with camera

## Installation

```bash
# Install dependencies
npm install

# Create database and run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

## Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Open browser at `http://localhost:3000`

## Database Structure

```prisma
model TOTPSecret {
  id        String   @id @default(cuid())
  token     String   @unique  // Unique token to access OTP
  name      String            // Account name
  issuer    String?           // Issuer (Google, Microsoft, etc.)
  secret    String            // Secret key (base32)
  deviceId  String            // Device fingerprint
  isPublic  Boolean  @default(false) // Public access flag
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## API Endpoints

### POST /api/totp
Create new TOTP secret

**Request body (URI mode):**
```json
{
  "uri": "otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example",
  "deviceId": "device-fingerprint-id"
}
```

**Request body (Manual mode):**
```json
{
  "name": "user@example.com",
  "issuer": "Google",
  "secret": "JBSWY3DPEHPK3PXP",
  "deviceId": "device-fingerprint-id"
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
Get current OTP code

**Headers:**
```
x-device-id: device-fingerprint-id
```

**Response:**
```json
{
  "code": "123456",
  "timeRemaining": 25,
  "name": "user@example.com",
  "issuer": "Google",
  "isOwner": true,
  "isPublic": false
}
```

### PATCH /api/totp/[token]
Update OTP settings (owner only)

**Request body:**
```json
{
  "isPublic": true
}
```

## Usage

1. **Add New Account:**
   - Choose "Upload QR" and scan/upload QR code image
   - Or choose "QR Text" and paste otpauth:// string
   - Or choose "Manual" and enter Name + Secret Key

2. **View OTP:**
   - After creation, system generates unique link: `/otp/{token}`
   - OTP code auto-refreshes every 30 seconds
   - Click "Copy code" to copy OTP

3. **Save Link:**
   - Each account has unique link
   - Bookmark link for quick access

4. **Device Access Control:**
   - By default, only the device that created the token can access it
   - Owner can toggle public access to share with other devices

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **TOTP:** otpauth library
- **QR Scanning:** html5-qrcode library
- **Device ID:** FingerprintJS
- **UI:** Tailwind CSS
- **TypeScript:** Type-safe development

## Useful Scripts

```bash
# View database with Prisma Studio
npm run prisma:studio

# Reset database
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name <migration-name>

# Check database connection
npm run check-db

# Run custom migration
npm run migrate
```

## Security

**Important Notes:**
- Project uses device fingerprinting for access control
- For production use:
  - Use PostgreSQL or MySQL
  - Add authentication (NextAuth.js)
  - Encrypt secrets in database
  - Use HTTPS
  - Rate limiting for API
  - Regular security audits

## License

MIT

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TOTP } from 'otpauth'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Lấy secret từ database
    const totpRecord = await prisma.tOTPSecret.findUnique({
      where: { token },
    })

    if (!totpRecord) {
      return NextResponse.json({ error: 'Token không tồn tại' }, { status: 404 })
    }

    // Tạo TOTP instance
    const totp = new TOTP({
      issuer: totpRecord.issuer || undefined,
      label: totpRecord.name,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: totpRecord.secret,
    })

    // Generate OTP code
    const code = totp.generate()

    // Tính thời gian còn lại đến khi OTP expire
    const now = Date.now()
    const epoch = Math.floor(now / 1000)
    const timeRemaining = 30 - (epoch % 30)

    return NextResponse.json({
      code,
      timeRemaining,
      name: totpRecord.name,
      issuer: totpRecord.issuer,
    })
  } catch (error) {
    console.error('Error generating OTP:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

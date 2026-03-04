import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TOTP, URI } from 'otpauth'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uri, name, issuer, deviceId } = body

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }

    let secret: string
    let accountName: string
    let issuerName: string | undefined

    if (uri) {
      // Parse OTP URI từ QR code hoặc text
      // Format: otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example
      try {
        const parsedUri = URI.parse(uri)
        secret = parsedUri.secret.base32
        accountName = parsedUri.label
        issuerName = parsedUri.issuer
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid OTP URI format' },
          { status: 400 }
        )
      }
    } else if (name && body.secret) {
      // Nhập thủ công
      secret = body.secret
      accountName = name
      issuerName = issuer
    } else {
      return NextResponse.json(
        { error: 'Cần cung cấp URI hoặc name + secret' },
        { status: 400 }
      )
    }

    // Tạo unique token để access
    const token = nanoid(16)

    // Lưu vào database
    const totpRecord = await prisma.tOTPSecret.create({
      data: {
        token,
        name: accountName,
        issuer: issuerName,
        secret,
        deviceId,
        isPublic: false, // Mặc định là private
      },
    })

    return NextResponse.json({
      success: true,
      token,
      url: `/otp/${token}`,
    })
  } catch (error) {
    console.error('Error creating TOTP:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

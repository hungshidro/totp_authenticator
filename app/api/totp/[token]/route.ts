import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TOTP } from 'otpauth'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    
    const deviceId = request.headers.get('x-device-id')

    const totpRecord = await prisma.tOTPSecret.findUnique({
      where: { token },
    })

    if (!totpRecord) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    const isOwner = deviceId === totpRecord.deviceId

    if (deviceId) {
      // Track device access
      const ipAddress = 
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      // Check if device is blocked
      const existingAccess = await prisma.deviceAccess.findUnique({
        where: {
          token_deviceId: {
            token,
            deviceId,
          },
        },
      });

      if (existingAccess?.isBlocked) {
        return NextResponse.json(
          { error: 'This device has been blocked from accessing this link' },
          { status: 403 }
        );
      }

      // Create or update device access record
      await prisma.deviceAccess.upsert({
        where: {
          token_deviceId: {
            token,
            deviceId,
          },
        },
        update: {
          lastAccess: new Date(),
          ipAddress,
          userAgent,
        },
        create: {
          token,
          deviceId,
          ipAddress,
          userAgent,
        },
      });
    }

    // Check access permission
    if (!totpRecord.isPublic && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied. This account is private.' },
        { status: 403 }
      )
    }

    // Create TOTP instance
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

    // Calculate time remaining until OTP expires
    const now = Date.now()
    const epoch = Math.floor(now / 1000)
    const timeRemaining = 30 - (epoch % 30)

    return NextResponse.json({
      code,
      timeRemaining,
      name: totpRecord.name,
      issuer: totpRecord.issuer,
      isOwner,
      isPublic: totpRecord.isPublic,
    })
  } catch (error) {
    console.error('Error generating OTP:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const deviceId = request.headers.get('x-device-id')
    const body = await request.json()
    const { isPublic } = body

    // Lấy record từ database
    const totpRecord = await prisma.tOTPSecret.findUnique({
      where: { token },
    })

    if (!totpRecord) {
      return NextResponse.json({ error: 'Token không tồn tại' }, { status: 404 })
    }

    // Chỉ thiết bị chủ mới được cập nhật
    if (deviceId !== totpRecord.deviceId) {
      return NextResponse.json(
        { error: 'Chỉ thiết bị chủ mới có thể thay đổi cài đặt này' },
        { status: 403 }
      )
    }

    // Cập nhật trạng thái
    const updated = await prisma.tOTPSecret.update({
      where: { token },
      data: { isPublic },
    })

    return NextResponse.json({
      success: true,
      isPublic: updated.isPublic,
    })
  } catch (error) {
    console.error('Error updating TOTP:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

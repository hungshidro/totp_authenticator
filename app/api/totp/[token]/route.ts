import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TOTP } from 'otpauth'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    
    // Lấy deviceId từ header (sẽ được gửi từ client)
    const deviceId = request.headers.get('x-device-id')

    // Lấy secret từ database
    const totpRecord = await prisma.tOTPSecret.findUnique({
      where: { token },
    })

    if (!totpRecord) {
      return NextResponse.json({ error: 'Token không tồn tại' }, { status: 404 })
    }

    // Kiểm tra quyền truy cập
    const isOwner = deviceId === totpRecord.deviceId
    if (!totpRecord.isPublic && !isOwner) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập. Tài khoản này chỉ dành cho thiết bị chủ.' },
        { status: 403 }
      )
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
      isOwner, // Để client biết có quyền chỉnh sửa không
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

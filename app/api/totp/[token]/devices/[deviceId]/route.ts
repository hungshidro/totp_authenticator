import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string; deviceId: string } }
) {
  try {
    const { token, deviceId: targetDeviceId } = params;
    const requestDeviceId = request.headers.get("x-device-id");
    const body = await request.json();

    if (!requestDeviceId) {
      return NextResponse.json(
        { error: "Device ID required" },
        { status: 401 }
      );
    }

    const totpSecret = await prisma.tOTPSecret.findUnique({
      where: { token },
    });

    if (!totpSecret) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    if (totpSecret.deviceId !== requestDeviceId) {
      return NextResponse.json(
        { error: "Only owner can manage devices" },
        { status: 403 }
      );
    }

    if (targetDeviceId === totpSecret.deviceId) {
      return NextResponse.json(
        { error: "Cannot block owner device" },
        { status: 400 }
      );
    }

    const deviceAccess = await prisma.deviceAccess.updateMany({
      where: {
        token,
        deviceId: targetDeviceId,
      },
      data: {
        isBlocked: body.isBlocked,
      },
    });

    if (deviceAccess.count === 0) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      isBlocked: body.isBlocked,
    });
  } catch (error) {
    console.error("Error updating device:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const deviceId = request.headers.get("x-device-id");

    if (!deviceId) {
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

    if (totpSecret.deviceId !== deviceId) {
      return NextResponse.json(
        { error: "Only owner can view devices" },
        { status: 403 }
      );
    }

    const devices = await prisma.deviceAccess.findMany({
      where: { token },
      orderBy: { lastAccess: "desc" },
    });

    return NextResponse.json({
      devices: devices.map((d) => ({
        id: d.id,
        deviceId: d.deviceId,
        ipAddress: d.ipAddress,
        userAgent: d.userAgent,
        isSaved: d.isSaved,
        isBlocked: d.isBlocked,
        firstAccess: d.firstAccess,
        lastAccess: d.lastAccess,
        isOwner: d.deviceId === totpSecret.deviceId,
      })),
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

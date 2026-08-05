import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        email,
        code,
      },
      orderBy: { createdAt: "desc" }
    });

    if (!otpRecord) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
    }

    // Mark user as verified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true }
    });

    // Delete used OTP
    await prisma.oTPCode.deleteMany({
      where: { email }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

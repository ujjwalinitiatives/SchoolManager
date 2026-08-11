import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    // Rate limiting: check if an OTP for this email was created in the last 20 seconds
    const recentOtp = await prisma.oTPCode.findFirst({
      where: {
        email,
        createdAt: { gte: new Date(Date.now() - 20000) },
      },
    });

    if (recentOtp) {
      return NextResponse.json(
        { error: "Please wait before requesting a new code" },
        { status: 429 }
      );
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Wait, first delete any existing OTP for this email
    await prisma.oTPCode.deleteMany({ where: { email } });

    await prisma.oTPCode.create({
      data: {
        email,
        code: otp,
        expiresAt
      }
    });

    await sendEmail(
      email,
      "SchoolManager - Verification Code",
      `<p>Your new verification code is: <strong>${otp}</strong></p>`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

/**
 * After Better Auth creates the user, this endpoint assigns them
 * a default role (PRINCIPAL) and links them to the first available school.
 * 
 * In production, this would be replaced with an invite-based system
 * or an admin approval flow.
 */
export async function POST(request: Request) {
  try {
    const { email, schoolName, udiseCode, paymentDetails } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user already has a role and school, skip
    if (user.role && user.schoolId) {
      return NextResponse.json({ status: "already_assigned" });
    }

    // Create a new school for this Principal registration
    const school = await prisma.school.create({
      data: {
        name: schoolName || "My School",
        udiseCode: udiseCode || null,
        paymentDetails: paymentDetails || null,
        address: "Address not set",
      },
    });

    // Assign as PRINCIPAL by default (first user of a school)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "PRINCIPAL",
        schoolId: school.id,
      },
    });

    // Create a default academic session and document sequence
    const session = await prisma.academicSession.create({
      data: {
        schoolId: school.id,
        name: "2026-2027",
        startDate: new Date("2026-04-01T00:00:00Z"),
        endDate: new Date("2027-03-31T23:59:59Z"),
        isActive: true,
      }
    });

    await prisma.documentSequence.create({
      data: {
        schoolId: school.id,
        academicSessionId: session.id,
        receiptNextSequence: 1,
        invoiceNextSequence: 1,
      }
    });

    // Create default classes
    const classesData = Array.from({ length: 10 }, (_, i) => ({
      schoolId: school.id,
      name: (i + 1).toString(),
      section: "A",
      isActive: true,
    }));
    await prisma.class.createMany({ data: classesData });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB (upsert if exists)
    await prisma.oTPCode.create({
      data: {
        email: user.email,
        code: otp,
        expiresAt
      }
    });

    // Send email
    await sendEmail(
      user.email,
      "Verify your SchoolManager Account",
      `<h1>Welcome to SchoolManager!</h1><p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`
    );

    return NextResponse.json({ status: "assigned", role: "PRINCIPAL", school: school.name });
  } catch (error) {
    console.error("Role assignment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

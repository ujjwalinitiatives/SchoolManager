"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

async function requirePrincipal() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true },
  });
  if (!viewer || viewer.role !== "PRINCIPAL") return { error: "Only the Principal can perform this action." };
  return viewer;
}

export async function addStaffMember(formData: FormData) {
  const viewer = await requirePrincipal();
  if ('error' in viewer) return viewer;

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim()?.toLowerCase();
  const role = (formData.get("role") as string)?.trim();
  const className = (formData.get("className") as string)?.trim();
  const section = (formData.get("section") as string)?.trim();

  if (!name || !email || !role) {
    return { error: "Name, email, and role are required." };
  }

  if (!["TEACHER", "ACCOUNTANT", "PARENT"].includes(role)) {
    return { error: "Invalid role. Must be TEACHER, ACCOUNTANT, or PARENT." };
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (existingUser.schoolId === viewer.schoolId as string) {
      return { error: `A member with email "${email}" already exists in your school.` };
    }
    return { error: `This email is already registered in another school.` };
  }

  // Generate a temporary password
  const tempPassword = `Welcome@${crypto.randomInt(1000, 9999)}`;

  // Hash password using Better Auth's algorithm
  const { hashPassword } = await import("@better-auth/utils/password");
  const passwordHash = await hashPassword(tempPassword);

  try {
    // Create user + credential account
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role as "TEACHER" | "ACCOUNTANT" | "PARENT",
        schoolId: viewer.schoolId as string,
        emailVerified: false,
      },
    });

    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Assign class if Teacher
    if (role === "TEACHER" && className && section) {
      let cls = await prisma.class.findFirst({
        where: { schoolId: viewer.schoolId as string, name: className, section }
      });

      if (!cls) {
        cls = await prisma.class.create({
          data: {
            schoolId: viewer.schoolId as string,
            name: className,
            section,
            teacherId: user.id
          }
        });
      } else {
        await prisma.class.update({
          where: { id: cls.id },
          data: { teacherId: user.id },
        });
      }
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.oTPCode.create({
      data: {
        email,
        code: otp,
        expiresAt
      }
    });

    // Send email
    await sendEmail(
      email,
      "Welcome to SchoolManager - Verify your Account",
      `<p>You have been added as a <strong>${role}</strong> on SchoolManager.</p>
       <p>Your temporary password is: <strong>${tempPassword}</strong></p>
       <p>Before logging in, please verify your email using this 6-digit code: <strong>${otp}</strong></p>
       <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?email=${encodeURIComponent(email)}">Click here to verify your email</a></p>`
    );

    revalidatePath("/staff");
    return { tempPassword, email };
  } catch (err: any) {
    console.error("Error creating staff account:", err);
    return { error: err.message || "Failed to create staff member." };
  }
}

export async function removeStaffMember(userId: string) {
  const viewer = await requirePrincipal();
  if ('error' in viewer) return viewer;

  const user = await prisma.user.findFirst({
    where: { id: userId, schoolId: viewer.schoolId as string },
  });
  if (!user) return { error: "Staff member not found." };
  if (user.id === viewer.id) return { error: "You cannot remove yourself." };

  try {
    // Disconnect teacher from all assigned classes before deletion
    await prisma.class.updateMany({
      where: { teacherId: userId },
      data: { teacherId: null },
    });

    // Delete the user's accounts and sessions, then the user
    await prisma.account.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/staff");
  } catch (err: any) {
    console.error("Error removing staff member:", err);
    return { error: err?.message || "Failed to remove staff member." };
  }
}

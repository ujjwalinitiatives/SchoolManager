"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getNextInvoiceNumber } from "@/lib/invoice-number";
async function requirePrincipal() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true },
  });
  if (!viewer || viewer.role !== "PRINCIPAL" || !viewer.schoolId) throw new Error("Only the Principal can perform this action.");
  return { ...viewer, schoolId: viewer.schoolId };
}

export async function addStudent(formData: FormData) {
  const viewer = await requirePrincipal();

  const name = formData.get("name") as string;
  const className = formData.get("className") as string;
  const section = formData.get("section") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const studentEmail = formData.get("studentEmail") as string;
  const parentEmail = formData.get("parentEmail") as string;
  const address = formData.get("address") as string;

  if (!name || !className || !section || !studentEmail) {
    return { error: "Missing required fields" };
  }

  // Find class by name and section
  let cls = await prisma.class.findFirst({
    where: { 
      schoolId: viewer.schoolId as string,
      name: className,
      section: section,
      isActive: true
    }
  });

  if (!cls) {
    // If the class doesn't exist, create it on the fly
    cls = await prisma.class.create({
      data: {
        schoolId: viewer.schoolId as string,
        name: className,
        section: section,
      }
    });
  }

  // Ensure active session exists
  const activeSession = await prisma.academicSession.findFirst({
    where: { schoolId: viewer.schoolId as string, isActive: true }
  });
  
  if (!activeSession) {
    return { error: "No active academic session found. Please create one first." };
  }

  // Ensure fee structure exists for this class
  let feeStructure = await prisma.feeStructure.findFirst({
    where: { classId: cls.id, academicSessionId: activeSession.id },
    include: { components: true }
  });

  // If this section has no fee structure, but another section of the same class does, copy it
  if (!feeStructure || feeStructure.components.length === 0) {
    const siblingFeeStructure = await prisma.feeStructure.findFirst({
      where: {
        academicSessionId: activeSession.id,
        class: {
          schoolId: viewer.schoolId as string,
          name: className
        }
      },
      include: { components: true }
    });

    if (siblingFeeStructure && siblingFeeStructure.components.length > 0) {
      // Copy to the current class
      feeStructure = await prisma.feeStructure.create({
        data: {
          academicSessionId: activeSession.id,
          classId: cls.id,
          frequency: siblingFeeStructure.frequency,
          effectiveFrom: siblingFeeStructure.effectiveFrom,
          components: {
            create: siblingFeeStructure.components.map(c => ({
              name: c.name,
              amount: c.amount
            }))
          }
        },
        include: { components: true }
      });
    }
  }

  if (!feeStructure || feeStructure.components.length === 0) {
    return { error: `Fee structure is not set for Class ${className}. Please configure the class fees on your Dashboard before adding students.` };
  }

  // 1. Manual Admission Number
  const admissionNumber = formData.get("admissionNumber") as string;
  if (!admissionNumber) {
    return { error: "Please provide an admission number." };
  }
  const existingAdmission = await prisma.student.findUnique({
    where: { schoolId_admissionNumber: { schoolId: viewer.schoolId as string, admissionNumber } }
  });
  if (existingAdmission) {
    return { error: "This admission number already exists for this school." };
  }

  // 2. Auto-assign Roll Number
  const enrollmentsInSection = await prisma.studentEnrollment.findMany({
    where: { classId: cls.id, academicSessionId: activeSession.id },
    orderBy: { rollNumber: 'desc' }
  });
  
  let maxRoll = 0;
  for (const enr of enrollmentsInSection) {
    const rNum = parseInt(enr.rollNumber, 10);
    if (!isNaN(rNum) && rNum > maxRoll) {
      maxRoll = rNum;
    }
  }
  const newRollNumber = (maxRoll + 1).toString();

  // 3. Create student user account
  const plainPassword = Math.random().toString(36).slice(-6) + "A1!";
  let newUserId: string;

  try {
    const { auth } = await import("@/lib/auth");
    const mockHeaders = new Headers();
    const res = await auth.api.signUpEmail({
      body: {
        email: studentEmail,
        password: plainPassword,
        name: name,
      },
      headers: mockHeaders,
    });
    
    // Fallback if better-auth returns error format vs standard return format
    const userData = 'user' in res ? res.user : (res as any);
    
    if ((res as any).status === 422 || (res as any).status === "UNPROCESSABLE_ENTITY") {
       return { error: "User already exists. Use another email." };
    }
    
    newUserId = userData?.id || userData?.user?.id;
    if (!newUserId) {
      console.error("Failed to create student user account via better-auth", res);
      return { error: "Failed to create student login credentials" };
    }

    await prisma.user.update({
      where: { id: newUserId },
      data: {
        role: "STUDENT",
        schoolId: viewer.schoolId as string,
        emailVerified: false,
      }
    });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.oTPCode.create({
      data: {
        email: studentEmail,
        code: otp,
        expiresAt
      }
    });

    // Send email
    await sendEmail(
      studentEmail,
      "Welcome to SchoolManager - Verify your Account",
      `<p>You have been enrolled as a student on SchoolManager.</p>
       <p>Your temporary password is: <strong>${plainPassword}</strong></p>
       <p>Before logging in, please verify your email using this 6-digit code: <strong>${otp}</strong></p>
       <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?email=${encodeURIComponent(studentEmail)}">Click here to verify your email</a></p>`
    );
  } catch (error: any) {
    console.error("Error creating student account:", error);
    if (error.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" || error.message?.includes("Use another email")) {
      return { error: "This email is already registered to an existing student or staff member. Please use a different email." };
    }
    return { error: error.message || "Failed to create student login credentials." };
  }

  // 4. Create student + enrollment
  const student = await prisma.student.create({
    data: {
      schoolId: viewer.schoolId as string,
      name,
      admissionNumber,
      userId: newUserId,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      address: address || null,
    },
  });

  await prisma.studentEnrollment.create({
    data: {
      studentId: student.id,
      academicSessionId: activeSession.id,
      classId: cls.id,
      rollNumber: newRollNumber,
    },
  });

  // 5. If parent email provided, link the parent
  if (parentEmail) {
    const parentUser = await prisma.user.findUnique({ where: { email: parentEmail } });
    if (parentUser && parentUser.schoolId === viewer.schoolId as string) {
      await prisma.parentStudentLink.upsert({
        where: { parentId_studentId: { parentId: parentUser.id, studentId: student.id } },
        update: {},
        create: { parentId: parentUser.id, studentId: student.id },
      });
    }
  }

  // 6. Generate initial invoice based on the fee structure
  const totalAmount = feeStructure.components.reduce((acc, fc) => acc + Number(fc.amount), 0);
  if (totalAmount > 0) {
    await prisma.$transaction(async (tx) => {
      const feeRecord = await tx.feeRecord.create({
        data: {
          studentId: student.id,
          feeStructureId: feeStructure.id,
          amountDue: totalAmount,
          cycleDate: new Date(),
        }
      });

      const invoiceNumber = await getNextInvoiceNumber(
        tx,
        viewer.schoolId as string,
        activeSession.id,
        activeSession.name
      );

      await tx.invoice.create({
        data: {
          studentId: student.id,
          feeRecordId: feeRecord.id,
          invoiceNumber: invoiceNumber,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: 'PENDING',
          totalAmount: totalAmount,
          items: {
            create: feeStructure.components.map(fc => ({
              name: fc.name,
              amount: fc.amount
            }))
          }
        }
      });
    });
  }

  revalidatePath("/students");
  return { tempPassword: plainPassword, studentEmail };
}

export async function deleteStudent(studentId: string) {
  const viewer = await requirePrincipal();

  // Verify student belongs to school
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId: viewer.schoolId as string },
    include: {
      invoices: {
        include: { payments: { include: { receipt: true, refunds: true } }, items: true }
      }
    }
  });
  if (!student) throw new Error("Student not found.");

  const userId = student.userId;
  let userEmail: string | null = null;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    userEmail = user?.email || null;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Delete attendance records for this student
    await tx.attendance.deleteMany({ where: { studentId } });

    // 2. Delete notice links for this student
    await tx.noticeStudentLink.deleteMany({ where: { studentId } });

    // 3. Delete parent-student links
    await tx.parentStudentLink.deleteMany({ where: { studentId } });

    // 4. Delete enrollments
    await tx.studentEnrollment.deleteMany({ where: { studentId } });

    // 5. Delete financial data (invoices kept for 15 days for principal reference)
    // For each invoice: delete receipts → refunds → payments → invoice items → invoice
    for (const invoice of student.invoices) {
      for (const payment of invoice.payments) {
        if (payment.receipt) {
          await tx.receipt.delete({ where: { id: payment.receipt.id } });
        }
        await tx.refund.deleteMany({ where: { paymentId: payment.id } });
      }
      await tx.payment.deleteMany({ where: { invoiceId: invoice.id } });
      await tx.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
      await tx.invoice.delete({ where: { id: invoice.id } });
    }

    // 6. Delete fee records
    await tx.feeRecord.deleteMany({ where: { studentId } });

    // 7. Delete the Student record
    await tx.student.delete({ where: { id: studentId } });

    // 8. Delete User and related auth records
    if (userId) {
      await tx.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.auditLog.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    }

    // 9. Delete OTP codes for this student's email
    if (userEmail) {
      await tx.oTPCode.deleteMany({ where: { email: userEmail } });
    }
  });

  revalidatePath("/students");
  return {};
}

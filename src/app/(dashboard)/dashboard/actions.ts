"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessDeniedError, validateRole } from "@/lib/access-control";

export async function setFeeForClassName(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new AccessDeniedError("Not authenticated");
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true }
  });
  if (!user || !user.schoolId) throw new AccessDeniedError("User not found or no school");
  validateRole(user.role, ["PRINCIPAL"]);

  const className = formData.get("className") as string;
  const name = formData.get("name") as string;
  const amountStr = formData.get("amount") as string;
  const frequency = formData.get("frequency") as any;

  if (!className || !name || !amountStr || !frequency) {
    throw new Error("Missing required fields");
  }

  // Ensure the school has at least one payment method configured
  const schoolBank = await prisma.schoolBankAccount.findFirst({
    where: { schoolId: user.schoolId }
  });
  
  const activeGateway = await prisma.paymentGateway.findFirst({
    where: { schoolId: user.schoolId, isActive: true }
  });

  if ((!schoolBank || !schoolBank.upiId) && !activeGateway) {
    return { error: "Please configure a Payment Gateway (UPI or Razorpay/PhonePe) in Settings before setting fees." };
  }

  // Find active academic session
  const academicSession = await prisma.academicSession.findFirst({
    where: { schoolId: user.schoolId, isActive: true }
  });

  if (!academicSession) {
    throw new Error("No active academic session found");
  }

  // Find all classes (sections) with this name
  const classes = await prisma.class.findMany({
    where: { schoolId: user.schoolId, name: className }
  });

  if (classes.length === 0) {
    throw new Error("No classes found with this name");
  }

  const amount = parseFloat(amountStr);

  try {
    await prisma.$transaction(async (tx) => {
      for (const cls of classes) {
        // Find existing structure for this session/class with this frequency
        let feeStructure = await tx.feeStructure.findFirst({
          where: { academicSessionId: academicSession.id, classId: cls.id, frequency }
        });

        if (!feeStructure) {
          feeStructure = await tx.feeStructure.create({
            data: {
              academicSessionId: academicSession.id,
              classId: cls.id,
              frequency,
              effectiveFrom: new Date()
            }
          });
        }

        // Upsert the fee component
        const existingComponent = await tx.feeComponent.findFirst({
          where: { feeStructureId: feeStructure.id, name }
        });

        if (existingComponent) {
          // Just update amount. Do NOT modify existing pending invoices.
          // It will apply to the next month's invoice automatically.
          await tx.feeComponent.update({
            where: { id: existingComponent.id },
            data: { amount }
          });
        } else {
          // Create new fee component
          await tx.feeComponent.create({
            data: {
              feeStructureId: feeStructure.id,
              name,
              amount
            }
          });

          // Add this new fee to any CURRENT pending invoices for students in this class
          const students = await tx.student.findMany({
            where: {
              isActive: true,
              enrollments: { some: { classId: cls.id, academicSessionId: academicSession.id } }
            }
          });

          for (const student of students) {
            const pendingInvoices = await tx.invoice.findMany({
              where: {
                studentId: student.id,
                status: { in: ["PENDING", "PARTIAL"] }
              }
            });

            for (const invoice of pendingInvoices) {
              // Add item
              await tx.invoiceItem.create({
                data: {
                  invoiceId: invoice.id,
                  name: name,
                  amount: amount
                }
              });
              // Update total
              await tx.invoice.update({
                where: { id: invoice.id },
                data: {
                  totalAmount: Number(invoice.totalAmount) + amount
                }
              });
            }
          }
        }
      }
    });
  } catch (error: any) {
    console.error("Fee transaction error:", error);
    return { error: error.message || "Failed to process fee transaction." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

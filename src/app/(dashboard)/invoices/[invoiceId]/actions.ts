"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessDeniedError, validateRole } from "@/lib/access-control";
import { Prisma } from "@prisma/client";

export async function markInvoiceAsPaidByCash(invoiceId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new AccessDeniedError("Not authenticated");
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true }
  });
  if (!user || !user.schoolId) throw new AccessDeniedError("User not found or no school");
  validateRole(user.role, ["PRINCIPAL", "ACCOUNTANT"]);

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, student: { schoolId: user.schoolId } }
  });
  if (!invoice) throw new Error("Invoice not found");

  const outstanding = new Prisma.Decimal(invoice.totalAmount).minus(invoice.paidAmount);
  if (outstanding.lte(0)) {
    throw new Error("Invoice is already fully paid.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: outstanding,
        method: "CASH",
        status: "COMPLETED",
      }
    });

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: { increment: outstanding },
        status: "PAID"
      }
    });
  });

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/invoices`);
  return { success: true };
}

export async function confirmUpiPayment(paymentId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new AccessDeniedError("Not authenticated");
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true }
  });
  if (!user || !user.schoolId) throw new AccessDeniedError("User not found or no school");
  validateRole(user.role, ["PRINCIPAL", "ACCOUNTANT"]);

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { invoice: true }
  });
  if (!payment || payment.invoice.studentId === undefined) throw new Error("Payment not found");
  
  // Quick check that it belongs to the school (via invoice)
  const invoice = await prisma.invoice.findFirst({
    where: { id: payment.invoiceId, student: { schoolId: user.schoolId } }
  });
  if (!invoice) throw new Error("Unauthorized");

  if (payment.status !== "PROCESSING") {
    throw new Error("Payment is already " + payment.status);
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED" }
    });

    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paidAmount: { increment: payment.amount },
        status: "PAID"
      }
    });
  });

  revalidatePath(`/invoices/${payment.invoiceId}`);
  revalidatePath(`/invoices`);
  return { success: true };
}

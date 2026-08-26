"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessDeniedError, validateRole } from "@/lib/access-control";
import { Prisma } from "@prisma/client";

export async function markInvoiceAsPaidByCash(invoiceId: string, amount: number) {
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

  const payAmount = new Prisma.Decimal(amount);
  if (payAmount.lte(0)) {
    throw new Error("Amount must be greater than 0.");
  }
  if (payAmount.gt(outstanding)) {
    throw new Error(`Amount cannot exceed outstanding balance of ₹${outstanding.toFixed(2)}.`);
  }

  const newPaidAmount = new Prisma.Decimal(invoice.paidAmount).add(payAmount);
  const newStatus = newPaidAmount.gte(invoice.totalAmount) ? "PAID" : "PARTIAL";

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: payAmount,
        method: "CASH",
        status: "COMPLETED",
      }
    });

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: { increment: payAmount },
        status: newStatus
      }
    });
  });

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/invoices`);
  revalidatePath(`/dashboard`);
  return { success: true };
}

export async function confirmUpiPayment(paymentId: string, actualAmount: number) {
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
  
  const invoice = await prisma.invoice.findFirst({
    where: { id: payment.invoiceId, student: { schoolId: user.schoolId } }
  });
  if (!invoice) throw new Error("Unauthorized");

  if (payment.status !== "PROCESSING") {
    throw new Error("Payment is already " + payment.status);
  }

  const confirmedAmount = new Prisma.Decimal(actualAmount);
  const outstanding = new Prisma.Decimal(invoice.totalAmount).minus(invoice.paidAmount);

  if (confirmedAmount.lte(0)) {
    throw new Error("Amount must be greater than 0.");
  }
  if (confirmedAmount.gt(outstanding)) {
    throw new Error(`Amount cannot exceed outstanding balance of ₹${outstanding.toFixed(2)}.`);
  }

  const newPaidAmount = new Prisma.Decimal(invoice.paidAmount).add(confirmedAmount);
  const newStatus = newPaidAmount.gte(invoice.totalAmount) ? "PAID" : "PARTIAL";

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { 
        status: "COMPLETED",
        amount: confirmedAmount,
      }
    });

    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paidAmount: { increment: confirmedAmount },
        status: newStatus
      }
    });
  });

  revalidatePath(`/invoices/${payment.invoiceId}`);
  revalidatePath(`/invoices`);
  revalidatePath(`/dashboard`);
  return { success: true };
}


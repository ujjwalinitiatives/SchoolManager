import { InvoiceStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import { createAuditLog } from "./audit";
import { getNextReceiptNumber } from "./invoice-number";

interface ManualPaymentInput {
  invoiceId: string;
  amount: Prisma.Decimal;
  method: PaymentMethod;
  referenceNumber?: string;
  recordedById: string;
}

export async function recordManualPayment(input: ManualPaymentInput) {
  // Use a transaction for safety
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: input.invoiceId },
      include: { 
        student: true,
        feeRecord: {
          include: { feeStructure: { include: { academicSession: true } } }
        } 
      },
    });

    if (!invoice) throw new Error("Invoice not found");

    const outstanding = new Prisma.Decimal(invoice.totalAmount).minus(invoice.paidAmount);
    if (input.amount.gt(outstanding)) {
      throw new Error(`Cannot pay more than outstanding amount (${outstanding.toString()})`);
    }

    const schoolId = invoice.student.schoolId;

    if (input.referenceNumber) {
      const duplicate = await tx.payment.findFirst({
        where: {
          referenceNumber: input.referenceNumber,
          invoice: { student: { schoolId } }
        }
      });
      if (duplicate) {
        throw new Error(`A payment with reference number ${input.referenceNumber} already exists`);
      }
    }

    // 1. Create completed payment record
    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: input.amount,
        method: input.method,
        status: PaymentStatus.COMPLETED,
        referenceNumber: input.referenceNumber,
      },
    });

    // 2. Update Invoice
    const newPaidAmount = new Prisma.Decimal(invoice.paidAmount).add(input.amount);
    const newStatus = newPaidAmount.gte(invoice.totalAmount) 
      ? InvoiceStatus.PAID 
      : InvoiceStatus.PARTIAL;

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    // 3. Generate Receipt
    const session = invoice.feeRecord.feeStructure.academicSession;
    const receiptNumber = await getNextReceiptNumber(tx, schoolId, session.id, session.name);

    const receipt = await tx.receipt.create({
      data: {
        paymentId: payment.id,
        receiptNumber,
        collectedById: input.recordedById,
      }
    });

    // 4. Audit Log
    await createAuditLog({
      entityType: "Payment",
      entityId: payment.id,
      action: "CREATE",
      newValue: {
        amount: input.amount.toString(),
        method: input.method,
        referenceNumber: input.referenceNumber,
        receiptNumber,
      },
      userId: input.recordedById,
    });

    return { payment, receipt };
  });
}

interface RefundInput {
  paymentId: string;
  amount: Prisma.Decimal;
  reason: string;
  processedById: string;
}

export async function processRefund(input: RefundInput) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const payment = await tx.payment.findUnique({
      where: { id: input.paymentId },
      include: { invoice: true },
    });

    if (!payment) throw new Error("Payment not found");
    if (payment.status !== PaymentStatus.COMPLETED && payment.status !== PaymentStatus.PARTIALLY_REFUNDED) {
      throw new Error("Only completed payments can be refunded");
    }

    // Determine how much is already refunded
    const existingRefunds = await tx.refund.aggregate({
      where: { paymentId: payment.id, status: 'PROCESSED' },
      _sum: { amount: true },
    });
    
    const totalRefunded = existingRefunds._sum.amount || new Prisma.Decimal(0);
    const availableForRefund = new Prisma.Decimal(payment.amount).minus(totalRefunded);

    if (input.amount.gt(availableForRefund)) {
      throw new Error(`Refund amount exceeds available amount (${availableForRefund.toString()})`);
    }

    // 1. Create Refund Record
    const refund = await tx.refund.create({
      data: {
        paymentId: payment.id,
        amount: input.amount,
        reason: input.reason,
        status: "PROCESSED",
        processedById: input.processedById,
      },
    });

    // 2. Update Payment Status
    const newTotalRefunded = totalRefunded.add(input.amount);
    const newPaymentStatus = newTotalRefunded.equals(new Prisma.Decimal(payment.amount))
      ? PaymentStatus.REFUNDED
      : PaymentStatus.PARTIALLY_REFUNDED;

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: newPaymentStatus },
    });

    // 3. Update Invoice Paid Amount
    const newPaidAmount = new Prisma.Decimal(payment.invoice.paidAmount).minus(input.amount);
    
    // Reverse status if it was paid
    const newInvoiceStatus = newPaidAmount.lte(0)
      ? InvoiceStatus.PENDING
      : InvoiceStatus.PARTIAL;

    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newInvoiceStatus,
      },
    });

    // 4. Audit Log
    await createAuditLog({
      entityType: "Refund",
      entityId: refund.id,
      action: "REFUND",
      newValue: {
        amount: input.amount.toString(),
        reason: input.reason,
        paymentId: payment.id,
      },
      userId: input.processedById,
    });

    return refund;
  });
}

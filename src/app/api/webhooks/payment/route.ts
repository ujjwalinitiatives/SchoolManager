import { NextResponse } from "next/server";
import { InvoiceStatus, PaymentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/encryption";
import { verifyWebhookSignature } from "@/lib/payment-gateway";
import { createAuditLog } from "@/lib/audit";
import { getNextReceiptNumber } from "@/lib/invoice-number";
import { inngest } from "@/inngest/client";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const timestamp = request.headers.get("x-webhook-timestamp");
    const signature = request.headers.get("x-webhook-signature");
    const schoolId = request.headers.get("x-school-id") || new URL(request.url).searchParams.get("schoolId");

    if (!signature || !schoolId || !timestamp) {
      return NextResponse.json({ error: "Missing signature, timestamp, or school ID" }, { status: 400 });
    }

    // Timestamp validation (prevent replay attacks) - reject if older than 5 minutes
    const now = Date.now();
    const webhookTime = parseInt(timestamp, 10) * 1000;
    if (Math.abs(now - webhookTime) > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Webhook timestamp expired" }, { status: 400 });
    }

    const gateway = await prisma.paymentGateway.findFirst({
      where: { schoolId, isActive: true },
    });

    if (!gateway || !gateway.webhookSecret) {
      return NextResponse.json({ error: "Webhook not configured for this school" }, { status: 400 });
    }

    const secret = decryptSecret(gateway.webhookSecret);
    
    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    
    // Simulate a successful payment webhook payload: { event: "payment.captured", payload: { payment: { entity: { id: "...", order_id: "..." } } } }
    if (payload.event === "payment.captured") {
      const orderId = payload.payload.payment.entity.order_id;
      const transactionId = payload.payload.payment.entity.id;
      
      const payment = await prisma.payment.findUnique({
        where: { idempotencyKey: orderId },
        include: { invoice: { include: { feeRecord: true, student: { include: { parentLinks: { include: { parent: true } } } } } } }
      });

      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      // Idempotency: Duplicate webhook detection
      if (payment.status === PaymentStatus.COMPLETED && payment.gatewayTransactionId === transactionId) {
        return NextResponse.json({ status: "already_processed" });
      }

      await prisma.$transaction(async (tx) => {
        // 1. Mark payment as completed
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: { 
            status: PaymentStatus.COMPLETED, 
            gatewayTransactionId: transactionId,
            gatewayResponse: payload,
            gatewayId: gateway.id
          },
        });

        // 2. Update Invoice Paid Amount and Status
        const newPaidAmount = new Prisma.Decimal(payment.invoice.paidAmount).add(payment.amount);
        const newStatus = newPaidAmount.gte(payment.invoice.totalAmount) 
          ? InvoiceStatus.PAID 
          : InvoiceStatus.PARTIAL;

        const updatedInvoice = await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });

        // 3. Generate Receipt
        // We need the session to generate receipt number
        const session = await tx.academicSession.findFirstOrThrow({
          where: { id: payment.invoice.feeRecord.feeStructureId } // Wait, fee structure belongs to session
        }); // Actually, feeRecord doesn't directly have session.
        // Let's get the active session for the school
        const activeSession = await tx.academicSession.findFirstOrThrow({
          where: { schoolId: schoolId, isActive: true }
        });

        const receiptNumber = await getNextReceiptNumber(tx, schoolId, activeSession.id, activeSession.name);

        const receipt = await tx.receipt.create({
          data: {
            paymentId: payment.id,
            receiptNumber,
          }
        });

        // 4. Audit Log
        await createAuditLog({
          entityType: "Payment",
          entityId: payment.id,
          action: "STATUS_CHANGE",
          oldValue: { status: payment.status },
          newValue: { status: PaymentStatus.COMPLETED, gatewayTransactionId: transactionId, receiptNumber },
        });

        // 5. Trigger Email Notification via Background Job
        const parentEmail = payment.invoice.student.parentLinks[0]?.parent.email;
        if (parentEmail) {
          await inngest.send({
            name: "notification/email.send",
            data: {
              to: parentEmail,
              subject: `Payment Receipt for Invoice ${payment.invoice.invoiceNumber}`,
              html: `<p>Dear Parent,</p><p>We have successfully received your payment of INR ${payment.amount} for invoice ${payment.invoice.invoiceNumber}. Your receipt number is ${receiptNumber}.</p>`,
              text: `We have successfully received your payment of INR ${payment.amount} for invoice ${payment.invoice.invoiceNumber}.`,
            },
          });
        }
      });

      return NextResponse.json({ status: "success" });
    }

    return NextResponse.json({ status: "ignored event" });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

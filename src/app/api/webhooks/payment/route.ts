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
    const incomingGatewayId = request.headers.get("x-gateway-id");

    if (!signature || !schoolId || !timestamp) {
      return NextResponse.json({ error: "Missing signature, timestamp, or school ID" }, { status: 400 });
    }

    // Timestamp validation (prevent replay attacks) - reject if older than 5 minutes
    const now = Date.now();
    const webhookTime = parseInt(timestamp, 10) * 1000;
    if (isNaN(webhookTime) || Math.abs(now - webhookTime) > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Webhook timestamp expired or invalid" }, { status: 400 });
    }

    // Multi-gateway: find the correct gateway
    // Priority: explicit gateway ID > active gateway for school
    let gateway;
    if (incomingGatewayId) {
      gateway = await prisma.paymentGateway.findFirst({
        where: { id: incomingGatewayId, schoolId },
      });
    } else {
      gateway = await prisma.paymentGateway.findFirst({
        where: { schoolId, isActive: true },
      });
    }

    if (!gateway || !gateway.webhookSecret) {
      return NextResponse.json({ error: "Webhook not configured for this school/gateway" }, { status: 400 });
    }

    const secret = decryptSecret(gateway.webhookSecret);
    
    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    
    if (payload.event === "payment.captured") {
      const orderId = payload.payload?.payment?.entity?.order_id;
      const transactionId = payload.payload?.payment?.entity?.id;

      if (!orderId || !transactionId) {
        return NextResponse.json({ error: "Missing order_id or transaction id in payload" }, { status: 400 });
      }
      
      const payment = await prisma.payment.findUnique({
        where: { idempotencyKey: orderId },
        include: {
          invoice: {
            include: {
              feeRecord: {
                include: { feeStructure: { include: { academicSession: true } } }
              },
              student: {
                include: { parentLinks: { include: { parent: true } } }
              }
            }
          }
        }
      });

      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      // Idempotency: Duplicate webhook detection
      if (payment.status === PaymentStatus.COMPLETED && payment.gatewayTransactionId === transactionId) {
        return NextResponse.json({ status: "already_processed" });
      }

      // Verify payment belongs to the correct school
      if (payment.invoice.student.schoolId !== schoolId) {
        return NextResponse.json({ error: "School mismatch" }, { status: 403 });
      }

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Mark payment as completed
        await tx.payment.update({
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

        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });

        // 3. Generate Receipt using proper session from fee structure
        const session = payment.invoice.feeRecord.feeStructure.academicSession;
        const receiptNumber = await getNextReceiptNumber(tx, schoolId, session.id, session.name);

        await tx.receipt.create({
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
              html: `<p>Dear Parent,</p><p>We have successfully received your payment of INR ${payment.amount} for invoice ${payment.invoice.invoiceNumber}.</p>`,
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

import crypto from "node:crypto";
import { PaymentStatus, Prisma } from "@prisma/client";

import { decryptSecret } from "./encryption";
import { prisma } from "./prisma";
import { createAuditLog } from "./audit";

/**
 * Creates a payment order using the active payment gateway for the school.
 * This is a generic abstraction that can be swapped with real Razorpay/PhonePe SDKs.
 */
export async function createPaymentOrder(invoiceId: string, schoolId: string, amount: Prisma.Decimal) {
  // Find the active gateway for the school
  const gateway = await prisma.paymentGateway.findFirst({
    where: { schoolId, isActive: true },
  });

  if (!gateway) {
    throw new Error("No active payment gateway configured for this school.");
  }

  // Decrypt the secrets to use with the SDK (Simulated here)
  const apiKey = gateway.apiKey ? decryptSecret(gateway.apiKey) : null;
  const apiSecret = gateway.apiSecret ? decryptSecret(gateway.apiSecret) : null;

  if (!apiKey || !apiSecret) {
    throw new Error("Payment gateway credentials are incomplete.");
  }

  // Simulate gateway order creation...
  // In a real scenario:
  // const order = await razorpay.orders.create({ amount: amount * 100, currency: "INR", receipt: invoiceId });
  
  // Create our internal payment record
  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      amount,
      method: "ONLINE_GATEWAY",
      status: PaymentStatus.PENDING,
      // idempotencyKey: order.id,
      idempotencyKey: `ORDER_${crypto.randomUUID()}`, 
    },
  });

  return {
    paymentId: payment.id,
    orderId: payment.idempotencyKey,
    provider: gateway.providerName,
    amount: amount.toString(),
  };
}

/**
 * Validates the webhook payload signature securely.
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string) {
  // Generic HMAC SHA256 verification (common for Razorpay, Stripe, etc.)
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
    
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

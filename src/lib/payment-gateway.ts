import crypto from "node:crypto";
import { PaymentStatus, Prisma } from "@prisma/client";

import { decryptSecret } from "./encryption";
import { prisma } from "./prisma";
import { createAuditLog } from "./audit";

/**
 * Creates a payment order using a specific (or the default active) gateway for the school.
 * Supports multi-gateway: if gatewayId is provided, uses that gateway; otherwise falls back to
 * the active gateway.
 */
export async function createPaymentOrder(
  invoiceId: string,
  schoolId: string,
  amount: Prisma.Decimal,
  gatewayId?: string
) {
  let gateway;
  
  if (gatewayId) {
    // Use the specific requested gateway (must belong to this school)
    gateway = await prisma.paymentGateway.findFirst({
      where: { id: gatewayId, schoolId },
    });
    if (!gateway) {
      throw new Error("Requested payment gateway not found for this school.");
    }
  } else {
    // Fall back to default active gateway
    gateway = await prisma.paymentGateway.findFirst({
      where: { schoolId, isActive: true },
    });
  }

  if (!gateway) {
    throw new Error("No payment gateway configured for this school.");
  }

  // Decrypt the secrets (only on server-side)
  const apiKey = gateway.apiKey ? decryptSecret(gateway.apiKey) : null;
  const apiSecret = gateway.apiSecret ? decryptSecret(gateway.apiSecret) : null;

  if (!apiKey || !apiSecret) {
    throw new Error("Payment gateway credentials are incomplete.");
  }

  // Create internal payment record linked to this gateway
  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      amount,
      method: "ONLINE_GATEWAY",
      status: PaymentStatus.PENDING,
      idempotencyKey: `ORDER_${crypto.randomUUID()}`,
      gatewayId: gateway.id, // Link payment to specific gateway
    },
  });

  return {
    paymentId: payment.id,
    orderId: payment.idempotencyKey,
    provider: gateway.providerName,
    gatewayId: gateway.id,
    environment: gateway.environment,
    amount: amount.toString(),
  };
}

/**
 * Validates the webhook payload signature securely using timing-safe comparison.
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  // Ensure both buffers are same length before timing-safe comparison
  const expectedBuf = Buffer.from(expectedSignature, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

/**
 * Returns all configured gateways for a school (safe fields only — no secrets).
 */
export async function getSchoolGateways(schoolId: string) {
  return prisma.paymentGateway.findMany({
    where: { schoolId },
    select: {
      id: true,
      providerName: true,
      isActive: true,
      environment: true,
      createdAt: true,
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
}

"use server";

import { revalidatePath } from "next/cache";

import { encryptSecret } from "@/lib/encryption";
import { activateGatewayForSchool, deactivateGatewayForSchool, requirePrincipal } from "@/lib/gateway-access";
import { prisma } from "@/lib/prisma";

function requiredText(formData: FormData, field: string) {
  const value = formData.get(field);
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required.`);
  return value.trim();
}

function providerName(formData: FormData) {
  const value = requiredText(formData, "providerName").toUpperCase();
  if (!/^[A-Z0-9 _-]{2,50}$/u.test(value)) {
    throw new Error("Provider name may contain letters, numbers, spaces, underscores, and hyphens only.");
  }
  return value;
}

export async function createGateway(formData: FormData) {
  const principal = await requirePrincipal();
  const webhookSecret = formData.get("webhookSecret");
  const environment = (formData.get("environment") as string || "TEST").toUpperCase();
  const merchantId = (formData.get("merchantId") as string || "").trim();

  if (webhookSecret !== null && typeof webhookSecret !== "string") throw new Error("Invalid webhook secret.");
  if (!["TEST", "PRODUCTION", "SANDBOX"].includes(environment)) throw new Error("Invalid environment.");

  await prisma.paymentGateway.create({
    data: {
      schoolId: principal.schoolId,
      providerName: providerName(formData),
      apiKey: encryptSecret(requiredText(formData, "apiKey")),
      apiSecret: encryptSecret(requiredText(formData, "apiSecret")),
      webhookSecret: webhookSecret?.trim() ? encryptSecret(webhookSecret.trim()) : null,
      merchantId: merchantId || null,
      environment,
    },
  });

  revalidatePath("/settings/gateways");
}

export async function activateGateway(gatewayId: string) {
  const principal = await requirePrincipal();
  await activateGatewayForSchool(gatewayId, principal.schoolId);
  revalidatePath("/settings/gateways");
}

export async function deactivateGateway(gatewayId: string) {
  const principal = await requirePrincipal();
  await deactivateGatewayForSchool(gatewayId, principal.schoolId);
  revalidatePath("/settings/gateways");
}

export async function deleteGateway(gatewayId: string) {
  const principal = await requirePrincipal();

  // Check if any payments reference this gateway
  const paymentCount = await prisma.payment.count({
    where: { gatewayId }
  });

  if (paymentCount > 0) {
    throw new Error("Cannot delete a gateway that has processed payments. Deactivate it instead.");
  }

  await prisma.paymentGateway.deleteMany({
    where: { id: gatewayId, schoolId: principal.schoolId }
  });

  revalidatePath("/settings/gateways");
}

export async function saveUpiId(formData: FormData) {
  const principal = await requirePrincipal();
  const upiId = formData.get("upiId") as string;
  
  if (!upiId) throw new Error("UPI ID is required");

  // Upsert bank account
  const bankAcc = await prisma.schoolBankAccount.findFirst({ where: { schoolId: principal.schoolId } });
  if (bankAcc) {
    await prisma.schoolBankAccount.update({
      where: { id: bankAcc.id },
      data: { upiId }
    });
  } else {
    await prisma.schoolBankAccount.create({
      data: { schoolId: principal.schoolId, upiId }
    });
  }
  revalidatePath("/settings/gateways");
}

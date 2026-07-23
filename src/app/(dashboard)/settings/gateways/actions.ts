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
  if (webhookSecret !== null && typeof webhookSecret !== "string") throw new Error("Invalid webhook secret.");

  await prisma.paymentGateway.create({
    data: {
      schoolId: principal.schoolId,
      providerName: providerName(formData),
      apiKey: encryptSecret(requiredText(formData, "apiKey")),
      apiSecret: encryptSecret(requiredText(formData, "apiSecret")),
      webhookSecret: webhookSecret?.trim() ? encryptSecret(webhookSecret.trim()) : null,
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

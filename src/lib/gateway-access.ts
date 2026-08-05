import { Prisma } from "@prisma/client";

import { AccessDeniedError, validateRole } from "@/lib/access-control";
import { getCurrentViewer } from "@/lib/invoice-access";
import { prisma } from "@/lib/prisma";

const gatewaySelect = {
  id: true,
  providerName: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getPrincipalGatewaySettings() {
  const viewer = await getCurrentViewer();
  if (!viewer) return null;
  validateRole(viewer.role, ["PRINCIPAL", "ACCOUNTANT"]);

  const gateways = await prisma.paymentGateway.findMany({
    where: { schoolId: viewer.schoolId as string },
    select: gatewaySelect,
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return { viewer, gateways };
}

export async function requirePrincipal() {
  const viewer = await getCurrentViewer();
  if (!viewer) throw new AccessDeniedError("You must sign in to manage payment gateways.");
  validateRole(viewer.role, ["PRINCIPAL"]);
  return viewer;
}

async function runSerializableTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
      throw error;
    }
  }

  throw new Error("Unable to update gateway configuration. Please try again.");
}

export async function activateGatewayForSchool(gatewayId: string, schoolId: string) {
  return runSerializableTransaction(async (tx) => {
    const gateway = await tx.paymentGateway.findFirst({
      where: { id: gatewayId, schoolId },
      select: { id: true },
    });
    if (!gateway) throw new AccessDeniedError("Gateway configuration was not found for this school.");

    await tx.paymentGateway.updateMany({ where: { schoolId, isActive: true }, data: { isActive: false } });
    return tx.paymentGateway.update({ where: { id: gateway.id }, data: { isActive: true }, select: gatewaySelect });
  });
}

export async function deactivateGatewayForSchool(gatewayId: string, schoolId: string) {
  const result = await prisma.paymentGateway.updateMany({
    where: { id: gatewayId, schoolId, isActive: true },
    data: { isActive: false },
  });
  if (result.count === 0) throw new AccessDeniedError("Active gateway configuration was not found for this school.");
}

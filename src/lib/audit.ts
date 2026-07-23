import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "REFUND" | "STATUS_CHANGE";

interface AuditEntry {
  entityType: string;
  entityId: string;
  action: AuditAction;
  oldValue?: Prisma.InputJsonValue | null;
  newValue?: Prisma.InputJsonValue | null;
  userId?: string | null;
  ipAddress?: string | null;
}

/**
 * Creates an immutable audit log entry.
 * Financial records are never deleted — this log provides a full paper trail.
 */
export async function createAuditLog(entry: AuditEntry) {
  return prisma.auditLog.create({
    data: {
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      oldValue: entry.oldValue === undefined || entry.oldValue === null ? Prisma.JsonNull : (entry.oldValue as any),
      newValue: entry.newValue === undefined || entry.newValue === null ? Prisma.JsonNull : (entry.newValue as any),
      userId: entry.userId,
      ipAddress: entry.ipAddress,
    },
  });
}

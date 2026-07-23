import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

/**
 * Generates the next sequential invoice number for a school+session.
 * Format: INV-{YEAR}-{6_DIGIT_SEQ} (e.g., INV-2026-000001)
 *
 * MUST be called inside a Prisma interactive transaction ($transaction)
 * to guarantee atomicity and prevent duplicate numbers under concurrency.
 */
export async function getNextInvoiceNumber(
  tx: Prisma.TransactionClient,
  schoolId: string,
  academicSessionId: string,
  sessionName: string
): Promise<string> {
  // Upsert ensures the sequence row exists, then atomically increments
  const seq = await tx.documentSequence.upsert({
    where: {
      schoolId_academicSessionId: {
        schoolId,
        academicSessionId,
      },
    },
    update: {
      invoiceNextSequence: { increment: 1 },
    },
    create: {
      schoolId,
      academicSessionId,
      invoiceNextSequence: 2, // We're using 1 right now, so next starts at 2
      receiptNextSequence: 1,
    },
  });

  // If it was an update, the returned value is the NEW value (post-increment).
  // If it was a create, we used 1 as the first number.
  const seqNumber =
    seq.invoiceNextSequence === 2 && seq.receiptNextSequence === 1
      ? 1 // freshly created — this is the first invoice
      : seq.invoiceNextSequence - 1; // updated — subtract 1 because upsert returned post-increment

  const year = sessionName.split("-")[0]; // "2026-27" -> "2026"
  return `INV-${year}-${String(seqNumber).padStart(6, "0")}`;
}

/**
 * Generates the next sequential receipt number for a school+session.
 * Format: RC-{YEAR}-{6_DIGIT_SEQ} (e.g., RC-2026-000001)
 */
export async function getNextReceiptNumber(
  tx: Prisma.TransactionClient,
  schoolId: string,
  academicSessionId: string,
  sessionName: string
): Promise<string> {
  const seq = await tx.documentSequence.upsert({
    where: {
      schoolId_academicSessionId: {
        schoolId,
        academicSessionId,
      },
    },
    update: {
      receiptNextSequence: { increment: 1 },
    },
    create: {
      schoolId,
      academicSessionId,
      invoiceNextSequence: 1,
      receiptNextSequence: 2,
    },
  });

  const seqNumber =
    seq.receiptNextSequence === 2 && seq.invoiceNextSequence === 1
      ? 1
      : seq.receiptNextSequence - 1;

  const year = sessionName.split("-")[0];
  return `RC-${year}-${String(seqNumber).padStart(6, "0")}`;
}

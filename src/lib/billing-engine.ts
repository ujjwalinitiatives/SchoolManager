import { FeeFrequency, Prisma, type Invoice, type InvoiceStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getNextInvoiceNumber } from "@/lib/invoice-number";

export type GenerateInvoicesInput = {
  schoolId: string;
  academicSessionId: string;
  cycleDate: Date;
  dueDate: Date;
  frequency?: FeeFrequency;
};

export type InvoiceGenerationResult = {
  created: number;
  skipped: number;
  invoices: Pick<Invoice, "id" | "invoiceNumber" | "studentId" | "totalAmount" | "dueDate" | "status">[];
};

function normalizedDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function ensureValidInput(input: GenerateInvoicesInput) {
  if (Number.isNaN(input.cycleDate.valueOf()) || Number.isNaN(input.dueDate.valueOf())) {
    throw new Error("cycleDate and dueDate must be valid dates.");
  }

  if (input.dueDate < input.cycleDate) {
    throw new Error("dueDate cannot be before cycleDate.");
  }
}

/**
 * Creates fee records and invoices for every active enrollment that has an active
 * fee structure. Each student/structure/cycle combination is idempotent.
 */
export async function generateInvoicesForCycle(
  input: GenerateInvoicesInput,
): Promise<InvoiceGenerationResult> {
  ensureValidInput(input);

  const cycleDate = normalizedDate(input.cycleDate);
  const dueDate = normalizedDate(input.dueDate);

  const session = await prisma.academicSession.findFirst({
    where: { id: input.academicSessionId, schoolId: input.schoolId },
    select: { id: true, name: true, startDate: true, endDate: true },
  });

  if (!session) {
    throw new Error("Academic session was not found for this school.");
  }

  if (cycleDate < normalizedDate(session.startDate) || cycleDate > normalizedDate(session.endDate)) {
    throw new Error("cycleDate must fall within the academic session.");
  }

  const feeStructures = await prisma.feeStructure.findMany({
    where: {
      academicSessionId: session.id,
      isActive: true,
      ...(input.frequency ? { frequency: input.frequency } : {}),
      effectiveFrom: { lte: cycleDate },
    },
    include: {
      components: { select: { name: true, amount: true } },
      class: {
        select: {
          enrollments: {
            where: { academicSessionId: session.id, student: { isActive: true } },
            select: { studentId: true },
          },
        },
      },
    },
  });

  const result: InvoiceGenerationResult = { created: 0, skipped: 0, invoices: [] };

  for (const structure of feeStructures) {
    const amountDue = structure.components.reduce(
      (total: Prisma.Decimal, component: { amount: Prisma.Decimal }) => total.plus(component.amount),
      new Prisma.Decimal(0),
    );

    if (amountDue.lte(0)) {
      continue;
    }

    for (const enrollment of structure.class.enrollments) {
      const invoice = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const feeRecord = await tx.feeRecord.upsert({
          where: {
            studentId_feeStructureId_cycleDate: {
              studentId: enrollment.studentId,
              feeStructureId: structure.id,
              cycleDate,
            },
          },
          update: {},
          create: {
            studentId: enrollment.studentId,
            feeStructureId: structure.id,
            amountDue,
            cycleDate,
          },
          select: { id: true },
        });

        const existing = await tx.invoice.findUnique({
          where: { feeRecordId: feeRecord.id },
          select: {
            id: true,
            invoiceNumber: true,
            studentId: true,
            totalAmount: true,
            dueDate: true,
            status: true,
          },
        });

        if (existing) {
          return { invoice: existing, created: false };
        }

        const invoiceNumber = await getNextInvoiceNumber(
          tx,
          input.schoolId,
          session.id,
          session.name
        );

        const createdInvoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            studentId: enrollment.studentId,
            feeRecordId: feeRecord.id,
            totalAmount: amountDue,
            dueDate,
            items: { create: structure.components.map((component: { name: string; amount: Prisma.Decimal }) => ({ ...component })) },
          },
          select: {
            id: true,
            invoiceNumber: true,
            studentId: true,
            totalAmount: true,
            dueDate: true,
            status: true,
          },
        });

        return { invoice: createdInvoice, created: true };
      });

      if (invoice.created) {
        result.created += 1;
        result.invoices.push(invoice.invoice);
      } else {
        result.skipped += 1;
      }
    }
  }

  return result;
}

export function invoiceStatusForBalance(
  totalAmount: Prisma.Decimal,
  paidAmount: Prisma.Decimal,
): InvoiceStatus {
  if (paidAmount.greaterThanOrEqualTo(totalAmount)) return "PAID";
  if (paidAmount.greaterThan(0)) return "PARTIAL";
  return "PENDING";
}

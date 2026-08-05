import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const invoiceSelect = {
  id: true,
  invoiceNumber: true,
  totalAmount: true,
  paidAmount: true,
  dueDate: true,
  status: true,
  pdfUrl: true,
  createdAt: true,
  student: {
    select: {
      id: true,
      schoolId: true,
      name: true,
      address: true,
      admissionNumber: true,
      enrollments: {
        where: { academicSession: { isActive: true } },
        include: { class: { select: { name: true, section: true } } },
        take: 1
      },
      school: { select: { name: true, address: true, logoUrl: true, udiseCode: true } },
    },
  },
  feeRecord: {
    select: {
      cycleDate: true,
      feeStructure: { select: { frequency: true } },
    },
  },
  items: { select: { id: true, name: true, amount: true } },
} as const;

export type InvoiceView = Awaited<ReturnType<typeof getInvoiceForViewer>>;

export async function getCurrentViewer() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true, name: true },
  });
  if (!user || !user.schoolId) return null;
  return { ...user, schoolId: user.schoolId };
}

/** Returns an invoice only when it belongs to the authenticated user's school and scope. */
export async function getInvoiceForViewer(invoiceId: string) {
  const viewer = await getCurrentViewer();
  if (!viewer) return null;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, student: { schoolId: viewer.schoolId as string } },
    select: invoiceSelect,
  });
  if (!invoice) return null;

  if (viewer.role === "PRINCIPAL" || viewer.role === "ACCOUNTANT") {
    return invoice;
  }

  if (viewer.role !== "PARENT") return null;

  const parentLink = await prisma.parentStudentLink.findUnique({
    where: { parentId_studentId: { parentId: viewer.id, studentId: invoice.student.id } },
    select: { id: true },
  });

  return parentLink ? invoice : null;
}

export async function getParentInvoices() {
  const viewer = await getCurrentViewer();
  if (!viewer || viewer.role !== "PARENT") return { viewer, invoices: [] };

  const invoices = await prisma.invoice.findMany({
    where: {
      student: {
        schoolId: viewer.schoolId as string,
        parentLinks: { some: { parentId: viewer.id } },
      },
    },
    select: invoiceSelect,
    orderBy: { dueDate: "desc" },
  });

  return { viewer, invoices };
}

export async function getStudentInvoices() {
  const viewer = await getCurrentViewer();
  if (!viewer || viewer.role !== "STUDENT") return { viewer, invoices: [] };

  const invoices = await prisma.invoice.findMany({
    where: {
      student: { userId: viewer.id, schoolId: viewer.schoolId as string },
    },
    select: invoiceSelect,
    orderBy: { dueDate: "desc" },
  });

  return { viewer, invoices };
}

export async function getSchoolInvoices() {
  const viewer = await getCurrentViewer();
  if (!viewer || (viewer.role !== "PRINCIPAL" && viewer.role !== "ACCOUNTANT")) return { viewer, invoices: [] };

  const invoices = await prisma.invoice.findMany({
    where: {
      student: { schoolId: viewer.schoolId as string },
    },
    select: invoiceSelect,
    orderBy: { dueDate: "desc" },
  });

  return { viewer, invoices };
}

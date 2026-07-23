import { prisma } from "./prisma";
import { getCurrentViewer } from "./invoice-access";
import { Role } from "@prisma/client";

export interface SearchResult {
  id: string;
  type: "STUDENT" | "INVOICE" | "RECEIPT";
  title: string;
  subtitle: string;
  href: string;
}

export async function performGlobalSearch(query: string): Promise<SearchResult[]> {
  const viewer = await getCurrentViewer();
  if (!viewer || (viewer.role !== Role.PRINCIPAL && viewer.role !== Role.ACCOUNTANT)) {
    return []; // Only Admins can perform global search
  }

  const schoolId = viewer.schoolId;
  const q = query.trim();

  if (q.length < 2) return [];

  // Search across Students, Invoices, and Receipts
  const [students, invoices, receipts] = await Promise.all([
    // Student Search (Name, Admission Number)
    prisma.student.findMany({
      where: {
        schoolId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { admissionNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),

    // Invoice Search (Invoice Number)
    prisma.invoice.findMany({
      where: {
        student: { schoolId },
        invoiceNumber: { contains: q, mode: "insensitive" },
      },
      include: { student: true },
      take: 5,
    }),

    // Receipt Search (Receipt Number)
    prisma.receipt.findMany({
      where: {
        payment: { invoice: { student: { schoolId } } },
        receiptNumber: { contains: q, mode: "insensitive" },
      },
      include: { payment: { include: { invoice: { include: { student: true } } } } },
      take: 5,
    }),
  ]);

  const results: SearchResult[] = [];

  students.forEach((s) => {
    results.push({
      id: s.id,
      type: "STUDENT",
      title: s.name,
      subtitle: `Admission No: ${s.admissionNumber}`,
      href: `/students/${s.id}`, // Placeholder route
    });
  });

  invoices.forEach((i) => {
    results.push({
      id: i.id,
      type: "INVOICE",
      title: i.invoiceNumber,
      subtitle: `Student: ${i.student.name} • Status: ${i.status}`,
      href: `/invoices/${i.id}`,
    });
  });

  receipts.forEach((r) => {
    results.push({
      id: r.id,
      type: "RECEIPT",
      title: r.receiptNumber,
      subtitle: `Invoice: ${r.payment.invoice.invoiceNumber} • Paid: ${r.payment.amount}`,
      href: `/api/receipts/${r.id}/pdf`, // Direct link to PDF for now
    });
  });

  return results;
}

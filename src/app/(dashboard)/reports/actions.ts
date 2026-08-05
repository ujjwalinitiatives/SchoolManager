"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessDeniedError, validateRole } from "@/lib/access-control";
import { headers as nextHeaders } from "next/headers";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { revalidatePath } from "next/cache";

async function getViewer() {
  const session = await auth.api.getSession({ headers: await nextHeaders() });
  if (!session?.user?.id) throw new AccessDeniedError("Not authenticated");
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true }
  });
  if (!user) throw new AccessDeniedError("User not found");
  
  validateRole(user.role, ["PRINCIPAL", "ACCOUNTANT"]);
  return user;
}

/**
 * Sanitizes a string for safe CSV embedding.
 * - Escapes double quotes by doubling them
 * - Prefixes formula-injection characters (=, +, -, @, \t, \r) with a single quote
 */
function csvSafe(value: string): string {
  let safe = value.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(safe)) {
    safe = "'" + safe;
  }
  return `"${safe}"`;
}

function buildCSV(headerRow: string[], dataRows: string[][]): string {
  const header = headerRow.map(h => csvSafe(h)).join(",");
  const rows = dataRows.map(row => row.map(field => csvSafe(field)).join(","));
  return [header, ...rows].join("\n");
}

export async function exportDefaultersCSV() {
  const viewer = await getViewer();
  
  // Bounded query: only fetch overdue invoices (capped at 5000 for safety)
  const overdueInvoices = await prisma.invoice.findMany({
    where: { 
      student: { schoolId: viewer.schoolId as string }, 
      status: "OVERDUE"
    },
    include: { student: { include: { parentLinks: { include: { parent: true } } } } },
    orderBy: { dueDate: "asc" },
    take: 5000,
  });

  const csvHeaders = ["Invoice Number", "Student Name", "Admission No", "Parent Name", "Parent Email", "Total Amount", "Paid Amount", "Due Amount", "Due Date"];
  
  const rows = overdueInvoices.map((inv: typeof overdueInvoices[number]) => {
    const dueAmount = Number(inv.totalAmount) - Number(inv.paidAmount);
    const parent = inv.student.parentLinks[0]?.parent;
    return [
      inv.invoiceNumber,
      inv.student.name,
      inv.student.admissionNumber,
      parent?.name || "N/A",
      parent?.email || "N/A",
      inv.totalAmount.toString(),
      inv.paidAmount.toString(),
      dueAmount.toString(),
      format(inv.dueDate, "yyyy-MM-dd")
    ];
  });

  return {
    filename: `defaulters_export_${format(new Date(), "yyyyMMdd")}.csv`,
    csv: buildCSV(csvHeaders, rows)
  };
}

export async function exportCollectionsCSV(dateFrom?: string, dateTo?: string) {
  const viewer = await getViewer();
  
  // Build date filter
  const dateFilter: Record<string, any> = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) dateFilter.lte = new Date(dateTo);

  const payments = await prisma.payment.findMany({
    where: { 
      invoice: { student: { schoolId: viewer.schoolId as string } },
      status: "COMPLETED",
      ...(Object.keys(dateFilter).length > 0 ? { paymentDate: dateFilter } : {})
    },
    include: { invoice: { include: { student: true } }, receipt: true },
    orderBy: { paymentDate: "desc" },
    take: 5000,
  });

  const csvHeaders = ["Receipt Number", "Invoice Number", "Student Name", "Admission No", "Payment Date", "Amount", "Method", "Reference Number"];
  
  const rows = payments.map((pay: typeof payments[number]) => [
    pay.receipt?.receiptNumber || "N/A",
    pay.invoice.invoiceNumber,
    pay.invoice.student.name,
    pay.invoice.student.admissionNumber,
    format(pay.paymentDate, "yyyy-MM-dd HH:mm:ss"),
    pay.amount.toString(),
    pay.method,
    pay.referenceNumber || ""
  ]);

  return {
    filename: `collections_export_${format(new Date(), "yyyyMMdd")}.csv`,
    csv: buildCSV(csvHeaders, rows)
  };
}

export async function generateDailyReport() {
  const viewer = await getViewer();
  
  // 1. Fetch data
  const overdueInvoices = await prisma.invoice.findMany({
    where: { 
      student: { schoolId: viewer.schoolId as string }, 
      status: "OVERDUE"
    },
    include: { student: true },
    orderBy: { dueDate: "asc" },
    take: 100, // limited for daily summary
  });

  const recentPayments = await prisma.payment.findMany({
    where: { 
      invoice: { student: { schoolId: viewer.schoolId as string } },
      status: "COMPLETED",
      paymentDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // last 24 hours
    },
    include: { invoice: { include: { student: true } } },
    orderBy: { paymentDate: "desc" }
  });

  // 2. Generate PDF using jsPDF
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text("Daily Financial Report", 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on: ${format(new Date(), "PPpp")}`, 14, 30);

  // Collections Table
  doc.setFontSize(14);
  doc.text("Collections (Last 24 Hours)", 14, 45);
  
  const colRows = recentPayments.map(p => [
    p.invoice.student.name,
    p.amount.toString(),
    p.method,
    format(p.paymentDate, "HH:mm")
  ]);

  autoTable(doc, {
    startY: 50,
    head: [["Student", "Amount", "Method", "Time"]],
    body: colRows.length > 0 ? colRows : [["No collections in last 24h", "-", "-", "-"]]
  });

  // Overdue Table
  const finalY = (doc as any).lastAutoTable.finalY || 50;
  doc.setFontSize(14);
  doc.text("Top Overdue Invoices", 14, finalY + 15);

  const defRows = overdueInvoices.slice(0, 20).map(i => [
    i.student.name,
    i.invoiceNumber,
    (Number(i.totalAmount) - Number(i.paidAmount)).toString(),
    format(i.dueDate, "yyyy-MM-dd")
  ]);

  autoTable(doc, {
    startY: finalY + 20,
    head: [["Student", "Invoice", "Due Amount", "Due Date"]],
    body: defRows.length > 0 ? defRows : [["No overdue invoices", "-", "-", "-"]]
  });

  // 3. Output as base64 data URI
  const pdfBase64 = doc.output("datauristring");

  // 4. Save to ReportDocument model
  await prisma.reportDocument.create({
    data: {
      schoolId: viewer.schoolId as string,
      title: `Daily Report - ${format(new Date(), "yyyy-MM-dd")}`,
      pdfUrl: pdfBase64,
    }
  });

  revalidatePath("/reports");
}

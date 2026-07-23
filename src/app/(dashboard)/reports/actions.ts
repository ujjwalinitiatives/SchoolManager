"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessDeniedError, validateRole } from "@/lib/access-control";
import { headers } from "next/headers";
import { format } from "date-fns";

async function getViewer() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new AccessDeniedError("Not authenticated");
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true }
  });
  if (!user) throw new AccessDeniedError("User not found");
  
  validateRole(user.role, ["PRINCIPAL", "ACCOUNTANT"]);
  return user;
}

export async function exportDefaultersCSV() {
  const viewer = await getViewer();
  
  const overdueInvoices = await prisma.invoice.findMany({
    where: { 
      student: { schoolId: viewer.schoolId }, 
      status: "OVERDUE"
    },
    include: { student: { include: { parentLinks: { include: { parent: true } } } } },
    orderBy: { dueDate: "asc" }
  });

  const headers = ["Invoice Number", "Student Name", "Admission No", "Parent Name", "Parent Email", "Total Amount", "Paid Amount", "Due Amount", "Due Date"];
  
  const rows = overdueInvoices.map(inv => {
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
    ].map(field => `"${field}"`).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  
  return {
    filename: `defaulters_export_${format(new Date(), "yyyyMMdd")}.csv`,
    csv
  };
}

export async function exportCollectionsCSV() {
  const viewer = await getViewer();
  
  const payments = await prisma.payment.findMany({
    where: { 
      invoice: { student: { schoolId: viewer.schoolId } },
      status: "COMPLETED"
    },
    include: { invoice: { include: { student: true } }, receipt: true },
    orderBy: { paymentDate: "desc" }
  });

  const headers = ["Receipt Number", "Invoice Number", "Student Name", "Admission No", "Payment Date", "Amount", "Method", "Reference Number"];
  
  const rows = payments.map(pay => {
    return [
      pay.receipt?.receiptNumber || "N/A",
      pay.invoice.invoiceNumber,
      pay.invoice.student.name,
      pay.invoice.student.admissionNumber,
      format(pay.paymentDate, "yyyy-MM-dd HH:mm:ss"),
      pay.amount.toString(),
      pay.method,
      pay.referenceNumber || ""
    ].map(field => `"${field}"`).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  
  return {
    filename: `collections_export_${format(new Date(), "yyyyMMdd")}.csv`,
    csv
  };
}

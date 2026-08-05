import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { createElement, type ReactElement } from "react";

import { InvoicePdf } from "@/components/invoice-pdf";
import { getInvoiceForViewer } from "@/lib/invoice-access";
import { uploadPdf } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await context.params;
  const invoice = await getInvoiceForViewer(invoiceId);
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  // Temporarily disabling PDF caching to ensure new UI changes are visible.
  // if (invoice.pdfUrl) {
  //   return NextResponse.redirect(invoice.pdfUrl);
  // }

  const pdf = await renderToBuffer(
    createElement(InvoicePdf, {
      schoolName: invoice.student.school.name,
      schoolAddress: invoice.student.school.address,
      udiseCode: invoice.student.school.udiseCode,
      invoiceNumber: invoice.invoiceNumber,
      studentName: invoice.student.name,
      studentAddress: invoice.student.address,
      admissionNumber: invoice.student.admissionNumber,
      classSection: invoice.student.enrollments[0] ? `${invoice.student.enrollments[0].class.name} - ${invoice.student.enrollments[0].class.section}` : "N/A",
      dueDate: invoice.dueDate,
      cycleDate: invoice.feeRecord.cycleDate,
      totalAmount: invoice.totalAmount.toString(),
      paidAmount: invoice.paidAmount.toString(),
      status: invoice.status,
      items: invoice.items.map((item: { name: string; amount: any }) => ({ name: item.name, amount: item.amount.toString() })),
    }) as unknown as ReactElement<DocumentProps>,
  );

  // try {
  //   const url = await uploadPdf(`${invoice.invoiceNumber}.pdf`, Buffer.from(pdf), "invoices");
  //   if (url) {
  //     await prisma.invoice.update({
  //       where: { id: invoice.id },
  //       data: { pdfUrl: url },
  //     });
  //     return NextResponse.redirect(url);
  //   }
  // } catch (err) {
  //   console.error("Failed to upload PDF to blob, serving dynamically", err);
  // }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

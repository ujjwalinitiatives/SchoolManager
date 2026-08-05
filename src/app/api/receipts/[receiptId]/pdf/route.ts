import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { createElement, type ReactElement } from "react";

import { ReceiptPdf } from "@/components/receipt-pdf";
import { getCurrentViewer } from "@/lib/invoice-access";
import { uploadPdf } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = await context.params;
  const viewer = await getCurrentViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify access
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: {
      payment: {
        include: {
          invoice: {
            include: {
              student: {
                include: { school: true, parentLinks: true }
              }
            }
          }
        }
      },
      collectedBy: true,
    }
  });

  if (!receipt) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });

  const student = receipt.payment.invoice.student;
  
  // Scoping check
  if (viewer.schoolId !== student.schoolId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (viewer.role === "PARENT") {
    const isParent = student.parentLinks.some((link: { parentId: string }) => link.parentId === viewer.id);
    if (!isParent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (receipt.pdfUrl) {
    return NextResponse.redirect(receipt.pdfUrl);
  }

  const pdf = await renderToBuffer(
    createElement(ReceiptPdf, {
      schoolName: student.school.name,
      schoolAddress: student.school.address,
      receiptNumber: receipt.receiptNumber,
      invoiceNumber: receipt.payment.invoice.invoiceNumber,
      studentName: student.name,
      admissionNumber: student.admissionNumber,
      paymentDate: receipt.payment.paymentDate,
      amount: receipt.payment.amount.toString(),
      method: receipt.payment.method,
      referenceNumber: receipt.payment.referenceNumber,
      collectedBy: receipt.collectedBy?.name,
    }) as unknown as ReactElement<DocumentProps>,
  );

  try {
    const url = await uploadPdf(`${receipt.receiptNumber}.pdf`, Buffer.from(pdf), "receipts");
    if (url) {
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { pdfUrl: url },
      });
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.error("Failed to upload receipt PDF to blob, serving dynamically", err);
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${receipt.receiptNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

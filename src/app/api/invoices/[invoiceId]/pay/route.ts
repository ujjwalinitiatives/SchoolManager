import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getInvoiceForViewer } from "@/lib/invoice-access";
import { createPaymentOrder } from "@/lib/payment-gateway";

export async function POST(
  request: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await context.params;
    
    // Auth & Authorization handled inside getInvoiceForViewer
    const invoice = await getInvoiceForViewer(invoiceId);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const outstanding = new Prisma.Decimal(invoice.totalAmount).minus(invoice.paidAmount);
    
    if (outstanding.lte(0)) {
      return NextResponse.json({ error: "Invoice is already fully paid." }, { status: 400 });
    }

    // Create payment order
    const orderData = await createPaymentOrder(invoice.id, invoice.student.schoolId, outstanding);

    return NextResponse.json(orderData);
  } catch (error) {
    console.error(error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

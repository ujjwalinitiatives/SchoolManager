import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getInvoiceForViewer } from "@/lib/invoice-access";
import { createPaymentOrder } from "@/lib/payment-gateway";
import { prisma } from "@/lib/prisma";

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

    const body = await request.json().catch(() => ({}));
    const method = body.method || "ONLINE_GATEWAY";

    if (method === "UPI" || method === "GPAY") {
      // Direct UPI flow (student paid via QR/PhonePe)
      const payment = await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: outstanding,
          method: "UPI",
          status: "PROCESSING", // Accountant needs to manually confirm
        }
      });
      
      return NextResponse.json({ success: true, paymentId: payment.id });
    }

    // Default: Create payment order for gateway
    const orderData = await createPaymentOrder(invoice.id, invoice.student.schoolId, outstanding);

    return NextResponse.json(orderData);
  } catch (error) {
    console.error(error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

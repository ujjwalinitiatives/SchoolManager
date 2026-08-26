import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getInvoiceForViewer, getCurrentViewer } from "@/lib/invoice-access";
import { prisma } from "@/lib/prisma";
import { CheckoutButton } from "./checkout-button";
import { MarkPaidButton } from "./mark-paid-button";
import { ConfirmUpiButton } from "./confirm-upi-button";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" });
const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default async function InvoicePage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  const viewer = await getCurrentViewer();
  if (!viewer) redirect("/login");

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, student: { schoolId: viewer.schoolId as string } },
    include: {
      student: { include: { school: { include: { bankAccounts: true, paymentGateways: { where: { isActive: true } } } } } },
      items: true,
      payments: { orderBy: { paymentDate: "desc" } }
    }
  });
  if (!invoice) notFound();

  const outstanding = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/invoices" className="text-sm font-semibold text-blue-700 hover:text-blue-900">← All invoices</Link>
        <div className="flex gap-3 items-center">
          <a href={`/api/invoices/${invoice.id}/pdf`} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">Download PDF</a>
          {(viewer.role === "PRINCIPAL" || viewer.role === "ACCOUNTANT") && outstanding > 0 && (
            <MarkPaidButton invoiceId={invoice.id} outstanding={outstanding} />
          )}
          {viewer.role === "STUDENT" && outstanding > 0 && (
            <CheckoutButton 
              invoiceId={invoice.id} 
              amount={outstanding} 
              schoolUpiId={invoice.student.school.bankAccounts?.[0]?.upiId || undefined} 
              hasRazorpay={invoice.student.school.paymentGateways.length > 0}
            />
          )}
        </div>
      </div>
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b-4 border-blue-700 px-6 py-7 sm:px-9">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-blue-700">{invoice.student.school.name}</p>
              {invoice.student.school.address && <p className="text-xs text-slate-500 mt-1 max-w-sm">{invoice.student.school.address}</p>}
            </div>
            {invoice.student.school.udiseCode && <div className="text-right">
              <p className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">UDISE: {invoice.student.school.udiseCode}</p>
            </div>}
          </div>
          <h1 className="mt-6 text-3xl font-bold text-slate-950">Fee invoice</h1>
          <p className="mt-1 text-slate-600">{invoice.invoiceNumber}</p>
        </header>
        <div className="grid gap-6 px-6 py-7 sm:grid-cols-2 sm:px-9">
          <section>
            <p className="text-xs font-bold tracking-wide text-slate-500">BILLED TO</p>
            <p className="mt-2 font-semibold text-slate-900">{invoice.student.name}</p>
            {invoice.student.address && <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">{invoice.student.address}</p>}
            <p className="mt-2 text-sm text-slate-600">Admission no. {invoice.student.admissionNumber}</p>
          </section>
          <section className="sm:text-right">
            <p className="text-xs font-bold tracking-wide text-slate-500">DUE DATE</p>
            <p className="mt-2 font-semibold text-slate-900">{date.format(invoice.dueDate)}</p>
            <p className="mt-1 text-sm text-slate-600">Status: <span className="font-semibold text-blue-700">{invoice.status}</span></p>
          </section>
          
          <section>
            <p className="text-xs font-bold tracking-wide text-slate-500">ISSUE DATE</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{dateTime.format(invoice.createdAt)}</p>
          </section>
          
          {invoice.payments && invoice.payments.length > 0 && (
            <section className="sm:text-right col-span-1 sm:col-span-2 mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-bold tracking-wide text-slate-500 mb-2">PAYMENT HISTORY</p>
              <div className="space-y-3">
                {invoice.payments.map((payment: any) => (
                  <div key={payment.id} className="flex justify-between items-center rounded-lg bg-slate-50 px-4 py-3 border border-slate-100">
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">{currency.format(Number(payment.amount))} via {payment.method}</p>
                      <p className="text-xs text-slate-500">{dateTime.format(new Date(payment.paymentDate))}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${payment.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {payment.status}
                      </span>
                      {payment.status === "PROCESSING" && (viewer.role === "PRINCIPAL" || viewer.role === "ACCOUNTANT") && (
                        <ConfirmUpiButton paymentId={payment.id} expectedAmount={Number(payment.amount)} outstanding={outstanding} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        <div className="px-6 pb-7 sm:px-9">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="grid grid-cols-[1fr_auto] bg-slate-50 px-4 py-3 text-xs font-bold tracking-wide text-slate-500"><span>FEE COMPONENT</span><span>AMOUNT</span></div>
            {invoice.items.map((item: { id: string; name: string; amount: any }) => <div key={item.id} className="grid grid-cols-[1fr_auto] border-t border-slate-100 px-4 py-4 text-slate-700"><span>{item.name}</span><span>{currency.format(Number(item.amount))}</span></div>)}
          </div>
          <dl className="ml-auto mt-6 max-w-xs space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="font-bold text-slate-900">Total</dt>
              <dd className="font-bold text-slate-900">{currency.format(Number(invoice.totalAmount))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-bold text-slate-900">Paid</dt>
              <dd className="font-bold text-slate-900">{currency.format(Number(invoice.paidAmount))}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-3 text-base">
              <dt className="font-bold text-slate-900">Outstanding</dt>
              <dd className="font-bold text-rose-700">{currency.format(outstanding)}</dd>
            </div>
          </dl>
          
          <div className="mt-12 border-t border-slate-300 pt-6 text-center">
            <p className="text-sm font-bold text-blue-800">Digitally verified by Accountant / Principal</p>
            <p className="text-xs text-slate-500 mt-1">This is a computer-generated invoice.</p>
          </div>
        </div>
      </article>
    </main>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getInvoiceForViewer, getCurrentViewer } from "@/lib/invoice-access";
import { CheckoutButton } from "./checkout-button";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" });

export default async function InvoicePage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  const viewer = await getCurrentViewer();
  if (!viewer) redirect("/login");

  const invoice = await getInvoiceForViewer(invoiceId);
  if (!invoice) notFound();

  const outstanding = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/invoices" className="text-sm font-semibold text-blue-700 hover:text-blue-900">← All invoices</Link>
        <div className="flex gap-3 items-center">
          <a href={`/api/invoices/${invoice.id}/pdf`} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">Download PDF</a>
          {outstanding > 0 && <CheckoutButton invoiceId={invoice.id} amount={outstanding} />}
        </div>
      </div>
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b-4 border-blue-700 px-6 py-7 sm:px-9">
          <p className="text-sm font-semibold text-blue-700">{invoice.student.school.name}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Fee invoice</h1>
          <p className="mt-1 text-slate-600">{invoice.invoiceNumber}</p>
        </header>
        <div className="grid gap-6 px-6 py-7 sm:grid-cols-2 sm:px-9">
          <section><p className="text-xs font-bold tracking-wide text-slate-500">BILLED TO</p><p className="mt-2 font-semibold text-slate-900">{invoice.student.name}</p><p className="mt-1 text-sm text-slate-600">Admission no. {invoice.student.admissionNumber}</p></section>
          <section className="sm:text-right"><p className="text-xs font-bold tracking-wide text-slate-500">DUE DATE</p><p className="mt-2 font-semibold text-slate-900">{date.format(invoice.dueDate)}</p><p className="mt-1 text-sm text-slate-600">Status: {invoice.status}</p></section>
        </div>
        <div className="px-6 pb-7 sm:px-9">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="grid grid-cols-[1fr_auto] bg-slate-50 px-4 py-3 text-xs font-bold tracking-wide text-slate-500"><span>FEE COMPONENT</span><span>AMOUNT</span></div>
            {invoice.items.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto] border-t border-slate-100 px-4 py-4 text-slate-700"><span>{item.name}</span><span>{currency.format(Number(item.amount))}</span></div>)}
          </div>
          <dl className="ml-auto mt-6 max-w-xs space-y-3 text-sm"><div className="flex justify-between"><dt className="text-slate-600">Total</dt><dd className="font-medium">{currency.format(Number(invoice.totalAmount))}</dd></div><div className="flex justify-between"><dt className="text-slate-600">Paid</dt><dd className="font-medium">{currency.format(Number(invoice.paidAmount))}</dd></div><div className="flex justify-between border-t border-slate-300 pt-3 text-base"><dt className="font-bold text-slate-900">Outstanding</dt><dd className="font-bold text-rose-700">{currency.format(outstanding)}</dd></div></dl>
        </div>
      </article>
    </main>
  );
}

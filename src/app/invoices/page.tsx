import Link from "next/link";
import { redirect } from "next/navigation";

import { getParentInvoices } from "@/lib/invoice-access";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export default async function ParentInvoicesPage() {
  const { viewer, invoices } = await getParentInvoices();
  if (!viewer) redirect("/login");
  if (viewer.role !== "PARENT") redirect("/dashboard");

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-blue-700">PARENT PORTAL</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Your child&apos;s invoices</h1>
        <p className="mt-2 text-slate-600">Review fee invoices and download a printable PDF whenever needed.</p>
      </header>
      {invoices.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No invoices are available yet.</section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.3fr_1fr_1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold tracking-wide text-slate-500 sm:grid">
            <span>INVOICE</span><span>STUDENT</span><span>AMOUNT / DUE</span><span />
          </div>
          {invoices.map((invoice) => (
            <article key={invoice.id} className="grid gap-3 border-b border-slate-100 px-5 py-5 last:border-0 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-center">
              <div><p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p><p className="mt-1 text-sm text-slate-500">{invoice.status}</p></div>
              <div><p className="font-medium text-slate-800">{invoice.student.name}</p><p className="mt-1 text-sm text-slate-500">{invoice.student.admissionNumber}</p></div>
              <div><p className="font-medium text-slate-800">{currency.format(Number(invoice.totalAmount))}</p><p className="mt-1 text-sm text-slate-500">Due {date.format(invoice.dueDate)}</p></div>
              <Link className="inline-flex justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href={`/invoices/${invoice.id}`}>View invoice</Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

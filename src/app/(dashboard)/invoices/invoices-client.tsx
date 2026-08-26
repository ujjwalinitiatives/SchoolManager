"use client";

import { useState } from "react";
import Link from "next/link";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

const statusBadge: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  PENDING: "bg-slate-100 text-slate-600",
  OVERDUE: "bg-rose-100 text-rose-700",
};

const statusLabel: Record<string, string> = {
  PAID: "Paid",
  PARTIAL: "Partial Paid",
  PENDING: "Pending",
  OVERDUE: "Overdue",
};

export function InvoicesClient({ invoices, isParent }: { invoices: any[], isParent: boolean }) {
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");

  if (invoices.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
        No invoices are available yet.
      </section>
    );
  }

  // If parent/student, just show flat list
  if (isParent || invoices.every(inv => !inv.student.enrollments)) {
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.3fr_1fr_1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold tracking-wide text-slate-500 sm:grid">
          <span>INVOICE</span><span>STUDENT</span><span>AMOUNT / DUE</span><span />
        </div>
        {invoices.map((invoice) => {
          const paid = Number(invoice.paidAmount || 0);
          const total = Number(invoice.totalAmount);
          const outstanding = total - paid;
          return (
          <article key={invoice.id} className="grid gap-3 border-b border-slate-100 px-5 py-5 last:border-0 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-center">
            <div>
              <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
              <span className={`mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded-md ${statusBadge[invoice.status] || statusBadge.PENDING}`}>
                {statusLabel[invoice.status] || invoice.status}
              </span>
            </div>
            <div><p className="font-medium text-slate-800">{invoice.student.name}</p><p className="mt-1 text-sm text-slate-500">{invoice.student.admissionNumber}</p></div>
            <div>
              <p className="font-medium text-slate-800">{currency.format(total)}</p>
              {paid > 0 && paid < total && (
                <p className="mt-0.5 text-xs text-emerald-600">Paid: {currency.format(paid)}</p>
              )}
              {outstanding > 0 && (
                <p className="mt-0.5 text-xs text-rose-600">Due: {currency.format(outstanding)}</p>
              )}
              <p className="mt-0.5 text-xs text-slate-400">Due {date.format(new Date(invoice.dueDate))}</p>
            </div>
            <Link className="inline-flex justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href={`/invoices/${invoice.id}`}>View invoice</Link>
          </article>
          );
        })}
      </section>
    );
  }

  // Group by Class for Admins
  const classMap = new Map<string, string>(); // classId -> "Class Name - Section"
  invoices.forEach(inv => {
    const enr = inv.student.enrollments?.[0];
    if (enr) {
      classMap.set(enr.class.id || `${enr.class.name}-${enr.class.section}`, `${enr.class.name} - ${enr.class.section}`);
    }
  });

  const classes = Array.from(classMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));

  const filteredInvoices = selectedClassId === "ALL" 
    ? invoices 
    : invoices.filter(inv => {
        const enr = inv.student.enrollments?.[0];
        const cid = enr?.class.id || `${enr?.class.name}-${enr?.class.section}`;
        return cid === selectedClassId;
      });

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedClassId("ALL")}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${selectedClassId === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          All Classes
        </button>
        {classes.map(([id, name]) => (
          <button
            key={id}
            onClick={() => setSelectedClassId(id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${selectedClassId === id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {name}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.3fr_1.5fr_1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold tracking-wide text-slate-500 sm:grid">
          <span>INVOICE</span><span>STUDENT</span><span>AMOUNT / DUE</span><span />
        </div>
        {filteredInvoices.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No invoices in this class.</div>
        ) : (
          filteredInvoices.map((invoice) => {
            const enr = invoice.student.enrollments?.[0];
            const classSection = enr ? `${enr.class.name} - ${enr.class.section}` : "N/A";
            const paid = Number(invoice.paidAmount || 0);
            const total = Number(invoice.totalAmount);
            const invoiceOutstanding = total - paid;
            return (
              <article key={invoice.id} className="grid gap-3 border-b border-slate-100 px-5 py-5 last:border-0 sm:grid-cols-[1.3fr_1.5fr_1fr_auto] sm:items-center">
                <div>
                  <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                  <span className={`mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded-md ${statusBadge[invoice.status] || statusBadge.PENDING}`}>
                    {statusLabel[invoice.status] || invoice.status}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-slate-800">{invoice.student.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{invoice.student.admissionNumber} • {classSection}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-800">{currency.format(total)}</p>
                  {paid > 0 && paid < total && (
                    <p className="mt-0.5 text-xs text-emerald-600">Paid: {currency.format(paid)}</p>
                  )}
                  {invoiceOutstanding > 0 && (
                    <p className="mt-0.5 text-xs text-rose-600">Due: {currency.format(invoiceOutstanding)}</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-400">Due {date.format(new Date(invoice.dueDate))}</p>
                </div>
                <Link className="inline-flex justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href={`/invoices/${invoice.id}`}>View invoice</Link>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

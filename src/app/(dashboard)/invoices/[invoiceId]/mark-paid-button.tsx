"use client";

import { useState } from "react";
import { markInvoiceAsPaidByCash } from "./actions";

export function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleMarkPaid() {
    if (!confirm("Are you sure you want to mark this invoice as paid by CASH? This action cannot be undone.")) return;
    
    setLoading(true);
    try {
      await markInvoiceAsPaidByCash(invoiceId);
    } catch (error: any) {
      alert(error.message || "Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleMarkPaid}
      disabled={loading}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      {loading ? "Processing..." : "Mark as Paid (Cash)"}
    </button>
  );
}

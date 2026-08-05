"use client";

import { useState } from "react";
import { confirmUpiPayment } from "./actions";

export function ConfirmUpiButton({ paymentId }: { paymentId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!confirm("Are you sure you want to confirm this UPI payment as RECEIVED?")) return;
    
    setLoading(true);
    try {
      await confirmUpiPayment(paymentId);
    } catch (error: any) {
      alert(error.message || "Failed to confirm payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={loading}
      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Confirming..." : "Confirm Payment"}
    </button>
  );
}

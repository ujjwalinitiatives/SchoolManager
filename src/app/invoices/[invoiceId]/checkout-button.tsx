"use client";

import { useState } from "react";

export function CheckoutButton({ invoiceId, amount }: { invoiceId: string; amount: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handlePayment() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: "POST",
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate payment");
      }

      // Simulate a payment flow window (Normally you'd open Razorpay/Stripe here)
      // Since it's simulated, we'll just show an alert and tell them to check webhook logs
      alert(`Simulating payment for Order ID: ${data.orderId} via ${data.provider}. In a real environment, the payment SDK modal would open here.`);
      
      // To simulate the webhook firing, we could make a direct call to the webhook endpoint,
      // but in a real system the gateway does this. Let's just set success for the UI.
      setSuccess(true);
      
      // Refresh the page to reflect new status after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return <span className="text-sm font-semibold text-emerald-600">Payment Initiated. Verifying...</span>;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handlePayment}
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : `Pay INR ${amount.toFixed(2)}`}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}

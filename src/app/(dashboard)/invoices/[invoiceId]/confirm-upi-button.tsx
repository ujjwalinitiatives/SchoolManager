"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmUpiPayment } from "./actions";
import { X } from "lucide-react";

export function ConfirmUpiButton({ paymentId, expectedAmount, outstanding }: { paymentId: string; expectedAmount: number; outstanding: number }) {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState(expectedAmount.toFixed(2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleConfirm() {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Enter the amount received.");
      return;
    }
    if (numAmount > outstanding) {
      setError(`Amount cannot exceed outstanding ₹${outstanding.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await confirmUpiPayment(paymentId, numAmount);
      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to confirm payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setAmount(expectedAmount.toFixed(2)); setError(null); setShowModal(true); }}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Verify & Confirm
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-950 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Verify UPI Payment</h3>
              <button onClick={() => !loading && setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
                Check your bank/UPI app and enter the actual amount received from the parent.
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Actual Amount Received (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={outstanding}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-3 text-lg font-semibold text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:text-white"
                  disabled={loading}
                />
              </div>

              {parseFloat(amount) > 0 && parseFloat(amount) < outstanding && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  Partial payment — remaining ₹{(outstanding - parseFloat(amount)).toFixed(2)} will stay outstanding
                </div>
              )}

              {error && <p className="text-xs text-rose-600 text-center">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} disabled={loading} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleConfirm} disabled={loading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {loading ? "Confirming..." : `Confirm ₹${parseFloat(amount || "0").toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

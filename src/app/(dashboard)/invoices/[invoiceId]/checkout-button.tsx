"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle, Smartphone } from "lucide-react";

export function CheckoutButton({ invoiceId, amount, schoolUpiId, hasRazorpay = false }: { invoiceId: string; amount: number; schoolUpiId?: string; hasRazorpay?: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "verifying" | "success">("idle");
  const [selectedMethod, setSelectedMethod] = useState<"UPI" | "GPAY" | "CARD">("UPI");
  const router = useRouter();

  async function handleConfirmPayment() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: selectedMethod })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate payment");
      }

      setStatus("success");
      
      setTimeout(() => {
        setShowModal(false);
        router.refresh();
      }, 1500);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  function handleSelectMethod(method: "UPI" | "GPAY" | "CARD") {
    if (method === "CARD" && !hasRazorpay) {
      setError("Debit/Credit Card payment is not configured. Please choose another method.");
      return;
    }
    setError(null);
    setSelectedMethod(method);
  }

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 hover:shadow transition-all"
        >
          Pay INR {amount.toFixed(2)}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                Payment Gateway
              </h3>
              <button 
                onClick={() => !loading && setShowModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {status === "success" ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-in zoom-in" />
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Payment Successful!</h4>
                  <p className="text-sm text-slate-500">Redirecting to invoice...</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <p className="text-sm text-slate-500 mb-1">Total Amount Payable</p>
                    <p className="text-3xl font-bold text-slate-900">₹{amount.toFixed(2)}</p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <button 
                      onClick={() => handleSelectMethod("UPI")}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${selectedMethod === "UPI" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">UPI</div>
                        <span className="font-medium text-slate-900">Google Pay / Paytm / PhonePe</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${selectedMethod === "UPI" ? "border-blue-600 bg-blue-600" : "border-slate-300"}`} />
                    </button>

                    <button 
                      onClick={() => handleSelectMethod("GPAY")}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${selectedMethod === "GPAY" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">GPay</div>
                        <span className="font-medium text-slate-900">Google Pay</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${selectedMethod === "GPAY" ? "border-blue-600 bg-blue-600" : "border-slate-300"}`} />
                    </button>
                    
                    <button 
                      onClick={() => handleSelectMethod("CARD")}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${selectedMethod === "CARD" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">CR</div>
                        <span className="font-medium text-slate-900">Credit / Debit Card</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${selectedMethod === "CARD" ? "border-blue-600 bg-blue-600" : "border-slate-300"}`} />
                    </button>
                  </div>

                  {error && <p className="text-xs text-rose-600 text-center mb-4">{error}</p>}

                  {(selectedMethod === "UPI" || selectedMethod === "GPAY") && schoolUpiId ? (
                    <div className="mb-6 flex flex-col items-center">
                      <p className="text-sm font-medium text-slate-700 mb-2">Pay directly via UPI</p>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${schoolUpiId}&pn=School&am=${amount}&cu=INR`)}`} 
                        alt="UPI QR Code" 
                        className="w-32 h-32 mb-4 border border-slate-200 rounded-lg p-2"
                      />
                      <a 
                        href={`upi://pay?pa=${schoolUpiId}&pn=School&am=${amount}&cu=INR`}
                        className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-900 flex items-center justify-center mb-3"
                      >
                        Pay on Mobile
                      </a>
                      <button
                        onClick={handleConfirmPayment}
                        disabled={loading}
                        className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 hover:shadow-md disabled:opacity-50 transition-all flex items-center justify-center"
                      >
                        {loading ? "Processing..." : "Confirm I Have Paid"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleConfirmPayment}
                      disabled={loading}
                      className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 hover:shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                          Processing...
                        </>
                      ) : (
                        `Pay ₹${amount.toFixed(2)} Securely`
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

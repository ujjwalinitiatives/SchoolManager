"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

function VerifyEmailForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(10);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  async function handleResend() {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP");
      setResendCooldown(10);
      alert("New OTP sent to your email!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[32rem] animate-fade-in relative z-10">
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 mb-4">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Verify your email</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          We sent a 6-digit verification code to <strong className="text-slate-900 dark:text-slate-200">{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-8 sm:p-10">
        {error && (
          <div className="mb-6 rounded-xl bg-rose-50/80 dark:bg-rose-900/30 border border-rose-200/50 dark:border-rose-800/50 p-4 text-sm font-medium text-rose-700 dark:text-rose-400 flex items-start gap-3 backdrop-blur-sm">
            {error}
          </div>
        )}

        <div className="group mb-6">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
            className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4 py-3 text-center text-2xl tracking-widest font-bold focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-white transition-colors"
            placeholder="000000"
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length < 6}
          className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-blue-500/40 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
        >
          {loading ? "Verifying..." : "Verify & Continue"} <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className="text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:hover:text-slate-500"
          >
            {resending ? "Resending..." : resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-premium py-12 px-4 relative overflow-hidden">
      <Suspense fallback={<div className="animate-pulse flex flex-col items-center"><div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4"></div><div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div></div>}>
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}

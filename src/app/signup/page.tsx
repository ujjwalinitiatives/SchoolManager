"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Building2, ShieldCheck, Mail, Lock, User, Hash, CreditCard } from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [udiseCode, setUdiseCode] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Password strength calculation
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };
  const strengthScore = calculateStrength(password);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.email({ email, password, name });
      if (result.error) {
        setError(result.error.message || "Sign up failed. Please try again.");
      } else {
        await fetch("/api/auth/assign-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, schoolName, udiseCode, paymentDetails }),
        });
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-premium py-12 px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-[32rem] animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 mb-4 hover:scale-105 transition-transform">
            <ShieldCheck className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Register School</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Create your principal account and setup your institution</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 sm:p-10">
          {error && (
            <div className="mb-6 rounded-xl bg-rose-50/80 dark:bg-rose-900/30 border border-rose-200/50 dark:border-rose-800/50 p-4 text-sm font-medium text-rose-700 dark:text-rose-400 flex items-start gap-3 backdrop-blur-sm">
              <svg className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" /> School Name
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                placeholder="E.g., Springfield High"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-slate-400" /> UDISE Code <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={udiseCode}
                  onChange={(e) => setUdiseCode(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                  placeholder="11-digit code"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-400" /> Payment Account
                </label>
                <input
                  type="text"
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  required
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                  placeholder="E.g., UPI ID or Acct No"
                />
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800/60 my-6" />

            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" /> Principal Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                placeholder="Your full name"
              />
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                placeholder="Min. 8 characters"
              />
              {password && (
                <div className="mt-3">
                  <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-full flex-1 transition-colors duration-300 ${
                          strengthScore >= level ? strengthColors[strengthScore - 1] : "bg-transparent"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`mt-1.5 text-xs font-medium ${strengthScore > 0 ? strengthColors[strengthScore - 1].replace('bg-', 'text-') : 'text-slate-500'}`}>
                    Password strength: {strengthScore > 0 ? strengthLabels[strengthScore - 1] : "Too short"}
                  </p>
                </div>
              )}
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" /> Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                placeholder="Re-enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-blue-500/40 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            {loading ? "Creating account..." : "Complete Registration"}
          </button>

          <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800/60 pt-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                Sign in to Portal
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}

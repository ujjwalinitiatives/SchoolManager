"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { UserCog, Calculator, Users, GraduationCap, Shield } from "lucide-react";
import { enforceRoleMatch } from "./actions";

type LoginRole = "PRINCIPAL" | "ACCOUNTANT" | "TEACHER" | "PARENT";

export default function LoginPage() {
  const [role, setRole] = useState<LoginRole>("PRINCIPAL");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Enforce role match BEFORE creating session to avoid Next.js Server Action CSRF cookie mismatch
      const roleCheck = await enforceRoleMatch(email, role);
      if (!roleCheck.success) {
        setError(roleCheck.error || "Role mismatch.");
        setLoading(false);
        return;
      }

      // 2. Perform sign in
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || "Invalid email or password.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-premium px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-[28rem] animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Sign In</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Sign in to your SchoolManager portal</p>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-2 glass p-1.5 rounded-2xl">
          {[
            { id: "PRINCIPAL", icon: UserCog, label: "Principal" },
            { id: "ACCOUNTANT", icon: Calculator, label: "Accountant" },
            { id: "TEACHER", icon: Users, label: "Teacher" },
            { id: "PARENT", icon: GraduationCap, label: "Parent" },
          ].map((r) => {
            const Icon = r.icon;
            const isActive = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id as LoginRole)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-[11px] font-bold transition-all ${
                  isActive
                    ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 scale-105"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "opacity-100" : "opacity-70"}`} />
                <span className="uppercase tracking-wider">{r.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8">
          {error && (
            <div className="mb-6 rounded-xl bg-rose-50/80 dark:bg-rose-900/30 border border-rose-200/50 dark:border-rose-800/50 p-4 text-sm font-medium text-rose-700 dark:text-rose-400 flex items-start gap-3 backdrop-blur-sm">
              <svg className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                placeholder="you@school.edu"
              />
            </div>



            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-blue-500/40 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            {loading ? "Authenticating..." : "Sign In"}
          </button>

          {role === "PRINCIPAL" && (
            <div className="mt-5 text-center">
              <Link href="/forgot-password" className="text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                Forgot your password?
              </Link>
            </div>
          )}

          <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800/60 pt-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              New school?{" "}
              <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                Register as Principal
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}

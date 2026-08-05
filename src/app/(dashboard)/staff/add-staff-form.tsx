"use client";

import { useState, useTransition } from "react";
import { addStaffMember } from "./actions";

export function AddStaffForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ tempPassword: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("");

  const classNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const sections = ["A", "B", "C", "D", "E"];

  function handleSubmit(formData: FormData) {
    setError(null);
    setResult(null);
    const email = formData.get("email") as string;

    startTransition(async () => {
      try {
        const res = await addStaffMember(formData);
        if ('error' in res && res.error) {
          setError(res.error);
        } else if ('tempPassword' in res && res.tempPassword) {
          setResult({ tempPassword: res.tempPassword, email });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to add staff member.");
      }
    });
  }

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-5">Add Staff / Member</h2>

      {result && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-bold text-emerald-800">✅ Member added successfully!</p>
          <p className="mt-2 text-emerald-700">
            Share these credentials with <strong>{result.email}</strong>:
          </p>
          <div className="mt-2 rounded-md bg-white border border-emerald-200 px-4 py-3 font-mono text-sm text-slate-900">
            <p>Email: <strong>{result.email}</strong></p>
            <p>Temp Password: <strong>{result.tempPassword}</strong></p>
          </div>
          <p className="mt-2 text-xs text-emerald-600">They should change their password after first login.</p>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          Full Name *
          <input name="name" required maxLength={100} placeholder="Member's full name" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          Email *
          <input name="email" type="email" required placeholder="member@email.com" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          Role *
          <select 
            name="role" 
            required 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white"
          >
            <option value="" className="dark:bg-slate-900">Select role</option>
            <option value="TEACHER" className="dark:bg-slate-900">Teacher</option>
            <option value="ACCOUNTANT" className="dark:bg-slate-900">Accountant</option>
          </select>
        </label>
        
        {role === "TEACHER" && (
          <>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              Assigned Class (Optional)
              <select name="className" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white">
                <option value="" className="dark:bg-slate-900">None</option>
                {classNames.map(name => (
                  <option key={name} value={name} className="dark:bg-slate-900">{name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              Assigned Section (Optional)
              <select name="section" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white">
                <option value="" className="dark:bg-slate-900">None</option>
                {sections.map(sec => (
                  <option key={sec} value={sec} className="dark:bg-slate-900">{sec}</option>
                ))}
              </select>
            </label>
          </>
        )}

        <div className="sm:col-span-2 lg:col-span-4 mt-2">
          <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 transition-all disabled:opacity-70">
            {isPending ? "Adding Member..." : "Add Member"}
          </button>
        </div>
      </form>
    </section>
  );
}

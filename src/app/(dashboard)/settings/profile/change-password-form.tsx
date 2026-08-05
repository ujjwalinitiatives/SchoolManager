"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { error: changeErr } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true
      });

      if (changeErr) {
        setError(changeErr.message || "Failed to change password.");
      } else {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 max-w-md">
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          Password changed successfully!
        </div>
      )}

      <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <span>Current Password</span>
        <input 
          type="password"
          name="currentPassword" 
          required 
          className="rounded-lg border border-slate-300 px-3 py-2.5 bg-white dark:bg-slate-900 shadow-sm" 
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <span>New Password</span>
        <input 
          type="password"
          name="newPassword" 
          required 
          minLength={8}
          className="rounded-lg border border-slate-300 px-3 py-2.5 bg-white dark:bg-slate-900 shadow-sm" 
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <span>Confirm New Password</span>
        <input 
          type="password"
          name="confirmPassword" 
          required 
          minLength={8}
          className="rounded-lg border border-slate-300 px-3 py-2.5 bg-white dark:bg-slate-900 shadow-sm" 
        />
      </label>

      <div className="pt-2">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Changing Password..." : "Change Password"}
        </button>
      </div>
    </form>
  );
}

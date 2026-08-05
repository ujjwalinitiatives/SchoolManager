"use client";

import { useState } from "react";
import { saveUpiId } from "./actions";

export function DirectUpiForm({ initialUpiId }: { initialUpiId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [currentUpiId, setCurrentUpiId] = useState(initialUpiId || "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const newUpiId = formData.get("upiId") as string;
      await saveUpiId(formData);
      setCurrentUpiId(newUpiId);
      alert("Saved successfully!");
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2 items-end">
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        <span>UPI ID (VPA)</span>
        <input 
          name="upiId" 
          required 
          placeholder="e.g. yourname@okicici" 
          defaultValue={currentUpiId}
          className="rounded-lg border border-slate-300 px-3 py-2.5" 
        />
      </label>
      <div>
        <button 
          type="submit" 
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : (currentUpiId ? "Change UPI ID" : "Save UPI ID")}
        </button>
      </div>
    </form>
  );
}

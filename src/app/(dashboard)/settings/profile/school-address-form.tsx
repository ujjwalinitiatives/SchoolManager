"use client";

import { useState, useTransition } from "react";
import { updateSchoolAddress } from "./actions";

export function SchoolAddressForm({ initialAddress }: { initialAddress: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [address, setAddress] = useState(initialAddress || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("address", address);

    startTransition(async () => {
      try {
        const res = await updateSchoolAddress(formData);
        if (res?.success) {
          alert("School address updated successfully.");
        }
      } catch (err: any) {
        alert(err.message || "Failed to update address.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Physical Address
      </label>
      <textarea
        rows={3}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="123 Education Lane..."
        className="mb-4 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Address"}
      </button>
    </form>
  );
}

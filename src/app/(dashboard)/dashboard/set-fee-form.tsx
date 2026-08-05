"use client";

import { useState } from "react";
import { setFeeForClassName } from "./actions";

export function SetFeeForm({ distinctClassNames, existingFees }: { 
  distinctClassNames: string[], 
  existingFees: Record<string, { amount: number, frequency: string, name: string }[]> 
}) {
  const [selectedClass, setSelectedClass] = useState(distinctClassNames[0] || "");
  const [selectedFeeName, setSelectedFeeName] = useState<string>("NEW_FEE");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // When class changes, reset fee selection
  const classFees = existingFees[selectedClass] || [];
  const currentFee = classFees.find(f => f.name === selectedFeeName);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await setFeeForClassName(formData);
      if (res?.error) {
        alert(res.error);
        return;
      }
      alert("Fee saved successfully for all sections of " + selectedClass);
    } catch (err: any) {
      alert("Failed to save fee: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (distinctClassNames.length === 0) {
    return <p className="text-sm text-slate-500 p-6">No classes found in the school. Please add students/classes first.</p>;
  }

  return (
    <div>
      <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Set Class Fees</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Configure global fee structures for classes (applies to all sections).</p>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {isOpen ? "Close" : "Configure Fees"}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="p-6 grid gap-5 sm:grid-cols-2 bg-slate-50 dark:bg-slate-900/20">
          <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span>Select Class</span>
            <select 
              name="className" 
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedFeeName("NEW_FEE");
              }}
              className="rounded-lg border border-slate-300 px-3 py-2.5 bg-white dark:bg-slate-950 shadow-sm"
            >
              {distinctClassNames.map(name => (
                <option key={name} value={name}>Class {name}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span>Select Fee to Edit</span>
            <select 
              value={selectedFeeName}
              onChange={(e) => setSelectedFeeName(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2.5 bg-white dark:bg-slate-950 shadow-sm"
            >
              <option value="NEW_FEE">+ Create New Fee</option>
              {classFees.map(f => (
                <option key={f.name} value={f.name}>{f.name} ({f.frequency})</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
            <span>Fee Name</span>
            <input 
              name="name" 
              required 
              key={selectedClass + "-" + selectedFeeName + "-name"}
              defaultValue={currentFee?.name || (classFees.length === 0 ? "Tuition Fee" : "")}
              placeholder="e.g. Tuition Fee, Yearly Dev Fee"
              readOnly={selectedFeeName !== "NEW_FEE"}
              className={`rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm bg-white dark:bg-slate-950 ${selectedFeeName !== "NEW_FEE" ? "opacity-70 cursor-not-allowed bg-slate-100" : ""}`} 
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span>Amount (₹)</span>
            <input 
              name="amount" 
              type="number" 
              step="0.01" 
              required 
              key={selectedClass + "-" + selectedFeeName + "-amt"}
              defaultValue={currentFee?.amount || ""} 
              className="rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm bg-white dark:bg-slate-950" 
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span>Frequency</span>
            <select 
              name="frequency" 
              key={selectedClass + "-" + selectedFeeName + "-freq"}
              defaultValue={currentFee?.frequency || "MONTHLY"}
              disabled={selectedFeeName !== "NEW_FEE"}
              className={`rounded-lg border border-slate-300 px-3 py-2.5 bg-white shadow-sm dark:bg-slate-950 ${selectedFeeName !== "NEW_FEE" ? "opacity-70 cursor-not-allowed bg-slate-100" : ""}`}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
              <option value="ONE_TIME">One Time</option>
            </select>
          </label>

          <div className="sm:col-span-2 flex gap-3">
            {selectedFeeName !== "NEW_FEE" && (
              <input type="hidden" name="frequency" value={currentFee?.frequency || "MONTHLY"} />
            )}
            <button 
              type="submit" 
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : (currentFee ? "Change Fee Amount" : "Set New Fee")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

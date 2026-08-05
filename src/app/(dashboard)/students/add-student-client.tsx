"use client";

import { useTransition, useState } from "react";
import { addStudent } from "./actions";

export function AddStudentClient() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ tempPassword: string; studentEmail: string } | null>(null);
  
  const classNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const sections = ["A", "B", "C", "D", "E"];

  function handleSubmit(formData: FormData) {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await addStudent(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.tempPassword && res?.studentEmail) {
        // Clear form on success
        const form = document.getElementById("add-student-form") as HTMLFormElement;
        if (form) form.reset();
        setResult({ tempPassword: res.tempPassword, studentEmail: res.studentEmail });
      }
    });
  }

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-5">Add New Student</h2>
      
      {result && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-bold text-emerald-800">✅ Student added successfully!</p>
          <p className="mt-2 text-emerald-700">
            Provide these credentials to the student to log in. They can change their password after the first login:
          </p>
          <div className="mt-2 rounded-md bg-white border border-emerald-200 px-4 py-3 font-mono text-sm text-slate-900">
            <p>Student Email: <strong>{result.studentEmail}</strong></p>
            <p>Temp Password: <strong>{result.tempPassword}</strong></p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form id="add-student-form" action={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          Student Name *
          <input name="name" required maxLength={100} placeholder="Full name" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white" />
        </label>
        
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          Class *
          <select name="className" required className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white">
            <option value="" className="dark:bg-slate-900">Select class</option>
            {classNames.map((name) => (
              <option key={name} value={name} className="dark:bg-slate-900">{name}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          Section *
          <select name="section" required className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white">
            <option value="" className="dark:bg-slate-900">Select section</option>
            {sections.map((sec) => (
              <option key={sec} value={sec} className="dark:bg-slate-900">{sec}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          Date of Birth
          <input name="dateOfBirth" type="date" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white [color-scheme:light] dark:[color-scheme:dark]" />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          Student Email *
          <input name="studentEmail" type="email" required placeholder="student@email.com" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white" />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          Parent Email <span className="font-normal text-slate-400">(optional)</span>
          <input name="parentEmail" type="email" placeholder="parent@email.com" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white" />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2 lg:col-span-3">
          Address <span className="font-normal text-slate-400">(optional)</span>
          <input name="address" type="text" placeholder="123 Student Lane..." className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white" />
        </label>

        <div className="sm:col-span-2 lg:col-span-3 mt-2 flex items-center gap-4">
          <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 transition-all disabled:opacity-70">
            {isPending ? "Adding..." : "Add Student"}
          </button>
          {error && <span className="text-sm font-medium text-red-500">{error}</span>}
        </div>
      </form>
    </section>
  );
}

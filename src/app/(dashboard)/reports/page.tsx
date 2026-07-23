"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { exportDefaultersCSV, exportCollectionsCSV } from "./actions";

export default function ReportsPage() {
  const [loadingDefaulters, setLoadingDefaulters] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);

  async function handleDownloadDefaulters() {
    setLoadingDefaulters(true);
    try {
      const { filename, csv } = await exportDefaultersCSV();
      downloadCSV(filename, csv);
    } catch (err) {
      alert("Failed to export report.");
    } finally {
      setLoadingDefaulters(false);
    }
  }

  async function handleDownloadCollections() {
    setLoadingCollections(true);
    try {
      const { filename, csv } = await exportCollectionsCSV();
      downloadCSV(filename, csv);
    } catch (err) {
      alert("Failed to export report.");
    } finally {
      setLoadingCollections(false);
    }
  }

  function downloadCSV(filename: string, csv: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-blue-700">REPORTS & ANALYTICS</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Accounting Reports</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Export financial data for external reconciliation.</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Overdue Invoices</h2>
          <p className="mt-2 text-sm text-slate-600">Download a complete list of students with outstanding dues and their parent contact information.</p>
          <button 
            onClick={handleDownloadDefaulters}
            disabled={loadingDefaulters}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {loadingDefaulters ? "Generating..." : "Export as CSV"}
          </button>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Payment Collections</h2>
          <p className="mt-2 text-sm text-slate-600">Download a ledger of all successful payment receipts, amounts, and collection dates.</p>
          <button 
            onClick={handleDownloadCollections}
            disabled={loadingCollections}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {loadingCollections ? "Generating..." : "Export as CSV"}
          </button>
        </article>
      </div>
    </main>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Download, FileText, Settings } from "lucide-react";
import { format, isSameDay } from "date-fns";

type ReportItem = {
  id: string;
  title: string;
  pdfUrl: string;
  date: Date;
};

export function ReportsClient({ initialReports, generateAction }: { initialReports: ReportItem[], generateAction: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition();

  const today = new Date();
  const hasGeneratedToday = initialReports.some(r => isSameDay(new Date(r.date), today));

  function handleGenerate() {
    startTransition(async () => {
      try {
        await generateAction();
      } catch (err: any) {
        alert(err.message || "Failed to generate report.");
      }
    });
  }

  function handleViewPdf(base64Url: string) {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<iframe src="${base64Url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-blue-700 dark:text-blue-500">REPORTS & ANALYTICS</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-slate-100">Daily Financial PDF Reports</h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">View automated daily reports. In production, these are generated every 24 hours.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isPending || hasGeneratedToday}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          title={hasGeneratedToday ? "Today's report has already been generated." : ""}
        >
          <Settings className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          {isPending ? "Generating..." : hasGeneratedToday ? "Generated for Today" : "Simulate Daily Cron"}
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialReports.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-10 text-center text-slate-500">
            No daily reports have been generated yet.
          </div>
        ) : (
          initialReports.map(report => (
            <article key={report.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
              <div>
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <FileText className="h-5 w-5" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate" title={report.title}>{report.title}</h2>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Generated: {format(new Date(report.date), "PPpp")}
                </p>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => handleViewPdf(report.pdfUrl)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
                >
                  View PDF
                </button>
                <a
                  href={report.pdfUrl}
                  download={`${report.title.replace(/\s+/g, '_')}.pdf`}
                  className="flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  title="Download PDF"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}

import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-premium px-4 text-center">
      <div className="glass-card p-12 max-w-md w-full animate-fade-in relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 dark:bg-slate-900/50 mb-6 shadow-inner">
            <SearchX className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="mb-2 text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">404</h1>
          <h2 className="mb-4 text-xl font-semibold text-slate-700 dark:text-slate-300">Page not found</h2>
          
          <p className="mb-8 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            We couldn't find the page you're looking for. It might have been moved, deleted, or perhaps the URL is incorrect.
          </p>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

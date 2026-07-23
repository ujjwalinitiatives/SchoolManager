"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { SearchResult } from "@/lib/search";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="search"
          className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 pl-10 text-sm text-slate-900 focus:border-blue-500 focus:ring-blue-500"
          placeholder="Search students, invoices, receipts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <ul className="max-h-96 overflow-y-auto">
            {results.map((result) => (
              <li key={`${result.type}-${result.id}`}>
                <Link
                  href={result.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{result.title}</span>
                    <span className="text-xs font-semibold tracking-wide text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {result.type}
                    </span>
                  </div>
                  <span className="block text-sm text-slate-500 mt-0.5">{result.subtitle}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white p-4 shadow-lg text-sm text-slate-500 text-center">
          No results found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Megaphone, Users, User, CalendarDays } from "lucide-react";

type Notice = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  targetAudience: string;
  author: { name: string; role?: string };
  classLinks?: { class: { name: string; section: string } }[];
};

export function NoticesClient({ 
  notices, 
  isTeacher 
}: { 
  notices: Notice[];
  isTeacher: boolean;
}) {
  const [tab, setTab] = useState<"SCHOOL" | "CLASS">("SCHOOL");

  let displayedNotices = notices;
  
  if (isTeacher) {
    if (tab === "SCHOOL") {
      displayedNotices = notices.filter(n => n.targetAudience === "ALL");
    } else {
      displayedNotices = notices.filter(n => n.targetAudience !== "ALL");
    }
  }

  return (
    <section className="grid gap-6">
      {isTeacher && (
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button 
            onClick={() => setTab("SCHOOL")}
            className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${tab === "SCHOOL" ? "border-blue-700 text-blue-700 dark:border-blue-500 dark:text-blue-500" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}`}
          >
            School Notices
          </button>
          <button 
            onClick={() => setTab("CLASS")}
            className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${tab === "CLASS" ? "border-blue-700 text-blue-700 dark:border-blue-500 dark:text-blue-500" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}`}
          >
            Class Notices
          </button>
        </div>
      )}

      {displayedNotices.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-10 text-center text-slate-500">
          No notices found in this category.
        </div>
      ) : (
        displayedNotices.map((notice) => (
          <article key={notice.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
            <header className="mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-blue-600" />
                  {notice.title}
                </h2>
                <time className="text-sm text-slate-500 dark:text-slate-400">
                  <CalendarDays className="inline h-4 w-4 mr-1 mb-0.5" />
                  {format(new Date(notice.createdAt), "PPP")}
                </time>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {notice.author.role === "PRINCIPAL" ? "Principal" : `${notice.author.name} (Teacher)`}
                    </p>
                  </div>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>
                    {notice.targetAudience === "ALL" 
                      ? "All Classes" 
                      : notice.classLinks?.map((l: any) => `${l.class.name}-${l.class.section}`).join(", ")}
                  </span>
                </span>
              </div>
            </header>
            <div className="prose prose-slate max-w-none text-slate-700 dark:text-slate-300">
              {notice.content.split("\n").map((para: string, i: number) => (
                <p key={i} className="mb-2 last:mb-0">{para}</p>
              ))}
            </div>
          </article>
        ))
      )}
    </section>
  );
}

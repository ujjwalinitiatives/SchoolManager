"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { createNotice } from "@/app/(dashboard)/notices/actions";

interface ClassType {
  id: string;
  name: string;
  section: string;
}

export function CreateNoticeForm({ classes }: { classes: ClassType[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [audience, setAudience] = useState("ALL");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createNotice(formData);
      setIsOpen(false);
    } catch (err) {
      alert("Failed to create notice.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
      >
        <Plus className="h-4 w-4" /> Publish Notice
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">Publish a new notice</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-5">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Title
              <input name="title" required className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="E.g., Sports Day Announcement" />
            </label>
            
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Content
              <textarea name="content" required rows={5} className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Write the full announcement here..." />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Audience
              <select name="targetAudience" value={audience} onChange={(e) => setAudience(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 bg-white">
                <option value="ALL">All Classes (Entire School)</option>
                <option value="SPECIFIC_CLASSES">Specific Classes</option>
              </select>
            </label>

            {audience === "SPECIFIC_CLASSES" && (
              <div className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Select Classes</span>
                <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 bg-slate-50">
                  {classes.map(c => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-md bg-white px-3 py-2 text-sm shadow-sm border border-slate-200 hover:border-blue-400">
                      <input type="checkbox" name="classIds" value={c.id} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                      {c.name} {c.section}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              {loading ? "Publishing..." : "Publish Notice"}
            </button>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

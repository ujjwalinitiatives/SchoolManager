"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";

import { createEvent } from "@/app/(dashboard)/schedule/actions";

interface ClassType {
  id: string;
  name: string;
  section: string;
}

export function CreateEventForm({ classes }: { classes: ClassType[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [audience, setAudience] = useState("ALL");
  const [loading, setLoading] = useState(false);

  // Default to tomorrow 10 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 0, 0, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (audience === "ALL") formData.delete("classId");
      
      await createEvent(formData);
      setIsOpen(false);
    } catch (err) {
      alert("Failed to create event.");
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
        <Plus className="h-4 w-4" /> Schedule Event
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">Schedule a new event</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-5">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Event Title
              <input name="title" required className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="E.g., Parent-Teacher Meeting" />
            </label>
            
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Description <span className="font-normal text-slate-500">(Optional)</span>
              <textarea name="description" rows={3} className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Details about the event..." />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Start Time
                <input name="startTime" type="datetime-local" required defaultValue={format(tomorrow, "yyyy-MM-dd'T'HH:mm")} className="rounded-lg border border-slate-300 px-3 py-2.5 bg-white" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                End Time
                <input name="endTime" type="datetime-local" required defaultValue={format(tomorrowEnd, "yyyy-MM-dd'T'HH:mm")} className="rounded-lg border border-slate-300 px-3 py-2.5 bg-white" />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Target Audience
              <select name="targetAudience" value={audience} onChange={(e) => setAudience(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 bg-white">
                <option value="ALL">Entire School</option>
                <option value="SPECIFIC_CLASS">Specific Class</option>
              </select>
            </label>

            {audience === "SPECIFIC_CLASS" && (
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Select Class
                <select name="classId" required className="rounded-lg border border-slate-300 px-3 py-2.5 bg-white">
                  <option value="">Choose a class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          
          <div className="mt-8 flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              {loading ? "Scheduling..." : "Schedule Event"}
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

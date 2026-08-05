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

  // For cascading selections
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Derived state for dropdowns
  const uniqueClassNames = Array.from(new Set(classes.map(c => c.name)));
  const availableSections = selectedClassName 
    ? classes.filter(c => c.name === selectedClassName)
    : [];

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
      if (audience === "ALL") {
        formData.delete("classIds");
      } else {
        selectedClassIds.forEach(id => formData.append("classIds", id));
      }
      
      await createEvent(formData);
      setIsOpen(false);
      setSelectedClassIds([]);
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
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white z-10">
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
                <option value="SPECIFIC_CLASSES">Specific Classes</option>
              </select>
            </label>

            {audience === "SPECIFIC_CLASSES" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Class
                    <select 
                      value={selectedClassName} 
                      onChange={(e) => setSelectedClassName(e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2.5 bg-white"
                    >
                      <option value="">Select class...</option>
                      {uniqueClassNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Section
                    <select 
                      disabled={!selectedClassName}
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id && !selectedClassIds.includes(id)) {
                          setSelectedClassIds(prev => [...prev, id]);
                        }
                        e.target.value = ""; // reset
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-2.5 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">Add section...</option>
                      {availableSections.filter(c => !selectedClassIds.includes(c.id)).map(c => (
                        <option key={c.id} value={c.id}>{c.section}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {selectedClassIds.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedClassIds.map(id => {
                      const cls = classes.find(c => c.id === id);
                      if (!cls) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {cls.name}-{cls.section}
                          <button 
                            type="button"
                            onClick={() => setSelectedClassIds(prev => prev.filter(p => p !== id))}
                            className="hover:text-blue-900"
                          >
                            &times;
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
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

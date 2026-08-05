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

  const distinctClassNames = Array.from(new Set(classes.map(c => c.name))).sort();
  const [selectedClassName, setSelectedClassName] = useState(distinctClassNames[0] || "");
  const sectionsForClass = classes.filter(c => c.name === selectedClassName).map(c => c.section).sort();
  const [selectedSection, setSelectedSection] = useState("");
  
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  function addClass() {
    const cls = classes.find(c => c.name === selectedClassName && c.section === selectedSection);
    if (cls && !selectedClassIds.includes(cls.id)) {
      setSelectedClassIds([...selectedClassIds, cls.id]);
    }
  }

  function removeClass(id: string) {
    setSelectedClassIds(selectedClassIds.filter(cId => cId !== id));
  }

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
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white z-10">
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
              <div className="grid gap-4 rounded-xl border border-slate-200 p-4 bg-slate-50">
                <span className="text-sm font-medium text-slate-700">Select Classes</span>
                
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                  <label className="grid gap-1 text-xs text-slate-500">
                    Class Name
                    <select 
                      value={selectedClassName} 
                      onChange={(e) => {
                        setSelectedClassName(e.target.value);
                        setSelectedSection("");
                      }} 
                      className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
                    >
                      {distinctClassNames.map(name => (
                        <option key={name} value={name}>Class {name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs text-slate-500">
                    Section
                    <select 
                      value={selectedSection} 
                      onChange={(e) => setSelectedSection(e.target.value)} 
                      className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
                    >
                      <option value="" disabled>Select Section</option>
                      {sectionsForClass.map(sec => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>
                  </label>

                  <button 
                    type="button" 
                    onClick={addClass}
                    disabled={!selectedClassName || !selectedSection}
                    className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 h-[38px]"
                  >
                    Add
                  </button>
                </div>

                {selectedClassIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedClassIds.map(id => {
                      const cls = classes.find(c => c.id === id);
                      return (
                        <div key={id} className="flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          {cls?.name} - {cls?.section}
                          <button type="button" onClick={() => removeClass(id)} className="ml-1 text-blue-600 hover:text-blue-900">&times;</button>
                          <input type="hidden" name="classIds" value={id} />
                        </div>
                      )
                    })}
                  </div>
                )}
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

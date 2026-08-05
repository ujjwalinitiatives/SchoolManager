"use client";

import { useState, useTransition } from "react";
import { Users, AlertCircle, Trash2 } from "lucide-react";
import { AddStudentClient } from "./add-student-client";
import { deleteStudent } from "./actions";

type StudentData = {
  id: string;
  name: string;
  admissionNumber: string;
  parentName: string | null;
  parentEmail: string | null;
  className: string;
  section: string;
  rollNumber: string;
};

type ClassGroup = {
  id: string; // "name-section"
  name: string;
  section: string;
  students: StudentData[];
};

export function StudentsClient({ classes, isPrincipal }: { classes: ClassGroup[], isPrincipal: boolean }) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0]?.id || null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedClass = classes.find(c => c.id === selectedClassId);

  function handleRemove(studentId: string) {
    if (confirm("Are you sure you want to remove this student?")) {
      startTransition(async () => {
        try {
          await deleteStudent(studentId);
        } catch (err: any) {
          alert(err.message || "Failed to remove student");
        }
      });
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-blue-700 dark:text-blue-500">ACADEMICS</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-slate-100">Students Directory</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">View and manage enrolled students.</p>
        </div>
        {isPrincipal && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
          >
            {showAddForm ? "Close Add Form" : "+ Add Student"}
          </button>
        )}
      </header>

      {showAddForm && isPrincipal && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <AddStudentClient />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden min-h-[600px] shadow-sm">
        {/* Classes Sidebar */}
        <aside className="border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col h-full max-h-[600px] lg:max-h-[800px] overflow-y-auto">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 sticky top-0 bg-slate-50 dark:bg-slate-900/90 backdrop-blur">
            <Users className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Classes</h2>
          </div>
          <div className="flex-1">
            {classes.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No classes found.</p>
            ) : (
              classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 transition-colors ${selectedClassId === c.id ? "bg-blue-50 dark:bg-slate-800/80 border-l-4 border-l-blue-600" : "hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-l-transparent"}`}
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name} - {c.section}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{c.students.length} Students</p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Students Area */}
        <section className="flex flex-col relative h-[600px] lg:h-[800px] overflow-y-auto bg-white dark:bg-slate-950">
          {selectedClass ? (
            <>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                  {selectedClass.name} - {selectedClass.section} Students
                </h3>
              </div>
              
              <div className="p-0">
                {selectedClass.students.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 mt-10">No students enrolled in this class.</p>
                ) : (
                  <div className={`grid ${isPrincipal ? "grid-cols-[2fr_1fr_1.5fr_2fr_100px]" : "grid-cols-[2fr_1fr_1.5fr_2fr]"} gap-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 py-3 text-xs font-bold tracking-wide text-slate-500 uppercase sticky top-[61px] z-10`}>
                    <span>Student</span>
                    <span>Roll No.</span>
                    <span>Admission No.</span>
                    <span>Parent Email</span>
                    {isPrincipal && <span className="text-right">Action</span>}
                  </div>
                )}
                {selectedClass.students.map(student => (
                  <div key={student.id} className={`grid ${isPrincipal ? "grid-cols-[2fr_1fr_1.5fr_2fr_100px]" : "grid-cols-[2fr_1fr_1.5fr_2fr]"} gap-4 border-b border-slate-100 dark:border-slate-800 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors`}>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">{student.rollNumber || "N/A"}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">{student.admissionNumber}</p>
                    <div>
                      {student.parentEmail ? (
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{student.parentEmail}</p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No parent linked</p>
                      )}
                    </div>
                    {isPrincipal && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleRemove(student.id)}
                          disabled={isPending}
                          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-slate-500 flex-col gap-2">
              <p>Select a class to view students</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

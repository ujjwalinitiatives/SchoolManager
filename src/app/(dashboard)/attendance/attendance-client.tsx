"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { markAttendance, toggleSchoolClosure } from "./actions";
import { Check, X, ShieldAlert, Loader2 } from "lucide-react";

type StudentData = {
  id: string;
  name: string;
  rollNumber: string;
  status: "PRESENT" | "ABSENT" | null;
};

interface AttendanceClientProps {
  students: StudentData[];
  classId: string;
  academicSessionId: string;
  dateStr: string;
  isSchoolClosed: boolean;
  closureReason?: string;
}

export function AttendanceClient({ students, classId, academicSessionId, dateStr, isSchoolClosed, closureReason }: AttendanceClientProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStudents, setOptimisticStudents] = useState<StudentData[]>(students);
  const [optimisticClosed, setOptimisticClosed] = useState(isSchoolClosed);

  const handleMark = (studentId: string, status: "PRESENT" | "ABSENT") => {
    if (optimisticClosed) return;
    
    setOptimisticStudents(prev => 
      prev.map(s => s.id === studentId ? { ...s, status } : s)
    );

    startTransition(async () => {
      try {
        await markAttendance(studentId, classId, academicSessionId, dateStr, status);
      } catch (err) {
        console.error(err);
        alert("Failed to mark attendance.");
        // Revert on error
        setOptimisticStudents(students);
      }
    });
  };

  const handleToggleClosure = () => {
    const newStatus = !optimisticClosed;
    setOptimisticClosed(newStatus);
    
    startTransition(async () => {
      try {
        await toggleSchoolClosure(dateStr, newStatus, newStatus ? "Marked by Teacher" : undefined);
      } catch (err) {
        console.error(err);
        alert("Failed to toggle closure.");
        setOptimisticClosed(isSchoolClosed);
      }
    });
  };

  const markAll = (status: "PRESENT" | "ABSENT") => {
    if (optimisticClosed) return;
    setOptimisticStudents(prev => prev.map(s => ({ ...s, status })));
    
    startTransition(async () => {
      try {
        await Promise.all(
          students.map(s => markAttendance(s.id, classId, academicSessionId, dateStr, status))
        );
      } catch (err) {
        console.error(err);
        alert("Failed to mark all.");
        setOptimisticStudents(students);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Attendance for {format(new Date(dateStr), "PPP")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {optimisticStudents.length} Students Enrolled
          </p>
        </div>
        
        <div className="flex gap-2">
          {!optimisticClosed && (
            <>
              <button 
                onClick={() => markAll("PRESENT")}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                Mark All Present
              </button>
              <button 
                onClick={() => markAll("ABSENT")}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
              >
                Mark All Absent
              </button>
            </>
          )}
          <button 
            onClick={handleToggleClosure}
            disabled={isPending}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2 ${
              optimisticClosed 
                ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600" 
                : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            {optimisticClosed ? "School is Closed" : "Mark School Closed"}
          </button>
        </div>
      </div>

      {optimisticClosed ? (
        <div className="p-8 text-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2">School Closed</h3>
          <p className="text-amber-700 dark:text-amber-400">
            {closureReason || "The school has been marked closed for this day."}
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Roll No</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Student Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {optimisticStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-500">{student.rollNumber}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{student.name}</td>
                  <td className="px-6 py-4">
                    {student.status === "PRESENT" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5" /> Present
                      </span>
                    ) : student.status === "ABSENT" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
                        <X className="w-3.5 h-3.5" /> Absent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Not Marked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleMark(student.id, "PRESENT")}
                        disabled={isPending}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          student.status === "PRESENT" 
                            ? "bg-emerald-500 text-white shadow-sm" 
                            : "bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleMark(student.id, "ABSENT")}
                        disabled={isPending}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          student.status === "ABSENT" 
                            ? "bg-rose-500 text-white shadow-sm" 
                            : "bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

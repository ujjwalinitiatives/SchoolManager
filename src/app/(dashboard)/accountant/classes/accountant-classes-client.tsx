"use client";

import { useState, useTransition } from "react";
import { Users, Bell, AlertCircle } from "lucide-react";
import { sendFeeReminderMessage, setFeeStructure } from "./actions";

type Student = {
  id: string;
  name: string;
  admissionNumber: string;
  totalDue: number;
};

type ClassGroup = {
  id: string;
  name: string;
  section: string;
  students: Student[];
};

export function AccountantClassesClient({ classes, isPrincipal }: { classes: ClassGroup[], isPrincipal: boolean }) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean, studentId: string, studentName: string, amount: number }>({ isOpen: false, studentId: "", studentName: "", amount: 0 });
  const [feeModal, setFeeModal] = useState<{ isOpen: boolean, classId: string, className: string }>({ isOpen: false, classId: "", className: "" });
  const [customMessage, setCustomMessage] = useState("");

  const selectedClass = classes.find(c => c.id === selectedClassId);

  function handleSendReminder(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("studentId", messageModal.studentId);
    formData.append("amount", messageModal.amount.toString());
    formData.append("customMessage", customMessage);
    
    startTransition(async () => {
      try {
        const res = await sendFeeReminderMessage(formData);
        if (res?.error) {
          alert(res.error);
          return;
        }
        alert("Message sent successfully.");
        setMessageModal({ isOpen: false, studentId: "", studentName: "", amount: 0 });
        setCustomMessage("");
      } catch (err: any) {
        alert(err.message || "Failed to send message.");
      }
    });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-blue-700 dark:text-blue-500">ACCOUNTS & BILLING</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-slate-100">Classes & Fees</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Select a class to view student fee dues and send reminders.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden min-h-[600px] shadow-sm">
        
        {/* Classes Sidebar */}
        <aside className="border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100">All Classes</h2>
          </div>
          <div className="overflow-y-auto flex-1">
            {classes.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No classes found.</p>
            ) : (
              classes.map(c => {
                const totalDueInClass = c.students.reduce((acc, s) => acc + s.totalDue, 0);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 transition-colors ${selectedClassId === c.id ? "bg-blue-50 dark:bg-slate-800" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name} - {c.section}</p>
                      {totalDueInClass > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Dues
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{c.students.length} Students</p>
                    
                    {isPrincipal && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setFeeModal({ isOpen: true, classId: c.id, className: `${c.name} - ${c.section}` }); }}
                        className="mt-3 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Set Fee Structure
                      </button>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Students Area */}
        <section className="flex flex-col bg-white dark:bg-slate-950 relative h-[600px] lg:h-auto overflow-y-auto">
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
                  <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 py-3 text-xs font-bold tracking-wide text-slate-500 uppercase sticky top-[60px] z-10">
                    <span>Student Name</span>
                    <span>Admission No.</span>
                    <span>Total Due</span>
                    <span>Action</span>
                  </div>
                )}
                {selectedClass.students.map(student => (
                  <div key={student.id} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 border-b border-slate-100 dark:border-slate-800 px-6 py-4 items-center">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{student.admissionNumber}</p>
                    <p className={`font-semibold text-sm ${student.totalDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      ₹{student.totalDue.toFixed(2)}
                    </p>
                    <div>
                      <button
                        onClick={() => {
                          setMessageModal({ isOpen: true, studentId: student.id, studentName: student.name, amount: student.totalDue });
                          setCustomMessage(`Dear Parent/Student, this is a reminder from the accounts department that there are pending fee dues (approx ₹${student.totalDue}) for ${student.name}. Please pay via the dashboard at your earliest convenience. Thank you.`);
                        }}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50`}
                      >
                        <Bell className="w-3 h-3" />
                        Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-slate-500 flex-col gap-2">
              <p>Select a class to view students and fees</p>
            </div>
          )}
        </section>
      </div>

      {/* Message Modal */}
      {messageModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-xl">
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Send Message</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">To: Parent/Student ({messageModal.studentName})</p>
            </div>
            <form onSubmit={handleSendReminder} className="p-6">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={5}
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setMessageModal({ isOpen: false, studentId: "", studentName: "", amount: 0 })} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                  {isPending ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Set Fee Modal placeholder */}
      {feeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-xl p-6">
             <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Set Fee for {feeModal.className}</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Configure the fee structure for this class.</p>
             <form action={async (formData) => {
               try {
                 await setFeeStructure(formData);
                 alert("Fee structure set successfully!");
                 setFeeModal({ isOpen: false, classId: "", className: "" });
               } catch (err: any) {
                 alert(err.message || "Failed to set fee structure.");
               }
             }}>
                <input type="hidden" name="classId" value={feeModal.classId} />
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fee Name (e.g. Tuition Fee)</label>
                <input type="text" name="name" required className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 mb-4 text-slate-900 dark:text-slate-100" />
                
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
                <input type="number" name="amount" required min="1" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 mb-4 text-slate-900 dark:text-slate-100" />
                
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Frequency</label>
                <select name="frequency" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 mb-6 text-slate-900 dark:text-slate-100">
                  <option value="MONTHLY">Monthly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
                
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setFeeModal({ isOpen: false, classId: "", className: "" })} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                    Save Fee
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </main>
  );
}

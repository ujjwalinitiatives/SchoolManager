import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { format, subDays } from "date-fns";
import { Activity, CreditCard, DollarSign, Users, CheckCircle } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckoutButton } from "../invoices/[invoiceId]/checkout-button";
import { SetFeeForm } from "./set-fee-form";

export default async function DashboardOverviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      id: true, 
      schoolId: true, 
      role: true, 
      name: true,
      school: { select: { bankAccounts: { select: { upiId: true } } } }
    }
  });

  if (!viewer) redirect("/login");

  // Only Principal and Accountant see the high-level dashboard metrics for now
  const isAdmin = viewer.role === "PRINCIPAL" || viewer.role === "ACCOUNTANT";

  if (!isAdmin) {
    let studentsToDisplay: any[] = [];
    
    let teacherStats = null;

    if (viewer.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: viewer.id },
        include: {
          enrollments: {
            include: {
              class: { include: { teacher: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          invoices: {
            where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
            orderBy: { dueDate: "asc" }
          }
        }
      });
      if (student) studentsToDisplay = [student];
    } else if (viewer.role === "PARENT") {
      const parentLinks = await prisma.parentStudentLink.findMany({
        where: { parentId: viewer.id },
        include: {
          student: {
            include: {
              enrollments: {
                include: { class: { include: { teacher: true } } },
                orderBy: { createdAt: 'desc' },
                take: 1
              },
              invoices: {
                where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
                orderBy: { dueDate: "asc" }
              }
            }
          }
        }
      });
      studentsToDisplay = parentLinks.map((link: any) => link.student);
    } else if (viewer.role === "TEACHER") {
      const teacherClass = await prisma.class.findFirst({
        where: { teacherId: viewer.id, isActive: true },
        include: {
          _count: {
            select: { enrollments: { where: { student: { isActive: true } } } }
          }
        }
      });
      teacherStats = {
        className: teacherClass ? `${teacherClass.name} - ${teacherClass.section}` : "No Class Assigned",
        studentCount: teacherClass ? teacherClass._count.enrollments : 0
      };
    }
    
    return (
      <main className="mx-auto w-full max-w-5xl py-10 px-5 sm:px-8">
        <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Welcome, {viewer.name}!</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Here is the overview for your account.</p>
        </header>

        <div className="grid gap-8">
          {viewer.role === "TEACHER" && teacherStats && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm transition-colors max-w-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{teacherStats.className}</p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{teacherStats.studentCount} Students</h2>
                </div>
              </div>
            </div>
          )}

          {studentsToDisplay.map(student => {
            const enrollment = student.enrollments[0];
            const cls = enrollment?.class;
            const teacher = cls?.teacher;
            const rollNo = enrollment?.rollNumber || "N/A";
            const admissionNo = student.admissionNumber;

            return (
              <div key={student.id} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex flex-col md:flex-row">
                <div className="flex-1 p-6 md:p-8 bg-blue-50/50 dark:bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 flex items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white shadow-sm">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{student.name}</h2>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Student Profile</p>
                    </div>
                  </div>
                  
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                    <div>
                      <dt className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">Class & Section</dt>
                      <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{cls ? `${cls.name} - ${cls.section}` : "Not Assigned"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">Class Teacher</dt>
                      <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{teacher ? teacher.name : "Not Assigned"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">Admission No</dt>
                      <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{admissionNo}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">Roll No</dt>
                      <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{rollNo}</dd>
                    </div>
                  </dl>
                </div>
                
                <div className="flex-1 p-6 md:p-8">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Pending Dues
                  </h3>
                  
                  {student.invoices.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center bg-slate-50 dark:bg-slate-900/50">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No pending invoices.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {student.invoices.map((invoice: any) => {
                        const outstanding = Number(invoice.totalAmount) - Number(invoice.paidAmount);
                        return (
                          <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{invoice.invoiceNumber}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Due: {format(new Date(invoice.dueDate), "MMM d, yyyy")}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-rose-600">₹{outstanding.toFixed(2)}</span>
                              <CheckoutButton invoiceId={invoice.id} amount={outstanding} schoolUpiId={viewer.school?.bankAccounts?.[0]?.upiId || undefined} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  // --- Dashboard Metrics (Admins) ---
  const thirtyDaysAgo = subDays(new Date(), 30);

  // 1. Total Outstanding (All pending/partial invoices)
  const outstandingAgg = await prisma.invoice.aggregate({
    where: { student: { schoolId: viewer.schoolId as string }, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
    _sum: { totalAmount: true, paidAmount: true }
  });
  
  const totalAmount = outstandingAgg._sum.totalAmount ? Number(outstandingAgg._sum.totalAmount) : 0;
  const paidAmount = outstandingAgg._sum.paidAmount ? Number(outstandingAgg._sum.paidAmount) : 0;
  const totalOutstanding = totalAmount - paidAmount;

  // 2. Revenue Collected this Month (from Payments)
  const revenueAgg = await prisma.payment.aggregate({
    where: { 
      invoice: { student: { schoolId: viewer.schoolId as string } },
      status: "COMPLETED",
      paymentDate: { gte: thirtyDaysAgo }
    },
    _sum: { amount: true }
  });
  const revenue30Days = revenueAgg._sum.amount ? Number(revenueAgg._sum.amount) : 0;

  // 3. Total Students
  const totalStudents = await prisma.student.count({
    where: { schoolId: viewer.schoolId as string, isActive: true }
  });

  const recentPayments = await prisma.payment.findMany({
    where: { 
      invoice: { student: { schoolId: viewer.schoolId as string } },
      status: "COMPLETED"
    },
    include: { invoice: { include: { student: true } } },
    orderBy: { paymentDate: "desc" },
    take: 5
  });

  const schoolClasses = await prisma.class.findMany({
    where: { schoolId: viewer.schoolId as string },
    include: {
      feeStructures: {
        include: { components: true }
      }
    }
  });

  const distinctClassNames = Array.from(new Set(schoolClasses.map(c => c.name))).sort();
  const existingFees: Record<string, any[]> = {};
  
  schoolClasses.forEach(c => {
    if (!existingFees[c.name]) existingFees[c.name] = [];
    c.feeStructures.forEach(fs => {
      fs.components.forEach(comp => {
        // Prevent duplicate pushes if multiple sections have same structure
        if (!existingFees[c.name].find(f => f.name === comp.name)) {
          existingFees[c.name].push({
            amount: Number(comp.amount),
            frequency: fs.frequency,
            name: comp.name
          });
        }
      });
    });
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center py-20 px-5">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Dashboard Overview</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-400 text-lg">High-level financial insights for your institution.</p>

      <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Outstanding</p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">₹{totalOutstanding.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Revenue (30 Days)</p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">₹{revenue30Days.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Students</p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalStudents.toLocaleString()}</h2>
            </div>
          </div>
        </div>
      </div>

      {viewer.role === "PRINCIPAL" && (
        <section className="mt-8 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm transition-colors">
          <SetFeeForm distinctClassNames={distinctClassNames} existingFees={existingFees} />
        </section>
      )}

      <section className="mt-8 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-5">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Recent Collections</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentPayments.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No recent payments.</div>
          ) : (
            recentPayments.map((payment: typeof recentPayments[number]) => (
              <div key={payment.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <CreditCard className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{payment.invoice.student.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{payment.method} • {format(payment.paymentDate, "PP")}</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-700 dark:text-emerald-500">+ ₹{Number(payment.amount).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

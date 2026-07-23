import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { format, subDays } from "date-fns";
import { Activity, CreditCard, DollarSign, Users } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardOverviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true, name: true }
  });

  if (!viewer) redirect("/login");

  // Only Principal and Accountant see the high-level dashboard metrics for now
  const isAdmin = viewer.role === "PRINCIPAL" || viewer.role === "ACCOUNTANT";

  if (!isAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center py-20 px-5">
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {viewer.name}!</h1>
        <p className="mt-4 text-slate-600">Please use the navigation menu to access your invoices, notices, and schedule.</p>
      </main>
    );
  }

  // --- Dashboard Metrics (Admins) ---
  const thirtyDaysAgo = subDays(new Date(), 30);

  // 1. Total Outstanding (All pending/partial invoices)
  const outstandingAgg = await prisma.invoice.aggregate({
    where: { student: { schoolId: viewer.schoolId }, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
    _sum: { totalAmount: true, paidAmount: true }
  });
  
  const totalAmount = outstandingAgg._sum.totalAmount ? Number(outstandingAgg._sum.totalAmount) : 0;
  const paidAmount = outstandingAgg._sum.paidAmount ? Number(outstandingAgg._sum.paidAmount) : 0;
  const totalOutstanding = totalAmount - paidAmount;

  // 2. Revenue Collected this Month (from Payments)
  const revenueAgg = await prisma.payment.aggregate({
    where: { 
      invoice: { student: { schoolId: viewer.schoolId } },
      status: "COMPLETED",
      paymentDate: { gte: thirtyDaysAgo }
    },
    _sum: { amount: true }
  });
  const revenue30Days = revenueAgg._sum.amount ? Number(revenueAgg._sum.amount) : 0;

  // 3. Total Students
  const totalStudents = await prisma.student.count({
    where: { schoolId: viewer.schoolId, isActive: true }
  });

  // 4. Recent Activity (Payments)
  const recentPayments = await prisma.payment.findMany({
    where: { 
      invoice: { student: { schoolId: viewer.schoolId } },
      status: "COMPLETED"
    },
    include: { invoice: { include: { student: true } } },
    orderBy: { paymentDate: "desc" },
    take: 5
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">Dashboard Overview</h1>
        <p className="mt-2 text-slate-600">High-level financial insights for your institution.</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Outstanding</p>
              <h2 className="text-2xl font-bold text-slate-900">₹{totalOutstanding.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Revenue (30 Days)</p>
              <h2 className="text-2xl font-bold text-slate-900">₹{revenue30Days.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Students</p>
              <h2 className="text-2xl font-bold text-slate-900">{totalStudents.toLocaleString()}</h2>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="font-bold text-slate-900">Recent Collections</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentPayments.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">No recent payments.</div>
          ) : (
            recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 border border-slate-200">
                    <CreditCard className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{payment.invoice.student.name}</p>
                    <p className="text-xs text-slate-500">{payment.method} • {format(payment.paymentDate, "PP")}</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-700">+ ₹{Number(payment.amount).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

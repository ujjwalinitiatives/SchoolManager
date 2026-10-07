import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true },
  });

  if (!viewer || !viewer.schoolId || viewer.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // Parse Month and Year
  const params = await searchParams;
  const now = new Date();
  const currentMonth = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;
  const currentYear = params.year ? parseInt(params.year, 10) : now.getFullYear();

  const selectedDate = new Date(currentYear, currentMonth - 1, 1);
  const startDate = startOfMonth(selectedDate);
  const endDate = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonthDate = subMonths(selectedDate, 1);
  const nextMonthDate = addMonths(selectedDate, 1);

  // Fetch Class and Session
  const [activeSession, teacherClass] = await Promise.all([
    prisma.academicSession.findFirst({
      where: { schoolId: viewer.schoolId, isActive: true }
    }),
    prisma.class.findFirst({
      where: { teacherId: viewer.id, schoolId: viewer.schoolId, isActive: true },
    })
  ]);

  if (!activeSession || !teacherClass) {
    return (
      <main className="mx-auto w-full max-w-7xl py-10 px-5">
        <h1 className="text-2xl font-bold">No Active Class/Session</h1>
      </main>
    );
  }

  // Fetch Enrollments and Attendance
  const [enrollments, attendances, closures] = await Promise.all([
    prisma.studentEnrollment.findMany({
      where: {
        classId: teacherClass.id,
        academicSessionId: activeSession.id,
        student: { isActive: true }
      },
      include: {
        student: { select: { id: true, name: true } }
      },
      orderBy: { rollNumber: 'asc' }
    }),
    prisma.attendance.findMany({
      where: {
        classId: teacherClass.id,
        date: { gte: startDate, lte: endDate }
      },
      select: { studentId: true, date: true, status: true }
    }),
    prisma.schoolClosure.findMany({
      where: {
        schoolId: viewer.schoolId,
        date: { gte: startDate, lte: endDate }
      },
      select: { date: true }
    })
  ]);

  // Fast lookups
  const attendanceMap = new Map<string, "PRESENT" | "ABSENT">();
  attendances.forEach(a => {
    const key = `${a.studentId}-${format(new Date(a.date), 'yyyy-MM-dd')}`;
    attendanceMap.set(key, a.status);
  });

  const closureMap = new Set<string>();
  closures.forEach(c => {
    closureMap.add(format(new Date(c.date), 'yyyy-MM-dd'));
  });

  return (
    <main className="mx-auto w-full max-w-7xl py-10 px-5 sm:px-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline mb-2 inline-block">&larr; Back to Dashboard</Link>
          <p className="text-sm font-semibold tracking-wide text-blue-700 dark:text-blue-500 uppercase">
            {teacherClass.name} - {teacherClass.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">Monthly Attendance Report</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
          <Link 
            href={`/attendance/report?month=${prevMonthDate.getMonth() + 1}&year=${prevMonthDate.getFullYear()}`}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 px-4 py-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Calendar className="w-4 h-4 text-slate-400" />
            {format(selectedDate, "MMMM yyyy")}
          </div>
          <Link 
            href={`/attendance/report?month=${nextMonthDate.getMonth() + 1}&year=${nextMonthDate.getFullYear()}`}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="border-collapse" style={{ minWidth: `${120 + daysInMonth.length * 36}px` }}>
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 text-left sticky left-0 bg-slate-50 dark:bg-slate-900 z-20 border-r border-slate-200 dark:border-slate-800" style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                  Student
                </th>
                {daysInMonth.map(day => (
                  <th key={day.toISOString()} className="py-2 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0" style={{ width: 36, minWidth: 36 }}>
                    <div className="flex flex-col items-center leading-tight">
                      <span className="text-[9px] uppercase text-slate-400 font-medium">{format(day, 'eee').charAt(0)}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{format(day, 'd')}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {enrollments.map((enrollment, index) => {
                const student = enrollment.student;
                const bgClass = index % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/50 dark:bg-slate-900/30";

                // Pre-compute totals
                let presentCount = 0;
                let absentCount = 0;
                daysInMonth.forEach(day => {
                  const status = attendanceMap.get(`${student.id}-${format(day, 'yyyy-MM-dd')}`);
                  if (status === 'PRESENT') presentCount++;
                  if (status === 'ABSENT') absentCount++;
                });

                return (
                  <tr key={student.id} className={bgClass}>
                    <td className={`px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 sticky left-0 z-10 border-r border-slate-200 dark:border-slate-800 ${bgClass}`} style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                      <span className="block truncate">{student.name}</span>
                      <span className="block text-[10px] text-slate-400">{enrollment.rollNumber}</span>
                      <span className="block mt-0.5 text-[10px] font-bold">
                        <span className="text-emerald-600">{presentCount}P</span>
                        <span className="text-slate-300 dark:text-slate-600 mx-0.5">/</span>
                        <span className="text-rose-600">{absentCount}A</span>
                      </span>
                    </td>
                    {daysInMonth.map(day => {
                      const dateKey = format(day, 'yyyy-MM-dd');
                      const isClosed = closureMap.has(dateKey);
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      const status = attendanceMap.get(`${student.id}-${dateKey}`);
                      const dimBg = isWeekend || isClosed ? 'bg-slate-100/80 dark:bg-slate-800/40' : '';

                      return (
                        <td key={dateKey} className={`py-2 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0 ${dimBg}`} style={{ width: 36, minWidth: 36 }}>
                          {status === 'PRESENT' ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold">P</span>
                          ) : status === 'ABSENT' ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-bold">A</span>
                          ) : isClosed ? (
                            <span className="text-amber-400 text-[10px]">H</span>
                          ) : isWeekend ? (
                            <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 text-[10px]">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

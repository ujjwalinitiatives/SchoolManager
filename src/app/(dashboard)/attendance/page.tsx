import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceClient } from "./attendance-client";
import { format } from "date-fns";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
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

  // Determine the date
  const params = await searchParams;
  let dateStr = params.date;
  
  if (!dateStr) {
    dateStr = new Date().toLocaleDateString('en-CA');
  }

  const selectedDate = new Date(dateStr);
  const prevDate = new Date(selectedDate);
  prevDate.setDate(selectedDate.getDate() - 1);
  const nextDate = new Date(selectedDate);
  nextDate.setDate(selectedDate.getDate() + 1);

  // Get active session + Teacher's class in parallel
  const [activeSession, teacherClass] = await Promise.all([
    prisma.academicSession.findFirst({
      where: { schoolId: viewer.schoolId, isActive: true }
    }),
    prisma.class.findFirst({
      where: { teacherId: viewer.id, schoolId: viewer.schoolId, isActive: true },
    })
  ]);

  if (!activeSession) {
    return (
      <main className="mx-auto w-full max-w-5xl py-10 px-5">
        <h1 className="text-2xl font-bold">No Active Session</h1>
        <p>Please contact the principal to configure an academic session.</p>
      </main>
    );
  }

  if (!teacherClass) {
    return (
      <main className="mx-auto w-full max-w-5xl py-10 px-5">
        <h1 className="text-2xl font-bold">No Class Assigned</h1>
        <p>You have not been assigned as a class teacher. Only class teachers can mark attendance.</p>
      </main>
    );
  }

  // Check School Closure + Get Students in parallel
  const [closure, enrollments] = await Promise.all([
    prisma.schoolClosure.findUnique({
      where: {
        schoolId_date: {
          schoolId: viewer.schoolId,
          date: selectedDate,
        }
      }
    }),
    prisma.studentEnrollment.findMany({
      where: {
        classId: teacherClass.id,
        academicSessionId: activeSession.id,
        student: { isActive: true }
      },
      include: {
        student: {
          include: {
            attendances: {
              where: { date: selectedDate }
            }
          }
        }
      },
      orderBy: { rollNumber: 'asc' }
    })
  ]);

  const studentData = enrollments.map(e => {
    const todayAttendance = e.student.attendances[0];
    return {
      id: e.student.id,
      name: e.student.name,
      rollNumber: e.rollNumber,
      status: todayAttendance ? todayAttendance.status : null,
    };
  });

  return (
    <main className="mx-auto w-full max-w-5xl py-10 px-5 sm:px-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <p className="text-sm font-semibold tracking-wide text-blue-700 dark:text-blue-500 uppercase">
            {teacherClass.name} - {teacherClass.section}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">Daily Attendance</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
          <Link 
            href={`/attendance?date=${format(prevDate, "yyyy-MM-dd")}`}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 px-4 py-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Calendar className="w-4 h-4 text-slate-400" />
            {format(selectedDate, "MMM d, yyyy")}
          </div>
          <Link 
            href={`/attendance?date=${format(nextDate, "yyyy-MM-dd")}`}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <AttendanceClient 
        students={studentData}
        classId={teacherClass.id}
        academicSessionId={activeSession.id}
        dateStr={dateStr}
        isSchoolClosed={!!closure}
        closureReason={closure?.reason || undefined}
      />
    </main>
  );
}

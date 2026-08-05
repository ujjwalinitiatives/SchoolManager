import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateEventForm } from "@/components/create-event-form";

export default async function SchedulePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true }
  });

  if (!viewer) redirect("/login");

  const isStaff = viewer.role === "PRINCIPAL" || viewer.role === "TEACHER";

  let events: any[] = [];

  if (isStaff) {
    events = await prisma.event.findMany({
      where: { schoolId: viewer.schoolId as string },
      include: { classLinks: { include: { class: { select: { name: true, section: true } } } } },
      orderBy: { startTime: "desc" }
    });
  } else if (viewer.role === "PARENT" || viewer.role === "STUDENT") {
    let classIds: string[] = [];

    if (viewer.role === "PARENT") {
      const parentLinks = await prisma.parentStudentLink.findMany({
        where: { parentId: viewer.id },
        include: { student: { include: { enrollments: true } } }
      });
      classIds = parentLinks.flatMap((link: typeof parentLinks[number]) => link.student.enrollments.map((e: { classId: string }) => e.classId));
    } else {
      // STUDENT
      const student = await prisma.student.findUnique({
        where: { userId: viewer.id },
        include: { enrollments: true }
      });
      if (student) {
        classIds = student.enrollments.map((e: { classId: string }) => e.classId);
      }
    }

    events = await prisma.event.findMany({
      where: { 
        schoolId: viewer.schoolId as string,
        OR: [
          { targetAudience: "ALL" },
          { classLinks: { some: { classId: { in: classIds } } } }
        ]
      },
      include: { classLinks: { include: { class: { select: { name: true, section: true } } } } },
      orderBy: { startTime: "desc" }
    });
  }

  const classes = isStaff ? await prisma.class.findMany({
    where: { schoolId: viewer.schoolId as string, isActive: true },
    orderBy: { name: "asc" }
  }) : [];

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-blue-700">CALENDAR</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">Schedule & Meetings</h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">Upcoming events, parent-teacher meetings, and exams.</p>
        </div>
        {isStaff && <CreateEventForm classes={classes} />}
      </header>

      <section className="grid gap-4">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            No upcoming events.
          </div>
        ) : (
          events.map((event) => (
            <article key={event.id} className="flex flex-col sm:flex-row gap-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
              <div className="flex flex-col items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800/50 px-6 py-4 text-center sm:w-32">
                <span className="text-sm font-bold uppercase text-blue-700 dark:text-blue-400">{format(new Date(event.startTime), "MMM")}</span>
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{format(new Date(event.startTime), "d")}</span>
                <span className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{format(new Date(event.startTime), "p")}</span>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{event.title}</h3>
                  {new Date() < new Date(event.startTime) ? (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Upcoming</span>
                  ) : new Date() > new Date(event.endTime) ? (
                    <span className="rounded-full bg-rose-100 dark:bg-rose-900/30 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-400">Ended</span>
                  ) : (
                    <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      Ongoing
                    </span>
                  )}
                </div>
                {event.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{event.description}</p>}
                
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Ends at {format(new Date(event.endTime), "p")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    {event.targetAudience === "ALL" 
                      ? "All Classes" 
                      : event.classLinks?.map((link: any) => `${link.class.name}-${link.class.section}`).join(", ") || "Specific Classes"}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

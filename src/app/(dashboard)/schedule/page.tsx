import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { format } from "date-fns";

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
      where: { schoolId: viewer.schoolId },
      include: { class: { select: { name: true, section: true } } },
      orderBy: { startTime: "asc" }
    });
  } else if (viewer.role === "PARENT") {
    const parentLinks = await prisma.parentStudentLink.findMany({
      where: { parentId: viewer.id },
      include: { student: { include: { enrollments: true } } }
    });
    const classIds = parentLinks.flatMap(link => link.student.enrollments.map(e => e.classId));

    events = await prisma.event.findMany({
      where: { 
        schoolId: viewer.schoolId,
        OR: [
          { classId: null },
          { classId: { in: classIds } }
        ]
      },
      include: { class: { select: { name: true, section: true } } },
      orderBy: { startTime: "asc" }
    });
  }

  const classes = isStaff ? await prisma.class.findMany({
    where: { schoolId: viewer.schoolId, isActive: true },
    orderBy: { name: "asc" }
  }) : [];

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-blue-700">CALENDAR</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Schedule & Meetings</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Upcoming events, parent-teacher meetings, and exams.</p>
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
            <article key={event.id} className="flex flex-col sm:flex-row gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center justify-center rounded-xl bg-blue-50 px-6 py-4 text-center sm:w-32">
                <span className="text-sm font-bold uppercase text-blue-700">{format(event.startTime, "MMM")}</span>
                <span className="text-3xl font-black text-slate-900">{format(event.startTime, "dd")}</span>
                <span className="mt-1 text-xs font-semibold text-slate-500">{format(event.startTime, "h:mm a")}</span>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">{event.title}</h2>
                  {event.class ? (
                    <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                      Class {event.class.name} {event.class.section}
                    </span>
                  ) : (
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                      Whole School
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="mt-2 text-slate-600">{event.description}</p>
                )}
                <div className="mt-3 text-sm font-medium text-slate-500">
                  Ends at {format(event.endTime, "h:mm a")}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

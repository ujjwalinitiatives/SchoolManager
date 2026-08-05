import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { format } from "date-fns";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateNoticeForm } from "@/components/create-notice-form";
import { NoticesClient } from "./notices-client";

export default async function NoticesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true }
  });

  if (!viewer) redirect("/login");

  const isStaff = viewer.role === "PRINCIPAL" || viewer.role === "TEACHER";

  let notices: any[] = [];

  if (isStaff) {
    notices = await prisma.notice.findMany({
      where: { schoolId: viewer.schoolId as string },
      include: { author: { select: { name: true, role: true } }, classLinks: { include: { class: true } } },
      orderBy: { createdAt: "desc" }
    });
  } else if (viewer.role === "PARENT" || viewer.role === "STUDENT") {
    let classIds: string[] = [];
    if (viewer.role === "PARENT") {
      const parentLinks = await prisma.parentStudentLink.findMany({
        where: { parentId: viewer.id },
        include: { student: { include: { enrollments: true } } }
      });
      classIds = parentLinks.flatMap((link: any) => link.student.enrollments.map((e: any) => e.classId));
    } else {
      const student = await prisma.student.findUnique({
        where: { userId: viewer.id },
        include: { enrollments: true }
      });
      if (student) {
        classIds = student.enrollments.map(e => e.classId);
      }
    }

    notices = await prisma.notice.findMany({
      where: { 
        schoolId: viewer.schoolId as string,
        OR: [
          { targetAudience: "ALL" },
          { classLinks: { some: { classId: { in: classIds } } } }
        ]
      },
      include: { author: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" }
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
          <p className="text-sm font-semibold tracking-wide text-blue-700">MESSAGING</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">Notice Board</h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">Important announcements and updates.</p>
        </div>
        {isStaff && <CreateNoticeForm classes={classes} />}
      </header>

      <NoticesClient notices={notices as any} isTeacher={viewer.role === "TEACHER"} />
    </main>
  );
}

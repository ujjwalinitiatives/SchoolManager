import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessagesClient } from "./messages-client";

export default async function MessagesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true },
  });
  if (!viewer) redirect("/login");

  if (!["TEACHER", "PARENT", "PRINCIPAL", "STUDENT", "ACCOUNTANT"].includes(viewer.role)) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center py-20 px-5">
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
      </main>
    );
  }

  // Fetch messages where viewer is sender or receiver
  const messages = await prisma.message.findMany({
    where: {
      schoolId: viewer.schoolId as string,
      OR: [
        { senderId: viewer.id },
        { receiverId: viewer.id }
      ]
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      receiver: { select: { id: true, name: true, role: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  // Get potential contacts
  let contacts: any[] = [];
  if (viewer.role === "TEACHER") {
    // Teachers can message students of their classes (and parents if linked)
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId: viewer.id },
      include: {
        enrollments: {
          where: { student: { isActive: true } },
          include: { student: { include: { user: true, parentLinks: { include: { parent: true } } } } }
        }
      }
    });

    const contactMap = new Map();
    teacherClasses.forEach(cls => {
      cls.enrollments.forEach(enr => {
        if (enr.student.user) {
          contactMap.set(enr.student.user.id, enr.student.user);
        }
        enr.student.parentLinks.forEach(link => {
          if (link.parent) {
            contactMap.set(link.parent.id, link.parent);
          }
        });
      });
    });
    contacts = Array.from(contactMap.values());
  } else if (viewer.role === "PARENT") {
    // Parents can message teachers of their students
    const parentLinks = await prisma.parentStudentLink.findMany({
      where: { parentId: viewer.id, student: { isActive: true } },
      include: {
        student: {
          include: {
            enrollments: {
              include: { class: { include: { teacher: true } } }
            }
          }
        }
      }
    });

    const teacherMap = new Map();
    parentLinks.forEach(link => {
      link.student.enrollments.forEach(enr => {
        if (enr.class.teacher) {
          teacherMap.set(enr.class.teacher.id, enr.class.teacher);
        }
      });
    });
    contacts = Array.from(teacherMap.values());
  } else if (viewer.role === "STUDENT") {
    // Students can message teachers of their classes
    const student = await prisma.student.findUnique({
      where: { userId: viewer.id, isActive: true },
      include: {
        enrollments: {
          include: { class: { include: { teacher: true } } }
        }
      }
    });

    const teacherMap = new Map();
    if (student) {
      student.enrollments.forEach(enr => {
        if (enr.class.teacher) {
          teacherMap.set(enr.class.teacher.id, enr.class.teacher);
        }
      });
    }
    contacts = Array.from(teacherMap.values());
  } else if (viewer.role === "PRINCIPAL" || viewer.role === "ACCOUNTANT") {
    contacts = await prisma.user.findMany({
      where: { schoolId: viewer.schoolId as string, id: { not: viewer.id } }
    });
  }

  // Always append anyone we have a message history with (to handle accountants messaging students)
  const historyUserIds = new Set(contacts.map(c => c.id));
  messages.forEach(m => {
    if (m.senderId !== viewer.id) historyUserIds.add(m.senderId);
    if (m.receiverId !== viewer.id) historyUserIds.add(m.receiverId);
  });

  const missingIds = Array.from(historyUserIds).filter(id => !contacts.some(c => c.id === id));
  
  if (missingIds.length > 0) {
    const historicalContacts = await prisma.user.findMany({
      where: { id: { in: missingIds } },
      select: { id: true, name: true, role: true }
    });
    contacts = [...contacts, ...historicalContacts];
  }

  return <MessagesClient viewerId={viewer.id} messages={messages} contacts={contacts} />;
}

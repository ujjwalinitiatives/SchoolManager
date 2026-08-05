import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentsClient } from "./students-client";

export default async function StudentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true },
  });
  if (!viewer || !viewer.schoolId) redirect("/login");

  const isPrincipal = viewer.role === "PRINCIPAL";

  // Get all active students with their current enrollment
  const activeSession = await prisma.academicSession.findFirst({
    where: { 
      schoolId: viewer.schoolId as string,
      isActive: true
    },
  });

  let students = await prisma.student.findMany({
    where: { 
      schoolId: viewer.schoolId as string, 
      isActive: true,
      ...(viewer.role === "TEACHER" ? {
        enrollments: {
          some: {
            class: { teacherId: viewer.id },
            ...(activeSession ? { academicSessionId: activeSession.id } : {})
          }
        }
      } : {})
    },
    include: {
      enrollments: {
        where: activeSession ? { academicSessionId: activeSession.id } : {},
        include: { class: { select: { name: true, section: true } } },
        take: 1,
      },
      parentLinks: {
        include: { parent: { select: { name: true, email: true } } },
      },
    },
  });

  // Group students by class
  const classMap = new Map<string, { id: string, name: string, section: string, students: any[] }>();

  students.forEach(student => {
    const enr = student.enrollments[0];
    if (!enr) return; // Skip students with no active enrollment

    const cls = enr.class;
    const classId = `${cls.name}-${cls.section}`;

    if (!classMap.has(classId)) {
      classMap.set(classId, {
        id: classId,
        name: cls.name,
        section: cls.section,
        students: []
      });
    }

    const parentLink = student.parentLinks[0];
    
    classMap.get(classId)!.students.push({
      id: student.id,
      name: student.name,
      admissionNumber: student.admissionNumber,
      parentName: parentLink?.parent?.name || null,
      parentEmail: parentLink?.parent?.email || null,
      className: cls.name,
      section: cls.section,
      rollNumber: enr.rollNumber
    });
  });

  const classGroups = Array.from(classMap.values()).sort((a, b) => {
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    return a.section.localeCompare(b.section);
  });

  return (
    <StudentsClient classes={classGroups} isPrincipal={isPrincipal} />
  );
}

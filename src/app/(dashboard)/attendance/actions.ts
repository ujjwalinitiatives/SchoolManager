"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markAttendance(studentId: string, classId: string, academicSessionId: string, dateStr: string, status: "PRESENT" | "ABSENT") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true },
  });

  if (!viewer || !viewer.schoolId || viewer.role !== "TEACHER") {
    throw new Error("Unauthorized: Only teachers can mark attendance");
  }

  const date = new Date(dateStr);

  await prisma.attendance.upsert({
    where: {
      studentId_date: {
        studentId,
        date,
      }
    },
    update: {
      status,
      markedById: viewer.id,
    },
    create: {
      studentId,
      classId,
      academicSessionId,
      date,
      status,
      markedById: viewer.id,
    }
  });

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
}

export async function toggleSchoolClosure(dateStr: string, isClosed: boolean, reason?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true },
  });

  if (!viewer || !viewer.schoolId || viewer.role !== "TEACHER") {
    throw new Error("Unauthorized");
  }

  const date = new Date(dateStr);

  if (isClosed) {
    await prisma.schoolClosure.upsert({
      where: {
        schoolId_date: {
          schoolId: viewer.schoolId,
          date,
        }
      },
      update: {
        reason,
        recordedById: viewer.id,
      },
      create: {
        schoolId: viewer.schoolId,
        date,
        reason,
        recordedById: viewer.id,
      }
    });
  } else {
    await prisma.schoolClosure.deleteMany({
      where: {
        schoolId: viewer.schoolId,
        date,
      }
    });
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
}

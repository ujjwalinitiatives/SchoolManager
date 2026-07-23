"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessDeniedError, validateRole } from "@/lib/access-control";
import { headers } from "next/headers";

async function getViewer() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new AccessDeniedError("Not authenticated");
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true }
  });
  if (!user) throw new AccessDeniedError("User not found");
  return user;
}

export async function createEvent(formData: FormData) {
  const viewer = await getViewer();
  validateRole(viewer.role, ["PRINCIPAL", "TEACHER"]);

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const startTimeStr = formData.get("startTime") as string;
  const endTimeStr = formData.get("endTime") as string;
  const classId = formData.get("classId") as string; // Optional

  if (!title || !startTimeStr || !endTimeStr) {
    throw new Error("Missing required fields.");
  }

  await prisma.event.create({
    data: {
      schoolId: viewer.schoolId,
      title,
      description,
      startTime: new Date(startTimeStr),
      endTime: new Date(endTimeStr),
      classId: classId || null,
    }
  });

  revalidatePath("/schedule");
}

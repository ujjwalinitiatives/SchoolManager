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

  const title = (formData.get("title") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const startTimeStr = formData.get("startTime") as string;
  const endTimeStr = formData.get("endTime") as string;
  const targetAudience = (formData.get("targetAudience") as string) === "SPECIFIC_CLASSES" 
    ? "SPECIFIC_CLASSES" 
    : "ALL";
    
  const classIds = formData.getAll("classIds") as string[];

  // Input validation
  if (!title || title.length > 200) {
    throw new Error("Title is required and must be under 200 characters.");
  }
  if (!startTimeStr || !endTimeStr) {
    throw new Error("Start time and end time are required.");
  }

  const startTime = new Date(startTimeStr);
  const endTime = new Date(endTimeStr);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error("Invalid date format.");
  }
  if (endTime <= startTime) {
    throw new Error("End time must be after start time.");
  }

  // IDOR Prevention: validate classIds belongs to viewer's school
  if (targetAudience === "SPECIFIC_CLASSES" && classIds.length > 0) {
    const validClasses = await prisma.class.count({
      where: { 
        id: { in: classIds },
        schoolId: viewer.schoolId as string 
      }
    });
    if (validClasses !== classIds.length) {
      throw new AccessDeniedError("One or more selected classes do not belong to your school.");
    }
  }

  await prisma.event.create({
    data: {
      schoolId: viewer.schoolId as string,
      authorId: viewer.id,
      title,
      description: description || null,
      startTime,
      endTime,
      targetAudience,
      classLinks: targetAudience === "SPECIFIC_CLASSES" && classIds.length > 0
        ? { create: classIds.map(id => ({ classId: id })) }
        : undefined
    }
  });

  revalidatePath("/schedule");
}

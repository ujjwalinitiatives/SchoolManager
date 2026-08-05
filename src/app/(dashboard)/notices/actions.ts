"use server";

import { revalidatePath } from "next/cache";
import { NoticeAudience } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessDeniedError, validateRole } from "@/lib/access-control";
import { headers } from "next/headers";
import { inngest } from "@/inngest/client";

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

export async function createNotice(formData: FormData) {
  const viewer = await getViewer();
  validateRole(viewer.role, ["PRINCIPAL", "TEACHER"]);

  const title = (formData.get("title") as string || "").trim();
  const content = (formData.get("content") as string || "").trim();
  const audience = formData.get("targetAudience") as NoticeAudience;
  const classIds = formData.getAll("classIds") as string[];

  // Input validation
  if (!title || title.length > 200) {
    throw new Error("Title is required and must be under 200 characters.");
  }
  if (!content || content.length > 10000) {
    throw new Error("Content is required and must be under 10,000 characters.");
  }

  // IDOR Prevention: validate all classIds belong to viewer's school
  if (audience === "SPECIFIC_CLASSES" && classIds.length > 0) {
    const validCount = await prisma.class.count({
      where: { id: { in: classIds }, schoolId: viewer.schoolId as string }
    });
    if (validCount !== classIds.length) {
      throw new AccessDeniedError("One or more selected classes do not belong to your school.");
    }
  }

  const notice = await prisma.notice.create({
    data: {
      schoolId: viewer.schoolId as string,
      title,
      content,
      targetAudience: audience || "ALL",
      authorId: viewer.id,
      classLinks: audience === "SPECIFIC_CLASSES" && classIds.length > 0 
        ? { create: classIds.map(classId => ({ classId })) } 
        : undefined,
    }
  });

  try {
    await inngest.send({
      name: "notification/broadcast",
      data: { noticeId: notice.id }
    });
  } catch (error) {
    console.warn("Failed to trigger Inngest notification broadcast:", error);
  }

  revalidatePath("/notices");
  return notice.id;
}

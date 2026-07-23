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
  // For now, only PRINCIPAL and TEACHER can create notices
  validateRole(viewer.role, ["PRINCIPAL", "TEACHER"]);

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const audience = formData.get("targetAudience") as NoticeAudience;
  const classIds = formData.getAll("classIds") as string[];

  if (!title || !content) {
    throw new Error("Title and content are required.");
  }

  const notice = await prisma.notice.create({
    data: {
      schoolId: viewer.schoolId,
      title,
      content,
      targetAudience: audience || "ALL",
      authorId: viewer.id,
      classLinks: audience === "SPECIFIC_CLASSES" && classIds.length > 0 
        ? { create: classIds.map(classId => ({ classId })) } 
        : undefined,
    }
  });

  await inngest.send({
    name: "notification/broadcast",
    data: { noticeId: notice.id }
  });

  revalidatePath("/notices");
  return notice.id;
}

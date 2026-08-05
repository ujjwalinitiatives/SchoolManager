"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessDeniedError, validateRole } from "@/lib/access-control";

async function getViewer() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new AccessDeniedError("Not authenticated");
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true }
  });
  if (!user) throw new AccessDeniedError("User not found");
  if (!user.schoolId) throw new AccessDeniedError("User does not belong to a school");
  
  validateRole(user.role, ["PRINCIPAL", "ACCOUNTANT"]);
  return { ...user, schoolId: user.schoolId }; // Cast schoolId as non-null string
}

export async function sendFeeReminderMessage(formData: FormData) {
  const viewer = await getViewer();
  const studentId = formData.get("studentId") as string;
  const amountStr = formData.get("amount") as string;

  if (!studentId) return { error: "Student ID required" };

  const student = await prisma.student.findUnique({
    where: { id: studentId, schoolId: viewer.schoolId as string },
    include: { parentLinks: true }
  });

  if (!student) return { error: "Student not found" };
  
  let receiverId = "";
  if (student.parentLinks.length > 0) {
    receiverId = student.parentLinks[0].parentId;
  } else if (student.userId) {
    receiverId = student.userId;
  } else {
    return { error: "No parent or student account linked. Cannot send reminder message." };
  }
  
  const customMessage = formData.get("customMessage") as string;
  const messageContent = customMessage || `Dear Parent/Student, this is a reminder from the accounts department that there are pending fee dues (approx ₹${amountStr}) for ${student.name}. Please pay via the dashboard at your earliest convenience. Thank you.`;

  await prisma.message.create({
    data: {
      schoolId: viewer.schoolId as string,
      senderId: viewer.id,
      receiverId: receiverId,
      content: messageContent
    }
  });

  revalidatePath("/accountant/classes");
  return { success: true };
}

export async function setFeeStructure(formData: FormData) {
  const viewer = await getViewer();
  const classId = formData.get("classId") as string;
  const name = formData.get("name") as string;
  const amountStr = formData.get("amount") as string;
  const frequency = formData.get("frequency") as any;

  if (!classId || !name || !amountStr || !frequency) {
    throw new Error("Missing required fields");
  }

  // Find active academic session
  const session = await prisma.academicSession.findFirst({
    where: { schoolId: viewer.schoolId as string, isActive: true }
  });

  if (!session) {
    throw new Error("No active academic session found");
  }

  // Create Fee Structure mapping first
  const feeStructure = await prisma.feeStructure.create({
    data: {
      academicSessionId: session.id,
      classId,
      frequency,
      effectiveFrom: new Date()
    }
  });

  // Create Fee Component attached to the structure
  await prisma.feeComponent.create({
    data: {
      feeStructureId: feeStructure.id,
      name,
      amount: parseFloat(amountStr)
    }
  });

  revalidatePath("/accountant/classes");
}

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

async function getViewer() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Not authenticated");
  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true, name: true },
  });
  if (!viewer) throw new Error("User not found");
  return viewer;
}

export async function sendMessage(formData: FormData) {
  const viewer = await getViewer();
  const receiverId = formData.get("receiverId") as string;
  const content = formData.get("content") as string;

  if (!receiverId || !content) {
    throw new Error("Missing receiver or content");
  }

  // Ensure receiver is in the same school
  const receiver = await prisma.user.findFirst({
    where: { id: receiverId, schoolId: viewer.schoolId as string }
  });

  if (!receiver) {
    throw new Error("Invalid receiver");
  }

  await prisma.$transaction(async (tx) => {
    await tx.message.create({
      data: {
        senderId: viewer.id,
        receiverId,
        content,
        schoolId: viewer.schoolId as string
      }
    });

    const senderName = viewer.name || viewer.role; // Default to role if name is missing
    await tx.notification.create({
      data: {
        userId: receiverId,
        title: "New Message",
        message: `You have received a new message from ${senderName}.`,
        link: "/messages"
      }
    });
  });

  if (receiver.email && receiver.emailVerified) {
    const senderName = viewer.name || viewer.role;
    await sendEmail(
      receiver.email,
      "New Message Received - SchoolManager",
      `<p>Hello,</p><p>You have received a new message from <strong>${senderName}</strong> on SchoolManager.</p><p><a href="https://your-domain.com/messages">Click here to view your messages</a></p>`
    );
  }

  revalidatePath("/messages");
}

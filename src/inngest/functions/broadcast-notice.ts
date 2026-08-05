import { inngest } from "../client";
import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 50;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const broadcastNoticeJob = inngest.createFunction(
  {
    id: "broadcast-notice",
    triggers: [{ event: "notification/broadcast" }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { noticeId } = event.data;

    const notice = await step.run("fetch-notice", async () => {
      return prisma.notice.findUniqueOrThrow({
        where: { id: noticeId },
        include: { classLinks: true },
      });
    });

    const parentEmails: string[] = await step.run("fetch-parents", async () => {
      let parents;
      if (notice.targetAudience === "ALL") {
        parents = await prisma.user.findMany({
          where: { schoolId: notice.schoolId, role: "PARENT" },
          select: { email: true }
        });
      } else {
        const classIds = notice.classLinks.map((l: { classId: string }) => l.classId);
        parents = await prisma.user.findMany({
          where: {
            schoolId: notice.schoolId,
            role: "PARENT",
            parentLinks: {
              some: {
                student: {
                  enrollments: {
                    some: { classId: { in: classIds } }
                  }
                }
              }
            }
          },
          select: { email: true }
        });
      }
      return [...new Set(parents.map((p: { email: string }) => p.email).filter(Boolean))]; // Deduplicate
    });

    if (parentEmails.length === 0) {
      return { sent: 0 };
    }

    // Send in batches to avoid payload limits
    const totalBatches = Math.ceil(parentEmails.length / BATCH_SIZE);
    const safeTitle = escapeHtml(notice.title);
    const safeContent = escapeHtml(notice.content);
    
    for (let i = 0; i < totalBatches; i++) {
      const batch = parentEmails.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      const emailJobs = batch.map((email: string) => ({
        name: "notification/email.send" as const,
        data: {
          to: email,
          subject: `School Notice: ${notice.title}`,
          html: `<h2>${safeTitle}</h2><p>${safeContent.replace(/\n/g, "<br/>")}</p>`,
          text: `${notice.title}\n\n${notice.content}`,
        },
      }));
      await step.sendEvent(`send-batch-${i}`, emailJobs);
    }

    return { sent: parentEmails.length };
  }
);

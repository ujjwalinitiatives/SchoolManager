import { inngest } from "../client";
import { prisma } from "@/lib/prisma";

export const broadcastNoticeJob = inngest.createFunction(
  { id: "broadcast-notice" },
  { event: "notification/broadcast" },
  async ({ event, step }) => {
    const { noticeId } = event.data;

    const notice = await step.run("fetch-notice", async () => {
      return prisma.notice.findUnique({
        where: { id: noticeId },
        include: { classLinks: true }
      });
    });

    if (!notice) return { error: "Notice not found" };

    const parentEmails = await step.run("fetch-parent-emails", async () => {
      let parents;
      if (notice.targetAudience === "ALL") {
        // Fetch all parents in the school
        parents = await prisma.user.findMany({
          where: { schoolId: notice.schoolId, role: "PARENT" },
          select: { email: true }
        });
      } else {
        // Fetch parents of students in specific classes
        const classIds = notice.classLinks.map(l => l.classId);
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
      return parents.map(p => p.email).filter(Boolean);
    });

    // We can dispatch individual send-email jobs to parallelize the load
    if (parentEmails.length > 0) {
      const emailJobs = parentEmails.map(email => ({
        name: "notification/email.send",
        data: {
          to: email,
          subject: `New Notice: ${notice.title}`,
          html: `<p>A new notice has been posted on the School Board:</p><h2>${notice.title}</h2><p>${notice.content.replace(/\n/g, '<br/>')}</p>`,
          text: `New Notice: ${notice.title}\n\n${notice.content}`,
        }
      }));

      // Inngest supports sending multiple events at once
      await step.sendEvent("dispatch-emails", emailJobs);
    }

    return { success: true, parentsNotified: parentEmails.length };
  }
);

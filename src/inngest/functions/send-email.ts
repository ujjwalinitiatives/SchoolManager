import { inngest } from "../client";
import { sendEmail } from "@/lib/email";

export const sendEmailJob = inngest.createFunction(
  {
    id: "send-email-notification",
    retries: 3,
    triggers: [{ event: "notification/email.send" }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { to, subject, html } = event.data;

    await step.run("send-via-smtp", async () => {
      await sendEmail(to, subject, html);
      return { success: true };
    });

    return { event: event.name, success: true };
  }
);

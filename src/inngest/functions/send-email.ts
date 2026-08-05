import { inngest } from "../client";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "mock-key");

export const sendEmailJob = inngest.createFunction(
  {
    id: "send-email-notification",
    retries: 3,
    triggers: [{ event: "notification/email.send" }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { to, subject, html, text } = event.data;

    await step.run("send-via-resend", async () => {
      if (!process.env.RESEND_API_KEY) {
        console.log(`[Mock Email] To: ${to} | Subject: ${subject}`);
        return { success: true, mock: true };
      }

      const response = await resend.emails.send({
        from: "School Manager <noreply@schoolmanager.example.com>",
        to,
        subject,
        html,
        text,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    });

    return { event: event.name, success: true };
  }
);

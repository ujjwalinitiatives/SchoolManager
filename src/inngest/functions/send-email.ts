import { inngest } from "../client";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { createElement } from "react";
// We would create actual React Email templates, for now we will just use a simple raw text/html fallback.

const resend = new Resend(process.env.RESEND_API_KEY || "mock-key");

// @ts-ignore - Bypass inngest type signature changes
export const sendEmailJob = inngest.createFunction(
  { id: "send-email-notification", retries: 3 },
  { event: "notification/email.send" },
  async ({ event, step }) => {
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

import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("❌ SMTP NOT CONFIGURED - Missing SMTP_HOST, SMTP_USER, or SMTP_PASS environment variables");
    throw new Error("Email service not configured. Please contact the administrator.");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"SchoolManager" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent successfully to ${to} (messageId: ${info.messageId})`);
    return info;
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${to}:`, error?.message || error);
    throw new Error(`Failed to send email to ${to}: ${error?.message || "Unknown error"}`);
  }
}


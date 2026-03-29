import { Resend } from "resend";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const { env } = await getCloudflareContext({ async: true });
  const resend = new Resend(env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: "Fluent <noreply@fluent.app>",
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/lib/db/schema";
import { sendEmail } from "@/lib/services/email/resend";
import { renderResetPasswordEmail } from "@/lib/services/email/templates/reset-password";

export async function createAuth() {
  const { env } = await getCloudflareContext({ async: true });
  const db = drizzle(env.DB, { schema });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      usePlural: false,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.BETTER_AUTH_URL, "https://plataforma.inglesnavidareal.com.br", "https://*.marcelocajueiro.workers.dev"],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      resetPasswordTokenExpiresIn: 60 * 60 * 24,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Redefinir sua senha — Inglês na Vida Real",
          html: renderResetPasswordEmail({ url, name: user.name }),
        });
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "teacher",
          input: false,
        },
      },
    },
    plugins: [nextCookies()],
  });
}

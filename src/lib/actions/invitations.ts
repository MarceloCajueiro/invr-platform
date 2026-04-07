"use server";

import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { Resend } from "resend";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { invitations, students, teachers, turmas as turmasTable, turmaStudents, user } from "@/lib/db/schema";

export async function createInvitation(email: string, turmaId: string) {
  const auth = await createAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Usuário não autenticado");
  }

  if (session.user.role !== "teacher") {
    throw new Error("Apenas professores podem enviar convites");
  }

  const db = getDb();

  const teacher = await db.query.teachers.findFirst({
    where: eq(teachers.userId, session.user.id),
  });

  if (!teacher) {
    throw new Error("Perfil de professor não encontrado");
  }

  const turma = await db.query.turmas.findFirst({
    where: (t, { eq: e, and: a }) => a(e(t.id, turmaId), e(t.teacherId, teacher.id)),
  });
  if (!turma) throw new Error("Turma não encontrada");

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await db.insert(invitations).values({
    email,
    token,
    teacherId: teacher.id,
    turmaId,
    expiresAt,
  });

  const { env } = await getCloudflareContext({ async: true });
  const resend = new Resend(env.RESEND_API_KEY);
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const inviteLink = `${appUrl}/invite/${token}`;

  await resend.emails.send({
    from: "Fluent <noreply@inglesnavidareal.com.br>",
    to: email,
    subject: `${session.user.name} convidou você para o Fluent`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">Você foi convidado!</h2>
        <p style="color: #555; line-height: 1.6;">
          <strong>${session.user.name}</strong> convidou você para estudar inglês no <strong>Fluent</strong>.
        </p>
        <p style="color: #555; line-height: 1.6;">
          Clique no botão abaixo para aceitar o convite e criar sua conta:
        </p>
        <a href="${inviteLink}"
           style="display: inline-block; margin-top: 16px; padding: 12px 32px; background: #6c5ce7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Aceitar convite
        </a>
        <p style="margin-top: 24px; color: #999; font-size: 13px;">
          Este convite expira em 48 horas. Se você não esperava este email, pode ignorá-lo.
        </p>
      </div>
    `,
  });

  return { success: true };
}

export async function getInvitationByToken(token: string) {
  const db = getDb();

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
  });

  if (!invitation) return null;
  if (invitation.acceptedAt) return null;
  if (invitation.expiresAt < new Date()) return null;

  return invitation;
}

export async function acceptInvitation(
  token: string,
  name: string,
  password: string,
) {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    throw new Error("Convite inválido, expirado ou já utilizado");
  }

  const auth = await createAuth();

  const signUpResult = await auth.api.signUpEmail({
    body: {
      name,
      email: invitation.email,
      password,
    },
  });

  if (!signUpResult?.user) {
    throw new Error("Erro ao criar conta. Tente novamente.");
  }

  const db = getDb();

  await db
    .update(user)
    .set({ role: "student" })
    .where(eq(user.id, signUpResult.user.id));

  await db.insert(students).values({
    userId: signUpResult.user.id,
    teacherId: invitation.teacherId,
  });

  await db
    .update(invitations)
    .set({ acceptedAt: new Date() })
    .where(eq(invitations.id, invitation.id));

  if (invitation.turmaId) {
    const student = await db.query.students.findFirst({
      where: (s, { eq: e }) => e(s.userId, signUpResult.user.id),
    });
    if (student) {
      try {
        await db.insert(turmaStudents).values({
          turmaId: invitation.turmaId,
          studentId: student.id,
        });
      } catch {
        // Turma may have been deleted
      }
    }
  }

  await auth.api.signInEmail({
    body: {
      email: invitation.email,
      password,
    },
  });

  return { success: true };
}

"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getStudent } from "@/lib/auth/get-student";
import { getDb } from "@/lib/db";
import { challenges, challengeResponses, turmaChallenges } from "@/lib/db/schema";
import { createChallengeSchema, updateChallengeSchema } from "@/lib/validations/challenges";

function extractSingleUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0].url ?? null;
    }
    return null;
  } catch {
    return value || null;
  }
}

function parseTurmaIds(formData: FormData): string[] {
  const raw = formData.get("turmaIds") as string | null;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id: unknown) => typeof id === "string" && id.length > 0) : [];
  } catch {
    return [];
  }
}

export async function createChallenge(formData: FormData) {
  const { teacher } = await getTeacher();

  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    coverImageUrl: coverImageUrl ?? undefined,
    dueDate: formData.get("dueDate") || undefined,
  };

  const parsed = createChallengeSchema.parse(raw);

  const db = getDb();
  const [inserted] = await db.insert(challenges).values({
    teacherId: teacher.id,
    title: parsed.title,
    description: parsed.description || null,
    coverImageUrl: parsed.coverImageUrl || null,
    dueDate: parsed.dueDate || null,
    status: "draft",
  }).returning({ id: challenges.id });

  const turmaIds = parseTurmaIds(formData);
  if (turmaIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.batch(turmaIds.map((turmaId) =>
      db.insert(turmaChallenges).values({ turmaId, challengeId: inserted.id }),
    ) as any);
  }

  revalidatePath("/teacher/challenges");
  redirect("/teacher/challenges");
}

export async function updateChallenge(id: string, formData: FormData) {
  const { teacher } = await getTeacher();

  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    coverImageUrl: coverImageUrl ?? undefined,
    dueDate: formData.get("dueDate") || undefined,
  };

  const parsed = updateChallengeSchema.parse(raw);

  const db = getDb();
  await db
    .update(challenges)
    .set({
      ...parsed,
      coverImageUrl: parsed.coverImageUrl || null,
      dueDate: parsed.dueDate || null,
      updatedAt: new Date(),
    })
    .where(and(eq(challenges.id, id), eq(challenges.teacherId, teacher.id)));

  // Sync turma links
  const turmaIds = parseTurmaIds(formData);
  await db.delete(turmaChallenges).where(eq(turmaChallenges.challengeId, id));
  if (turmaIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.batch(turmaIds.map((turmaId) =>
      db.insert(turmaChallenges).values({ turmaId, challengeId: id }),
    ) as any);
  }

  revalidatePath("/teacher/challenges");
  redirect("/teacher/challenges");
}

export async function deleteChallenge(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID do desafio é obrigatório");

  const db = getDb();
  await db
    .delete(challenges)
    .where(and(eq(challenges.id, id), eq(challenges.teacherId, teacher.id)));

  revalidatePath("/teacher/challenges");
}

export async function toggleChallengeStatus(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID do desafio é obrigatório");

  const db = getDb();
  await db
    .update(challenges)
    .set({
      status: sql`CASE WHEN ${challenges.status} = 'draft' THEN 'published' ELSE 'draft' END`,
      updatedAt: new Date(),
    })
    .where(and(eq(challenges.id, id), eq(challenges.teacherId, teacher.id)));

  revalidatePath("/teacher/challenges");
}

export async function submitChallengeResponse(
  challengeId: string,
  content: string,
  attachments: string,
) {
  const { student } = await getStudent();
  const db = getDb();

  // Verify challenge exists, is published, belongs to student's teacher
  const challenge = await db.query.challenges.findFirst({
    where: (c, { eq: e, and: a }) =>
      a(
        e(c.id, challengeId),
        e(c.teacherId, student.teacherId),
        e(c.status, "published"),
      ),
  });

  if (!challenge) {
    throw new Error("Desafio não encontrado");
  }

  // Check if already responded
  const existing = await db.query.challengeResponses.findFirst({
    where: (r, { eq: e, and: a }) =>
      a(e(r.studentId, student.id), e(r.challengeId, challengeId)),
  });

  if (existing) {
    throw new Error("Você já respondeu este desafio");
  }

  await db.insert(challengeResponses).values({
    challengeId,
    studentId: student.id,
    content: content || null,
    attachments: attachments || null,
  });

  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challengeId}`);
}

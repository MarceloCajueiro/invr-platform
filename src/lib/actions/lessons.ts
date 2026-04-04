"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getDb } from "@/lib/db";
import { lessons, turmaLessons } from "@/lib/db/schema";
import { createLessonSchema, updateLessonSchema } from "@/lib/validations/lessons";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Actions ──────────────────────────────────────────────────────────────────

export async function createLesson(formData: FormData) {
  const { teacher } = await getTeacher();

  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title: formData.get("title"),
    content: formData.get("content") || undefined,
    category: formData.get("category"),
    coverImageUrl: coverImageUrl ?? undefined,
    durationMinutes: formData.get("durationMinutes") || undefined,
  };

  const parsed = createLessonSchema.parse(raw);

  const db = getDb();
  const [inserted] = await db.insert(lessons).values({
    teacherId: teacher.id,
    title: parsed.title,
    content: parsed.content || null,
    category: parsed.category,
    coverImageUrl: parsed.coverImageUrl || null,
    durationMinutes: parsed.durationMinutes || null,
    status: "draft",
  }).returning({ id: lessons.id });

  const turmaIds = parseTurmaIds(formData);
  if (turmaIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.batch(turmaIds.map((turmaId) =>
      db.insert(turmaLessons).values({ turmaId, lessonId: inserted.id }),
    ) as any);
  }

  revalidatePath("/teacher/lessons");
  redirect("/teacher/lessons");
}

export async function updateLesson(id: string, formData: FormData) {
  const { teacher } = await getTeacher();

  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title: formData.get("title"),
    content: formData.get("content") || undefined,
    category: formData.get("category"),
    coverImageUrl: coverImageUrl ?? undefined,
    durationMinutes: formData.get("durationMinutes") || undefined,
  };

  const parsed = updateLessonSchema.parse(raw);

  const db = getDb();
  await db
    .update(lessons)
    .set({
      ...parsed,
      coverImageUrl: parsed.coverImageUrl || null,
      durationMinutes: parsed.durationMinutes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(lessons.id, id), eq(lessons.teacherId, teacher.id)));

  // Sync turma links: delete existing, re-insert selected
  const turmaIds = parseTurmaIds(formData);
  await db.delete(turmaLessons).where(eq(turmaLessons.lessonId, id));
  if (turmaIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.batch(turmaIds.map((turmaId) =>
      db.insert(turmaLessons).values({ turmaId, lessonId: id }),
    ) as any);
  }

  revalidatePath("/teacher/lessons");
  redirect("/teacher/lessons");
}

export async function deleteLesson(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID da aula e obrigatorio");

  const db = getDb();
  await db
    .delete(lessons)
    .where(and(eq(lessons.id, id), eq(lessons.teacherId, teacher.id)));

  revalidatePath("/teacher/lessons");
}

export async function toggleLessonStatus(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID da aula e obrigatorio");

  const db = getDb();
  await db
    .update(lessons)
    .set({
      status: sql`CASE WHEN ${lessons.status} = 'draft' THEN 'published' ELSE 'draft' END`,
      updatedAt: new Date(),
    })
    .where(and(eq(lessons.id, id), eq(lessons.teacherId, teacher.id)));

  revalidatePath("/teacher/lessons");
}

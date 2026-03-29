"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getDb } from "@/lib/db";
import { lessons } from "@/lib/db/schema";
import { createLessonSchema, updateLessonSchema } from "@/lib/validations/lessons";

export async function createLesson(formData: FormData) {
  const { teacher } = await getTeacher();

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    videoUrl: formData.get("videoUrl"),
    coverImageUrl: formData.get("coverImageUrl"),
    durationMinutes: formData.get("durationMinutes") || undefined,
  };

  const parsed = createLessonSchema.parse(raw);

  const db = getDb();
  await db.insert(lessons).values({
    teacherId: teacher.id,
    title: parsed.title,
    description: parsed.description || null,
    category: parsed.category,
    videoUrl: parsed.videoUrl || null,
    coverImageUrl: parsed.coverImageUrl || null,
    durationMinutes: parsed.durationMinutes || null,
    status: "draft",
  });

  revalidatePath("/lessons");
  redirect("/lessons");
}

export async function updateLesson(id: string, formData: FormData) {
  const { teacher } = await getTeacher();

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    videoUrl: formData.get("videoUrl"),
    coverImageUrl: formData.get("coverImageUrl"),
    durationMinutes: formData.get("durationMinutes") || undefined,
  };

  const parsed = updateLessonSchema.parse(raw);

  const db = getDb();
  await db
    .update(lessons)
    .set({
      ...parsed,
      videoUrl: parsed.videoUrl || null,
      coverImageUrl: parsed.coverImageUrl || null,
      durationMinutes: parsed.durationMinutes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(lessons.id, id), eq(lessons.teacherId, teacher.id)));

  revalidatePath("/lessons");
  redirect("/lessons");
}

export async function deleteLesson(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID da aula é obrigatório");

  const db = getDb();
  await db
    .delete(lessons)
    .where(and(eq(lessons.id, id), eq(lessons.teacherId, teacher.id)));

  revalidatePath("/lessons");
}

export async function toggleLessonStatus(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID da aula é obrigatório");

  const db = getDb();
  await db
    .update(lessons)
    .set({
      status: sql`CASE WHEN ${lessons.status} = 'draft' THEN 'published' ELSE 'draft' END`,
      updatedAt: new Date(),
    })
    .where(and(eq(lessons.id, id), eq(lessons.teacherId, teacher.id)));

  revalidatePath("/lessons");
}

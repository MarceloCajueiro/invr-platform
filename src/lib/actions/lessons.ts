"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getDb } from "@/lib/db";
import { lessons } from "@/lib/db/schema";
import { createLessonSchema, updateLessonSchema } from "@/lib/validations/lessons";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the first URL from a FileUpload JSON array, or return the raw
 * string if it's already a plain URL.
 */
function extractSingleUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0].url ?? null;
    }
    return null;
  } catch {
    // Not JSON — treat as a plain URL string
    return value || null;
  }
}

/**
 * Resolve the video URL from form data.
 * Supports both "link" mode (plain URL) and "upload" mode (FileUpload JSON).
 */
function resolveVideoUrl(formData: FormData): string | null {
  const source = formData.get("videoSource") as string | null;
  if (source === "upload") {
    return extractSingleUrl(formData.get("videoFile") as string | null);
  }
  // "link" mode or fallback
  const url = formData.get("videoUrl") as string | null;
  return url || null;
}

// ── Actions ──────────────────────────────────────────────────────────────────

export async function createLesson(formData: FormData) {
  const { teacher } = await getTeacher();

  const videoUrl = resolveVideoUrl(formData);
  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    videoUrl: videoUrl || undefined,
    coverImageUrl: coverImageUrl ?? undefined,
    audioUrls: (formData.get("audioUrls") as string) || undefined,
    documentUrls: (formData.get("documentUrls") as string) || undefined,
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
    audioUrls: parsed.audioUrls || null,
    documentUrls: parsed.documentUrls || null,
    durationMinutes: parsed.durationMinutes || null,
    status: "draft",
  });

  revalidatePath("/teacher/lessons");
  redirect("/teacher/lessons");
}

export async function updateLesson(id: string, formData: FormData) {
  const { teacher } = await getTeacher();

  const videoUrl = resolveVideoUrl(formData);
  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    videoUrl: videoUrl || undefined,
    coverImageUrl: coverImageUrl ?? undefined,
    audioUrls: (formData.get("audioUrls") as string) || undefined,
    documentUrls: (formData.get("documentUrls") as string) || undefined,
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
      audioUrls: parsed.audioUrls || null,
      documentUrls: parsed.documentUrls || null,
      durationMinutes: parsed.durationMinutes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(lessons.id, id), eq(lessons.teacherId, teacher.id)));

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

"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getDb } from "@/lib/db";
import { tasks, turmaTasks } from "@/lib/db/schema";
import { createTaskSchema, updateTaskSchema } from "@/lib/validations/tasks";

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

export async function createTask(formData: FormData) {
  const { teacher } = await getTeacher();

  const publishedAtRaw = formData.get("publishedAt") as string | null;

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    taskType: formData.get("taskType"),
    level: formData.get("level"),
    lessonId: formData.get("lessonId") || undefined,
    questions: formData.get("questions") || undefined,
    publishedAt: publishedAtRaw || new Date().toISOString().split("T")[0],
  };

  const parsed = createTaskSchema.parse(raw);

  const aiGenerated = formData.get("aiGenerated") === "true";
  const aiPrompt = (formData.get("aiPrompt") as string) || undefined;

  const db = getDb();
  const [inserted] = await db.insert(tasks).values({
    teacherId: teacher.id,
    title: parsed.title,
    description: parsed.description || null,
    taskType: parsed.taskType,
    level: parsed.level,
    lessonId: parsed.lessonId || null,
    questions: parsed.questions || null,
    status: "draft",
    aiGenerated: aiGenerated,
    aiPrompt: aiPrompt || null,
    publishedAt: parsed.publishedAt ?? new Date(),
  }).returning({ id: tasks.id });

  const turmaIds = parseTurmaIds(formData);
  if (turmaIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.batch(turmaIds.map((turmaId) =>
      db.insert(turmaTasks).values({ turmaId, taskId: inserted.id }),
    ) as any);
  }

  revalidatePath("/teacher/tasks");
  redirect("/teacher/tasks");
}

export async function updateTask(id: string, formData: FormData) {
  const { teacher } = await getTeacher();

  const publishedAtRaw = formData.get("publishedAt") as string | null;

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    taskType: formData.get("taskType"),
    level: formData.get("level"),
    lessonId: formData.get("lessonId") || undefined,
    questions: formData.get("questions") || undefined,
    publishedAt: publishedAtRaw || undefined,
  };

  const parsed = updateTaskSchema.parse(raw);

  const aiGenerated = formData.get("aiGenerated") === "true";
  const aiPrompt = (formData.get("aiPrompt") as string) || undefined;

  const db = getDb();
  await db
    .update(tasks)
    .set({
      title: parsed.title,
      description: parsed.description || null,
      taskType: parsed.taskType,
      level: parsed.level,
      lessonId: parsed.lessonId || null,
      questions: parsed.questions || null,
      aiGenerated: aiGenerated,
      aiPrompt: aiPrompt || null,
      publishedAt: parsed.publishedAt ?? undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, id), eq(tasks.teacherId, teacher.id)));

  // Sync turma links
  const turmaIds = parseTurmaIds(formData);
  await db.delete(turmaTasks).where(eq(turmaTasks.taskId, id));
  if (turmaIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.batch(turmaIds.map((turmaId) =>
      db.insert(turmaTasks).values({ turmaId, taskId: id }),
    ) as any);
  }

  revalidatePath("/teacher/tasks");
  redirect("/teacher/tasks");
}

export async function deleteTask(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID da tarefa é obrigatório");

  const db = getDb();
  await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.teacherId, teacher.id)));

  revalidatePath("/teacher/tasks");
}

export async function toggleTaskStatus(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID da tarefa é obrigatório");

  const db = getDb();
  await db
    .update(tasks)
    .set({
      status: sql`CASE WHEN ${tasks.status} = 'draft' THEN 'published' ELSE 'draft' END`,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, id), eq(tasks.teacherId, teacher.id)));

  revalidatePath("/teacher/tasks");
}

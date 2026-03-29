"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getDb } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { createTaskSchema, updateTaskSchema } from "@/lib/validations/tasks";

export async function createTask(formData: FormData) {
  const { teacher } = await getTeacher();

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    taskType: formData.get("taskType"),
    level: formData.get("level"),
    lessonId: formData.get("lessonId") || undefined,
    questions: formData.get("questions") || undefined,
  };

  const parsed = createTaskSchema.parse(raw);

  const db = getDb();
  await db.insert(tasks).values({
    teacherId: teacher.id,
    title: parsed.title,
    description: parsed.description || null,
    taskType: parsed.taskType,
    level: parsed.level,
    lessonId: parsed.lessonId || null,
    questions: parsed.questions || null,
    status: "draft",
  });

  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function updateTask(id: string, formData: FormData) {
  const { teacher } = await getTeacher();

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    taskType: formData.get("taskType"),
    level: formData.get("level"),
    lessonId: formData.get("lessonId") || undefined,
    questions: formData.get("questions") || undefined,
  };

  const parsed = updateTaskSchema.parse(raw);

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
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, id), eq(tasks.teacherId, teacher.id)));

  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function deleteTask(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID da tarefa é obrigatório");

  const db = getDb();
  await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.teacherId, teacher.id)));

  revalidatePath("/tasks");
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

  revalidatePath("/tasks");
}

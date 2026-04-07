"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getDb } from "@/lib/db";
import {
  turmas,
  turmaStudents,
  turmaLessons,
  turmaTasks,
  students,
} from "@/lib/db/schema";
import { createTurmaSchema, updateTurmaSchema } from "@/lib/validations/turmas";

export async function createTurma(formData: FormData) {
  const { teacher } = await getTeacher();

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    color: formData.get("color") || undefined,
    level: formData.get("level") || undefined,
  };

  const parsed = createTurmaSchema.parse(raw);

  const db = getDb();
  await db.insert(turmas).values({
    teacherId: teacher.id,
    name: parsed.name,
    description: parsed.description || null,
    color: parsed.color || null,
    level: parsed.level || null,
  });

  revalidatePath("/teacher/turmas");
  redirect("/teacher/turmas");
}

export async function updateTurma(id: string, formData: FormData) {
  const { teacher } = await getTeacher();

  const raw = {
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    color: formData.get("color") || undefined,
    level: formData.get("level") || undefined,
  };

  const parsed = updateTurmaSchema.parse(raw);

  const db = getDb();
  await db
    .update(turmas)
    .set({
      name: parsed.name,
      description: parsed.description || null,
      color: parsed.color || null,
      level: parsed.level || null,
      updatedAt: new Date(),
    })
    .where(and(eq(turmas.id, id), eq(turmas.teacherId, teacher.id)));

  revalidatePath(`/teacher/turmas/${id}`);
  revalidatePath("/teacher/turmas");
  redirect(`/teacher/turmas/${id}`);
}

export async function deleteTurma(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID da turma é obrigatório");

  const db = getDb();
  await db
    .delete(turmas)
    .where(and(eq(turmas.id, id), eq(turmas.teacherId, teacher.id)));

  revalidatePath("/teacher/turmas");
  redirect("/teacher/turmas");
}

export async function removeStudentFromTurma(formData: FormData) {
  await getTeacher();
  const turmaId = formData.get("turmaId") as string;
  const studentId = formData.get("studentId") as string;

  if (!turmaId || !studentId)
    throw new Error("IDs da turma e aluno são obrigatórios");

  const db = getDb();
  await db
    .delete(turmaStudents)
    .where(
      and(
        eq(turmaStudents.turmaId, turmaId),
        eq(turmaStudents.studentId, studentId),
      ),
    );

  revalidatePath(`/teacher/turmas/${turmaId}`);
}

export async function linkLesson(formData: FormData) {
  await getTeacher();
  const turmaId = formData.get("turmaId") as string;
  const lessonId = formData.get("lessonId") as string;

  if (!turmaId || !lessonId)
    throw new Error("IDs da turma e aula são obrigatórios");

  const db = getDb();
  await db.insert(turmaLessons).values({ turmaId, lessonId });

  revalidatePath(`/teacher/turmas/${turmaId}`);
}

export async function unlinkLesson(formData: FormData) {
  await getTeacher();
  const turmaId = formData.get("turmaId") as string;
  const lessonId = formData.get("lessonId") as string;

  if (!turmaId || !lessonId)
    throw new Error("IDs da turma e aula são obrigatórios");

  const db = getDb();
  await db
    .delete(turmaLessons)
    .where(
      and(
        eq(turmaLessons.turmaId, turmaId),
        eq(turmaLessons.lessonId, lessonId),
      ),
    );

  revalidatePath(`/teacher/turmas/${turmaId}`);
}

export async function linkTask(formData: FormData) {
  await getTeacher();
  const turmaId = formData.get("turmaId") as string;
  const taskId = formData.get("taskId") as string;

  if (!turmaId || !taskId)
    throw new Error("IDs da turma e tarefa são obrigatórios");

  const db = getDb();
  await db.insert(turmaTasks).values({ turmaId, taskId });

  revalidatePath(`/teacher/turmas/${turmaId}`);
}

export async function unlinkTask(formData: FormData) {
  await getTeacher();
  const turmaId = formData.get("turmaId") as string;
  const taskId = formData.get("taskId") as string;

  if (!turmaId || !taskId)
    throw new Error("IDs da turma e tarefa são obrigatórios");

  const db = getDb();
  await db
    .delete(turmaTasks)
    .where(
      and(eq(turmaTasks.turmaId, turmaId), eq(turmaTasks.taskId, taskId)),
    );

  revalidatePath(`/teacher/turmas/${turmaId}`);
}

export async function addStudentToTurma(formData: FormData) {
  const { teacher } = await getTeacher();
  const turmaId = formData.get("turmaId") as string;
  const studentId = formData.get("studentId") as string;

  if (!turmaId || !studentId)
    throw new Error("IDs da turma e aluno são obrigatórios");

  const db = getDb();

  // Validate turma belongs to teacher
  const turma = await db.query.turmas.findFirst({
    where: (t, { eq: e, and: a }) =>
      a(e(t.id, turmaId), e(t.teacherId, teacher.id)),
  });
  if (!turma) throw new Error("Turma não encontrada");

  // Validate student belongs to teacher
  const student = await db.query.students.findFirst({
    where: (s, { eq: e, and: a }) =>
      a(e(s.id, studentId), e(s.teacherId, teacher.id)),
  });
  if (!student) throw new Error("Aluno não encontrado");

  await db.insert(turmaStudents).values({ turmaId, studentId });

  revalidatePath(`/teacher/turmas/${turmaId}`);
}

export async function updateTurmaSettings(id: string, formData: FormData) {
  const { teacher } = await getTeacher();

  const notifyNewLesson = formData.get("notifyNewLesson") === "on";
  const notifyNewTask = formData.get("notifyNewTask") === "on";

  const db = getDb();
  await db
    .update(turmas)
    .set({
      notifyNewLesson,
      notifyNewTask,
      updatedAt: new Date(),
    })
    .where(and(eq(turmas.id, id), eq(turmas.teacherId, teacher.id)));

  revalidatePath(`/teacher/turmas/${id}`);
}

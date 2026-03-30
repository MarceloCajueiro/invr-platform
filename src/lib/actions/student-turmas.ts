"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getStudent } from "@/lib/auth/get-student";
import { getDb } from "@/lib/db";
import { turmas, turmaStudents } from "@/lib/db/schema";

export async function joinTurma(
  inviteCode: string,
): Promise<{ success: boolean; error?: string }> {
  const { student } = await getStudent();
  const db = getDb();

  // Find turma by invite code
  const turma = await db.query.turmas.findFirst({
    where: (t, { eq: e }) => e(t.inviteCode, inviteCode.toUpperCase().trim()),
  });

  if (!turma) {
    return { success: false, error: "Código de convite inválido." };
  }

  // Verify turma belongs to student's teacher
  if (turma.teacherId !== student.teacherId) {
    return {
      success: false,
      error: "Esta turma não pertence ao seu professor.",
    };
  }

  // Check if already a member
  const existing = await db.query.turmaStudents.findFirst({
    where: (ts, { eq: e, and: a }) =>
      a(e(ts.turmaId, turma.id), e(ts.studentId, student.id)),
  });

  if (existing) {
    return { success: false, error: "Você já faz parte desta turma." };
  }

  // Insert membership
  await db.insert(turmaStudents).values({
    turmaId: turma.id,
    studentId: student.id,
  });

  revalidatePath("/turmas");
  return { success: true };
}

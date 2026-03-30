import { getDb } from "@/lib/db";
import { turmas, turmaStudents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getMyTurmas(studentId: string) {
  const db = getDb();

  return db
    .select({
      id: turmas.id,
      name: turmas.name,
      description: turmas.description,
      color: turmas.color,
      level: turmas.level,
      joinedAt: turmaStudents.createdAt,
    })
    .from(turmaStudents)
    .innerJoin(turmas, eq(turmaStudents.turmaId, turmas.id))
    .where(eq(turmaStudents.studentId, studentId))
    .orderBy(desc(turmaStudents.createdAt));
}

export async function getTurmaByInviteCode(inviteCode: string) {
  const db = getDb();

  return db.query.turmas.findFirst({
    where: (t, { eq: e }) => e(t.inviteCode, inviteCode),
  });
}

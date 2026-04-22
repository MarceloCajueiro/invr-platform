import { getDb } from "@/lib/db";
import { lessons, lessonProgresses, turmaLessons, turmaStudents } from "@/lib/db/schema";
import { eq, and, asc, inArray, lte } from "drizzle-orm";

export async function getStudentLessons(teacherId: string, studentId: string) {
  const db = getDb();

  // Get turma IDs the student belongs to
  const studentTurmas = await db
    .select({ turmaId: turmaStudents.turmaId })
    .from(turmaStudents)
    .where(eq(turmaStudents.studentId, studentId));

  const turmaIds = studentTurmas.map((t) => t.turmaId);
  if (turmaIds.length === 0) return [];

  // Get lesson IDs linked to those turmas
  const linkedLessons = await db
    .select({ lessonId: turmaLessons.lessonId })
    .from(turmaLessons)
    .where(inArray(turmaLessons.turmaId, turmaIds));

  const lessonIds = [...new Set(linkedLessons.map((l) => l.lessonId))];
  if (lessonIds.length === 0) return [];

  return db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.teacherId, teacherId),
        eq(lessons.status, "published"),
        inArray(lessons.id, lessonIds),
        lte(lessons.publishedAt, new Date()),
      ),
    )
    .orderBy(asc(lessons.position));
}

export async function getStudentLesson(lessonId: string, teacherId: string) {
  const db = getDb();

  return db.query.lessons.findFirst({
    where: (l, { eq: e, and: a, lte }) =>
      a(
        e(l.id, lessonId),
        e(l.teacherId, teacherId),
        e(l.status, "published"),
        lte(l.publishedAt, new Date()),
      ),
  });
}

export async function getLessonProgress(studentId: string, lessonId: string) {
  const db = getDb();

  return db.query.lessonProgresses.findFirst({
    where: (lp, { eq: e, and: a }) =>
      a(e(lp.studentId, studentId), e(lp.lessonId, lessonId)),
  });
}

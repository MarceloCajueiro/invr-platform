import { getDb } from "@/lib/db";
import { lessons, lessonProgresses } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function getStudentLessons(teacherId: string) {
  const db = getDb();

  return db
    .select()
    .from(lessons)
    .where(
      and(eq(lessons.teacherId, teacherId), eq(lessons.status, "published")),
    )
    .orderBy(asc(lessons.position));
}

export async function getStudentLesson(lessonId: string, teacherId: string) {
  const db = getDb();

  return db.query.lessons.findFirst({
    where: (l, { eq: e, and: a }) =>
      a(
        e(l.id, lessonId),
        e(l.teacherId, teacherId),
        e(l.status, "published"),
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

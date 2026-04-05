import { getDb } from "@/lib/db";
import { lessons, turmaLessons, turmas } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function getLessons(
  teacherId: string,
  filters?: { status?: string; category?: string; turmaId?: string },
) {
  const db = getDb();
  const conditions = [eq(lessons.teacherId, teacherId)];

  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(lessons.status, filters.status as "draft" | "published"));
  }
  if (filters?.category && filters.category !== "all") {
    conditions.push(
      eq(
        lessons.category,
        filters.category as
          | "conversation"
          | "grammar"
          | "vocabulary"
          | "listening"
          | "culture",
      ),
    );
  }

  if (filters?.turmaId && filters.turmaId !== "all") {
    const linkedLessonIds = await db
      .select({ lessonId: turmaLessons.lessonId })
      .from(turmaLessons)
      .where(eq(turmaLessons.turmaId, filters.turmaId));

    const ids = linkedLessonIds.map((r) => r.lessonId);
    if (ids.length === 0) return [];
    conditions.push(inArray(lessons.id, ids));
  }

  const lessonRows = await db
    .select()
    .from(lessons)
    .where(and(...conditions))
    .orderBy(desc(lessons.createdAt));

  if (lessonRows.length === 0) return [];

  const lessonIds = lessonRows.map((l) => l.id);
  const turmaLinks = await db
    .select({
      lessonId: turmaLessons.lessonId,
      turmaId: turmas.id,
      turmaName: turmas.name,
      turmaColor: turmas.color,
    })
    .from(turmaLessons)
    .innerJoin(turmas, eq(turmaLessons.turmaId, turmas.id))
    .where(inArray(turmaLessons.lessonId, lessonIds));

  const turmaMap = new Map<string, { id: string; name: string; color: string | null }[]>();
  for (const link of turmaLinks) {
    const arr = turmaMap.get(link.lessonId) ?? [];
    arr.push({ id: link.turmaId, name: link.turmaName, color: link.turmaColor });
    turmaMap.set(link.lessonId, arr);
  }

  return lessonRows.map((lesson) => ({
    ...lesson,
    turmas: turmaMap.get(lesson.id) ?? [],
  }));
}

export async function getLesson(id: string, teacherId: string) {
  const db = getDb();
  return db.query.lessons.findFirst({
    where: (l, { eq: e, and: a }) =>
      a(e(l.id, id), e(l.teacherId, teacherId)),
  });
}

import { getDb } from "@/lib/db";
import { lessons } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getLessons(
  teacherId: string,
  filters?: { status?: string; category?: string },
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

  return db
    .select()
    .from(lessons)
    .where(and(...conditions))
    .orderBy(desc(lessons.createdAt));
}

export async function getLesson(id: string, teacherId: string) {
  const db = getDb();
  return db.query.lessons.findFirst({
    where: (l, { eq: e, and: a }) =>
      a(e(l.id, id), e(l.teacherId, teacherId)),
  });
}

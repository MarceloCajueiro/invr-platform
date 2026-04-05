import { getDb } from "@/lib/db";
import { posts, turmaPosts, turmaStudents } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function getPublishedPosts(
  teacherId: string,
  studentId: string,
  filters?: { category?: string },
) {
  const db = getDb();

  // Get turma IDs the student belongs to
  const studentTurmas = await db
    .select({ turmaId: turmaStudents.turmaId })
    .from(turmaStudents)
    .where(eq(turmaStudents.studentId, studentId));

  const turmaIds = studentTurmas.map((t) => t.turmaId);
  if (turmaIds.length === 0) return [];

  // Get post IDs linked to those turmas
  const linkedPosts = await db
    .select({ postId: turmaPosts.postId })
    .from(turmaPosts)
    .where(inArray(turmaPosts.turmaId, turmaIds));

  const postIds = [...new Set(linkedPosts.map((p) => p.postId))];
  if (postIds.length === 0) return [];

  const conditions = [
    eq(posts.teacherId, teacherId),
    eq(posts.status, "published"),
    inArray(posts.id, postIds),
  ];

  if (filters?.category && filters.category !== "all") {
    conditions.push(
      eq(
        posts.category,
        filters.category as "tips" | "grammar" | "culture" | "vocabulary",
      ),
    );
  }

  return db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.featured), desc(posts.createdAt));
}

export async function getPublishedPost(slug: string, teacherId: string) {
  const db = getDb();

  return db.query.posts.findFirst({
    where: (p, { eq: e, and: a }) =>
      a(e(p.slug, slug), e(p.teacherId, teacherId), e(p.status, "published")),
  });
}

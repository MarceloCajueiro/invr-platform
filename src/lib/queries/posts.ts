import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getPosts(
  teacherId: string,
  filters?: { status?: string; category?: string },
) {
  const db = getDb();
  const conditions = [eq(posts.teacherId, teacherId)];

  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(posts.status, filters.status as "draft" | "published"));
  }
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
    .orderBy(desc(posts.createdAt));
}

export async function getPost(id: string, teacherId: string) {
  const db = getDb();
  return db.query.posts.findFirst({
    where: (p, { eq: e, and: a }) =>
      a(e(p.id, id), e(p.teacherId, teacherId)),
  });
}

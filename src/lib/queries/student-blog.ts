import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getPublishedPosts(
  teacherId: string,
  filters?: { category?: string },
) {
  const db = getDb();
  const conditions = [
    eq(posts.teacherId, teacherId),
    eq(posts.status, "published"),
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
    .orderBy(desc(posts.createdAt));
}

export async function getPublishedPost(slug: string, teacherId: string) {
  const db = getDb();

  return db.query.posts.findFirst({
    where: (p, { eq: e, and: a }) =>
      a(e(p.slug, slug), e(p.teacherId, teacherId), e(p.status, "published")),
  });
}

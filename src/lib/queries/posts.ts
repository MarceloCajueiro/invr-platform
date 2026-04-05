import { getDb } from "@/lib/db";
import { posts, turmaPosts, turmas } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function getPosts(
  teacherId: string,
  filters?: { status?: string; category?: string; turmaId?: string },
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

  if (filters?.turmaId && filters.turmaId !== "all") {
    const linkedPostIds = await db
      .select({ postId: turmaPosts.postId })
      .from(turmaPosts)
      .where(eq(turmaPosts.turmaId, filters.turmaId));

    const ids = linkedPostIds.map((r) => r.postId);
    if (ids.length === 0) return [];
    conditions.push(inArray(posts.id, ids));
  }

  const postRows = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt));

  if (postRows.length === 0) return [];

  const postIds = postRows.map((p) => p.id);
  const turmaLinks = await db
    .select({
      postId: turmaPosts.postId,
      turmaId: turmas.id,
      turmaName: turmas.name,
      turmaColor: turmas.color,
    })
    .from(turmaPosts)
    .innerJoin(turmas, eq(turmaPosts.turmaId, turmas.id))
    .where(inArray(turmaPosts.postId, postIds));

  const turmaMap = new Map<string, { id: string; name: string; color: string | null }[]>();
  for (const link of turmaLinks) {
    const arr = turmaMap.get(link.postId) ?? [];
    arr.push({ id: link.turmaId, name: link.turmaName, color: link.turmaColor });
    turmaMap.set(link.postId, arr);
  }

  return postRows.map((post) => ({
    ...post,
    turmas: turmaMap.get(post.id) ?? [],
  }));
}

export async function getPost(id: string, teacherId: string) {
  const db = getDb();
  return db.query.posts.findFirst({
    where: (p, { eq: e, and: a }) =>
      a(e(p.id, id), e(p.teacherId, teacherId)),
  });
}

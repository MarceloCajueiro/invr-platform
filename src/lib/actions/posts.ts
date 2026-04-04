"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getDb } from "@/lib/db";
import { posts, turmaPosts } from "@/lib/db/schema";
import { createPostSchema, updatePostSchema } from "@/lib/validations/posts";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractSingleUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0].url ?? null;
    }
    return null;
  } catch {
    return value || null;
  }
}

function parseTurmaIds(formData: FormData): string[] {
  const raw = formData.get("turmaIds") as string | null;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id: unknown) => typeof id === "string" && id.length > 0) : [];
  } catch {
    return [];
  }
}

export async function createPost(formData: FormData) {
  const { teacher } = await getTeacher();

  const title = formData.get("title") as string;
  const slugRaw = formData.get("slug") as string;
  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title,
    slug: slugRaw || generateSlug(title || ""),
    content: formData.get("content") || undefined,
    coverImageUrl: coverImageUrl ?? undefined,
    category: formData.get("category"),
    featured: formData.get("featured") === "on",
  };

  const parsed = createPostSchema.parse(raw);

  const db = getDb();
  const [inserted] = await db.insert(posts).values({
    teacherId: teacher.id,
    title: parsed.title,
    slug: parsed.slug,
    content: parsed.content || null,
    coverImageUrl: parsed.coverImageUrl || null,
    category: parsed.category,
    featured: parsed.featured ?? false,
    status: "draft",
  }).returning({ id: posts.id });

  const turmaIds = parseTurmaIds(formData);
  if (turmaIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.batch(turmaIds.map((turmaId) =>
      db.insert(turmaPosts).values({ turmaId, postId: inserted.id }),
    ) as any);
  }

  revalidatePath("/teacher/posts");
  redirect("/teacher/posts");
}

export async function updatePost(id: string, formData: FormData) {
  const { teacher } = await getTeacher();

  const title = formData.get("title") as string;
  const slugRaw = formData.get("slug") as string;
  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title,
    slug: slugRaw || generateSlug(title || ""),
    content: formData.get("content") || undefined,
    coverImageUrl: coverImageUrl ?? undefined,
    category: formData.get("category"),
    featured: formData.get("featured") === "on",
  };

  const parsed = updatePostSchema.parse(raw);

  const db = getDb();
  await db
    .update(posts)
    .set({
      ...parsed,
      content: parsed.content || null,
      coverImageUrl: parsed.coverImageUrl || null,
      featured: parsed.featured ?? false,
      updatedAt: new Date(),
    })
    .where(and(eq(posts.id, id), eq(posts.teacherId, teacher.id)));

  // Sync turma links
  const turmaIds = parseTurmaIds(formData);
  await db.delete(turmaPosts).where(eq(turmaPosts.postId, id));
  if (turmaIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.batch(turmaIds.map((turmaId) =>
      db.insert(turmaPosts).values({ turmaId, postId: id }),
    ) as any);
  }

  revalidatePath("/teacher/posts");
  redirect("/teacher/posts");
}

export async function deletePost(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID do post é obrigatório");

  const db = getDb();
  await db
    .delete(posts)
    .where(and(eq(posts.id, id), eq(posts.teacherId, teacher.id)));

  revalidatePath("/teacher/posts");
}

export async function togglePostStatus(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID do post é obrigatório");

  const db = getDb();
  await db
    .update(posts)
    .set({
      status: sql`CASE WHEN ${posts.status} = 'draft' THEN 'published' ELSE 'draft' END`,
      updatedAt: new Date(),
    })
    .where(and(eq(posts.id, id), eq(posts.teacherId, teacher.id)));

  revalidatePath("/teacher/posts");
}

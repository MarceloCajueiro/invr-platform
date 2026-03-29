"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getDb } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { createPostSchema, updatePostSchema } from "@/lib/validations/posts";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createPost(formData: FormData) {
  const { teacher } = await getTeacher();

  const title = formData.get("title") as string;
  const slugRaw = formData.get("slug") as string;

  const raw = {
    title,
    slug: slugRaw || generateSlug(title || ""),
    content: formData.get("content"),
    category: formData.get("category"),
    featured: formData.get("featured") === "on",
  };

  const parsed = createPostSchema.parse(raw);

  const db = getDb();
  await db.insert(posts).values({
    teacherId: teacher.id,
    title: parsed.title,
    slug: parsed.slug,
    content: parsed.content || null,
    category: parsed.category,
    featured: parsed.featured ?? false,
    status: "draft",
  });

  revalidatePath("/posts");
  redirect("/posts");
}

export async function updatePost(id: string, formData: FormData) {
  const { teacher } = await getTeacher();

  const title = formData.get("title") as string;
  const slugRaw = formData.get("slug") as string;

  const raw = {
    title,
    slug: slugRaw || generateSlug(title || ""),
    content: formData.get("content"),
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
      featured: parsed.featured ?? false,
      updatedAt: new Date(),
    })
    .where(and(eq(posts.id, id), eq(posts.teacherId, teacher.id)));

  revalidatePath("/posts");
  redirect("/posts");
}

export async function deletePost(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID do post é obrigatório");

  const db = getDb();
  await db
    .delete(posts)
    .where(and(eq(posts.id, id), eq(posts.teacherId, teacher.id)));

  revalidatePath("/posts");
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

  revalidatePath("/posts");
}

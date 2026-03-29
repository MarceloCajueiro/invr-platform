import { createAuth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getTeacher() {
  const auth = await createAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "teacher") redirect("/sign-in");

  const db = getDb();
  const teacher = await db.query.teachers.findFirst({
    where: (t, { eq }) => eq(t.userId, session.user.id),
  });
  if (!teacher) redirect("/sign-in");

  return { user: session.user, teacher };
}

import { createAuth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getStudent() {
  const auth = await createAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "student") redirect("/sign-in");

  const db = getDb();
  const student = await db.query.students.findFirst({
    where: (s, { eq }) => eq(s.userId, session.user.id),
  });
  if (!student) redirect("/sign-in");

  return { user: session.user, student };
}

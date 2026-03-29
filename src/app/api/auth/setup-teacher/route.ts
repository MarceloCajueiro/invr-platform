import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createAuth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const auth = await createAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  const existing = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.userId, session.user.id))
    .get();

  if (!existing) {
    await db.insert(teachers).values({
      userId: session.user.id,
      plan: "free",
    });
  }

  return NextResponse.json({ ok: true });
}

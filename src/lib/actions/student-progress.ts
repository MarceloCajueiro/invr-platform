"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getStudent } from "@/lib/auth/get-student";
import { getDb } from "@/lib/db";
import { lessonProgresses } from "@/lib/db/schema";

export async function updateLessonProgress(lessonId: string, progress: number) {
  const { student } = await getStudent();
  const db = getDb();

  const existing = await db.query.lessonProgresses.findFirst({
    where: (lp, { eq: e, and: a }) =>
      a(e(lp.studentId, student.id), e(lp.lessonId, lessonId)),
  });

  const watchedAt = progress >= 90 ? new Date() : null;

  if (existing) {
    await db
      .update(lessonProgresses)
      .set({
        progress,
        watchedAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(lessonProgresses.studentId, student.id),
          eq(lessonProgresses.lessonId, lessonId),
        ),
      );
  } else {
    await db.insert(lessonProgresses).values({
      studentId: student.id,
      lessonId,
      progress,
      watchedAt,
    });
  }

  revalidatePath("/lessons");
  revalidatePath(`/lessons/${lessonId}`);
}

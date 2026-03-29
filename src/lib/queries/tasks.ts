import { getDb } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getTasks(
  teacherId: string,
  filters?: { taskType?: string; status?: string },
) {
  const db = getDb();
  const conditions = [eq(tasks.teacherId, teacherId)];

  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(tasks.status, filters.status as "draft" | "published"));
  }
  if (filters?.taskType && filters.taskType !== "all") {
    conditions.push(
      eq(
        tasks.taskType,
        filters.taskType as "quiz" | "listening" | "fill_gaps" | "writing",
      ),
    );
  }

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));
}

export async function getTask(id: string, teacherId: string) {
  const db = getDb();
  return db.query.tasks.findFirst({
    where: (t, { eq: e, and: a }) =>
      a(e(t.id, id), e(t.teacherId, teacherId)),
  });
}

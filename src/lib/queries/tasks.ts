import { getDb } from "@/lib/db";
import { tasks, turmaTasks, turmas } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function getTasks(
  teacherId: string,
  filters?: { taskType?: string; status?: string; turmaId?: string },
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

  if (filters?.turmaId && filters.turmaId !== "all") {
    const linkedTaskIds = await db
      .select({ taskId: turmaTasks.taskId })
      .from(turmaTasks)
      .where(eq(turmaTasks.turmaId, filters.turmaId));

    const ids = linkedTaskIds.map((r) => r.taskId);
    if (ids.length === 0) return [];
    conditions.push(inArray(tasks.id, ids));
  }

  const taskRows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));

  if (taskRows.length === 0) return [];

  const taskIds = taskRows.map((t) => t.id);
  const turmaLinks = await db
    .select({
      taskId: turmaTasks.taskId,
      turmaId: turmas.id,
      turmaName: turmas.name,
      turmaColor: turmas.color,
    })
    .from(turmaTasks)
    .innerJoin(turmas, eq(turmaTasks.turmaId, turmas.id))
    .where(inArray(turmaTasks.taskId, taskIds));

  const turmaMap = new Map<string, { id: string; name: string; color: string | null }[]>();
  for (const link of turmaLinks) {
    const arr = turmaMap.get(link.taskId) ?? [];
    arr.push({ id: link.turmaId, name: link.turmaName, color: link.turmaColor });
    turmaMap.set(link.taskId, arr);
  }

  return taskRows.map((task) => ({
    ...task,
    turmas: turmaMap.get(task.id) ?? [],
  }));
}

export async function getTask(id: string, teacherId: string) {
  const db = getDb();
  return db.query.tasks.findFirst({
    where: (t, { eq: e, and: a }) =>
      a(e(t.id, id), e(t.teacherId, teacherId)),
  });
}

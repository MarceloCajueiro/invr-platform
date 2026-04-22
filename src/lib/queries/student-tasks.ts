import { getDb } from "@/lib/db";
import { tasks, submissions, turmaTasks, turmaStudents } from "@/lib/db/schema";
import { eq, and, inArray, lte } from "drizzle-orm";

export async function getStudentTasks(teacherId: string, studentId: string) {
  const db = getDb();

  // Get turma IDs the student belongs to
  const studentTurmas = await db
    .select({ turmaId: turmaStudents.turmaId })
    .from(turmaStudents)
    .where(eq(turmaStudents.studentId, studentId));

  const turmaIds = studentTurmas.map((t) => t.turmaId);
  if (turmaIds.length === 0) return [];

  // Get task IDs linked to those turmas
  const linkedTasks = await db
    .select({ taskId: turmaTasks.taskId })
    .from(turmaTasks)
    .where(inArray(turmaTasks.turmaId, turmaIds));

  const taskIds = [...new Set(linkedTasks.map((t) => t.taskId))];
  if (taskIds.length === 0) return [];

  // Get published tasks filtered by turma membership
  const publishedTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.teacherId, teacherId),
        eq(tasks.status, "published"),
        inArray(tasks.id, taskIds),
        lte(tasks.publishedAt, new Date()),
      ),
    );

  if (publishedTasks.length === 0) return [];

  // Get all submissions for this student
  const studentSubmissions = await db
    .select({
      taskId: submissions.taskId,
      score: submissions.score,
      status: submissions.status,
    })
    .from(submissions)
    .where(eq(submissions.studentId, studentId));

  const submissionMap = new Map(
    studentSubmissions.map((s) => [s.taskId, { score: s.score, status: s.status }]),
  );

  // Merge tasks with submission status
  return publishedTasks.map((task) => ({
    ...task,
    submission: submissionMap.get(task.id) ?? undefined,
  }));
}

export async function getStudentTask(taskId: string, teacherId: string) {
  const db = getDb();

  return db.query.tasks.findFirst({
    where: (t, { eq: e, and: a, lte }) =>
      a(e(t.id, taskId), e(t.teacherId, teacherId), e(t.status, "published"), lte(t.publishedAt, new Date())),
  });
}

export async function getSubmission(studentId: string, taskId: string) {
  const db = getDb();

  return db.query.submissions.findFirst({
    where: (s, { eq: e, and: a }) =>
      a(e(s.studentId, studentId), e(s.taskId, taskId)),
  });
}

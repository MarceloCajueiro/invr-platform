import { getDb } from "@/lib/db";
import { tasks, submissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getStudentTasks(teacherId: string, studentId: string) {
  const db = getDb();

  // Get all published tasks from the teacher
  const publishedTasks = await db
    .select()
    .from(tasks)
    .where(
      and(eq(tasks.teacherId, teacherId), eq(tasks.status, "published")),
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
    where: (t, { eq: e, and: a }) =>
      a(e(t.id, taskId), e(t.teacherId, teacherId), e(t.status, "published")),
  });
}

export async function getSubmission(studentId: string, taskId: string) {
  const db = getDb();

  return db.query.submissions.findFirst({
    where: (s, { eq: e, and: a }) =>
      a(e(s.studentId, studentId), e(s.taskId, taskId)),
  });
}

import { getDb } from "@/lib/db";
import { students, lessons, tasks, submissions, user } from "@/lib/db/schema";
import { eq, and, count, inArray, desc } from "drizzle-orm";

export async function getDashboardKPIs(teacherId: string) {
  const db = getDb();

  const [studentCount] = await db
    .select({ count: count() })
    .from(students)
    .where(eq(students.teacherId, teacherId));

  const [lessonCount] = await db
    .select({ count: count() })
    .from(lessons)
    .where(and(eq(lessons.teacherId, teacherId), eq(lessons.status, "published")));

  const [taskCount] = await db
    .select({ count: count() })
    .from(tasks)
    .where(and(eq(tasks.teacherId, teacherId), eq(tasks.status, "published")));

  // Pending submissions: get task IDs for this teacher, then count submissions with status "submitted"
  const teacherTasks = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.teacherId, teacherId));
  const taskIds = teacherTasks.map((t) => t.id);

  let pendingCount = 0;
  if (taskIds.length > 0) {
    const [pending] = await db
      .select({ count: count() })
      .from(submissions)
      .where(
        and(
          inArray(submissions.taskId, taskIds),
          eq(submissions.status, "submitted"),
        ),
      );
    pendingCount = pending.count;
  }

  return {
    students: studentCount.count,
    lessons: lessonCount.count,
    tasks: taskCount.count,
    pendingSubmissions: pendingCount,
  };
}

export interface RecentSubmission {
  id: string;
  studentName: string;
  taskTitle: string;
  score: number | null;
  status: "in_progress" | "submitted" | "graded";
  gradedBy: "auto" | "ai" | "teacher" | null;
  createdAt: Date | null;
}

export async function getRecentSubmissions(
  teacherId: string,
  limit = 5,
): Promise<RecentSubmission[]> {
  const db = getDb();

  // Get tasks by this teacher
  const teacherTasks = await db
    .select({ id: tasks.id, title: tasks.title })
    .from(tasks)
    .where(eq(tasks.teacherId, teacherId));

  if (teacherTasks.length === 0) return [];

  const taskMap = new Map(teacherTasks.map((t) => [t.id, t.title]));
  const taskIds = teacherTasks.map((t) => t.id);

  const recentSubs = await db
    .select()
    .from(submissions)
    .where(inArray(submissions.taskId, taskIds))
    .orderBy(desc(submissions.createdAt))
    .limit(limit);

  if (recentSubs.length === 0) return [];

  // Get student names via students -> user join
  const studentIds = [...new Set(recentSubs.map((s) => s.studentId))];
  const studentRows =
    studentIds.length > 0
      ? await db
          .select({ id: students.id, userId: students.userId })
          .from(students)
          .where(inArray(students.id, studentIds))
      : [];

  const userIds = studentRows.map((s) => s.userId);
  const userRows =
    userIds.length > 0
      ? await db
          .select({ id: user.id, name: user.name })
          .from(user)
          .where(inArray(user.id, userIds))
      : [];

  const userNameMap = new Map(userRows.map((u) => [u.id, u.name]));
  const studentNameMap = new Map<string, string>();
  for (const sr of studentRows) {
    studentNameMap.set(sr.id, userNameMap.get(sr.userId) || "Aluno");
  }

  return recentSubs.map((s) => ({
    id: s.id,
    studentName: studentNameMap.get(s.studentId) || "Aluno",
    taskTitle: taskMap.get(s.taskId) || "Tarefa",
    score: s.score,
    status: s.status,
    gradedBy: s.gradedBy,
    createdAt: s.createdAt,
  }));
}

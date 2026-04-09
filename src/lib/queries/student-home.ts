import { getDb } from "@/lib/db";
import {
  lessons,
  tasks,
  submissions,
  lessonProgresses,
  challenges,
  challengeResponses,
} from "@/lib/db/schema";
import { eq, and, count, inArray, desc, or } from "drizzle-orm";

export async function getHomeStats(studentId: string, teacherId: string) {
  const db = getDb();

  const [totalLessons] = await db
    .select({ count: count() })
    .from(lessons)
    .where(
      and(eq(lessons.teacherId, teacherId), eq(lessons.status, "published")),
    );

  const [watchedLessons] = await db
    .select({ count: count() })
    .from(lessonProgresses)
    .where(eq(lessonProgresses.studentId, studentId));

  const [totalTasks] = await db
    .select({ count: count() })
    .from(tasks)
    .where(
      and(eq(tasks.teacherId, teacherId), eq(tasks.status, "published")),
    );

  const [completedTasks] = await db
    .select({ count: count() })
    .from(submissions)
    .where(
      and(
        eq(submissions.studentId, studentId),
        or(
          eq(submissions.status, "graded"),
          eq(submissions.status, "submitted"),
        ),
      ),
    );

  const [totalChallenges] = await db
    .select({ count: count() })
    .from(challenges)
    .where(
      and(eq(challenges.teacherId, teacherId), eq(challenges.status, "published")),
    );

  const [respondedChallenges] = await db
    .select({ count: count() })
    .from(challengeResponses)
    .where(eq(challengeResponses.studentId, studentId));

  return {
    totalLessons: totalLessons.count,
    watchedLessons: watchedLessons.count,
    totalTasks: totalTasks.count,
    completedTasks: completedTasks.count,
    totalChallenges: totalChallenges.count,
    respondedChallenges: respondedChallenges.count,
  };
}

export interface RecentActivityItem {
  id: string;
  type: "submission" | "lesson_progress";
  title: string;
  date: Date | null;
}

export async function getRecentActivity(
  studentId: string,
  limit = 5,
): Promise<RecentActivityItem[]> {
  const db = getDb();

  // Get recent submissions
  const recentSubmissions = await db
    .select({
      id: submissions.id,
      taskId: submissions.taskId,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .where(eq(submissions.studentId, studentId))
    .orderBy(desc(submissions.createdAt))
    .limit(limit);

  // Get task titles for submissions
  const taskIds = recentSubmissions.map((s) => s.taskId);
  const taskRows =
    taskIds.length > 0
      ? await db
          .select({ id: tasks.id, title: tasks.title })
          .from(tasks)
          .where(inArray(tasks.id, taskIds))
      : [];
  const taskMap = new Map(taskRows.map((t) => [t.id, t.title]));

  // Get recent lesson progresses
  const recentProgresses = await db
    .select({
      id: lessonProgresses.id,
      lessonId: lessonProgresses.lessonId,
      watchedAt: lessonProgresses.watchedAt,
      updatedAt: lessonProgresses.updatedAt,
    })
    .from(lessonProgresses)
    .where(eq(lessonProgresses.studentId, studentId))
    .orderBy(desc(lessonProgresses.updatedAt))
    .limit(limit);

  // Get lesson titles for progresses
  const lessonIds = recentProgresses.map((p) => p.lessonId);
  const lessonRows =
    lessonIds.length > 0
      ? await db
          .select({ id: lessons.id, title: lessons.title })
          .from(lessons)
          .where(inArray(lessons.id, lessonIds))
      : [];
  const lessonMap = new Map(lessonRows.map((l) => [l.id, l.title]));

  // Merge and sort
  const activity: RecentActivityItem[] = [
    ...recentSubmissions.map((s) => ({
      id: s.id,
      type: "submission" as const,
      title: taskMap.get(s.taskId) || "Tarefa",
      date: s.createdAt,
    })),
    ...recentProgresses.map((p) => ({
      id: p.id,
      type: "lesson_progress" as const,
      title: lessonMap.get(p.lessonId) || "Aula",
      date: p.watchedAt ?? p.updatedAt,
    })),
  ];

  activity.sort((a, b) => {
    const dateA = a.date?.getTime() ?? 0;
    const dateB = b.date?.getTime() ?? 0;
    return dateB - dateA;
  });

  return activity.slice(0, limit);
}

import { getDb } from "@/lib/db";
import {
  students,
  user,
  submissions,
  tasks,
  lessonProgresses,
  lessons,
  turmaStudents,
  turmas,
} from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export interface StudentListItem {
  id: string;
  name: string;
  email: string;
  xp: number;
  currentStreak: number;
  lastActivityAt: Date | null;
}

export async function getStudents(
  teacherId: string,
): Promise<StudentListItem[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: students.id,
      name: user.name,
      email: user.email,
      xp: students.xp,
      currentStreak: students.currentStreak,
      lastActivityAt: students.lastActivityAt,
    })
    .from(students)
    .innerJoin(user, eq(students.userId, user.id))
    .where(eq(students.teacherId, teacherId))
    .orderBy(desc(students.createdAt));

  return rows;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: Date | null;
  createdAt: Date;
}

export async function getStudentProfile(
  studentId: string,
  teacherId: string,
): Promise<StudentProfile | null> {
  const db = getDb();

  const rows = await db
    .select({
      id: students.id,
      name: user.name,
      email: user.email,
      image: user.image,
      xp: students.xp,
      currentStreak: students.currentStreak,
      longestStreak: students.longestStreak,
      lastActivityAt: students.lastActivityAt,
      createdAt: students.createdAt,
    })
    .from(students)
    .innerJoin(user, eq(students.userId, user.id))
    .where(and(eq(students.id, studentId), eq(students.teacherId, teacherId)));

  return rows[0] ?? null;
}

export interface StudentSubmission {
  id: string;
  taskTitle: string;
  score: number | null;
  status: "in_progress" | "submitted" | "graded";
  gradedBy: "auto" | "ai" | "teacher" | null;
  createdAt: Date;
}

export async function getStudentSubmissions(
  studentId: string,
  limit = 10,
): Promise<StudentSubmission[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: submissions.id,
      taskTitle: tasks.title,
      score: submissions.score,
      status: submissions.status,
      gradedBy: submissions.gradedBy,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .innerJoin(tasks, eq(submissions.taskId, tasks.id))
    .where(eq(submissions.studentId, studentId))
    .orderBy(desc(submissions.createdAt))
    .limit(limit);

  return rows;
}

export interface StudentLessonProgress {
  id: string;
  lessonTitle: string;
  progress: number;
  watchedAt: Date | null;
}

export async function getStudentProgress(
  studentId: string,
): Promise<StudentLessonProgress[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: lessonProgresses.id,
      lessonTitle: lessons.title,
      progress: lessonProgresses.progress,
      watchedAt: lessonProgresses.watchedAt,
    })
    .from(lessonProgresses)
    .innerJoin(lessons, eq(lessonProgresses.lessonId, lessons.id))
    .where(eq(lessonProgresses.studentId, studentId))
    .orderBy(desc(lessonProgresses.updatedAt));

  return rows;
}

export interface StudentTurma {
  id: string;
  name: string;
  level: string | null;
  color: string | null;
}

export async function getStudentTurmas(
  studentId: string,
): Promise<StudentTurma[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: turmas.id,
      name: turmas.name,
      level: turmas.level,
      color: turmas.color,
    })
    .from(turmaStudents)
    .innerJoin(turmas, eq(turmaStudents.turmaId, turmas.id))
    .where(eq(turmaStudents.studentId, studentId));

  return rows;
}

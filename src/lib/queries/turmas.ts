import { getDb } from "@/lib/db";
import {
  turmas,
  turmaStudents,
  turmaLessons,
  turmaTasks,
  turmaPosts,
  turmaChallenges,
  students,
  user,
  lessons,
  tasks,
  invitations,
} from "@/lib/db/schema";
import { eq, and, desc, count, notInArray, inArray, isNull, gt } from "drizzle-orm";

export async function getTurmas(teacherId: string) {
  const db = getDb();

  const turmaList = await db
    .select()
    .from(turmas)
    .where(eq(turmas.teacherId, teacherId))
    .orderBy(desc(turmas.createdAt));

  const turmaIds = turmaList.map((t) => t.id);

  if (turmaIds.length === 0) return [];

  const studentCounts = await db
    .select({
      turmaId: turmaStudents.turmaId,
      count: count(),
    })
    .from(turmaStudents)
    .where(inArray(turmaStudents.turmaId, turmaIds))
    .groupBy(turmaStudents.turmaId);

  const countMap = new Map(studentCounts.map((sc) => [sc.turmaId, sc.count]));

  return turmaList.map((t) => ({
    ...t,
    studentCount: countMap.get(t.id) ?? 0,
  }));
}

export async function getTurma(id: string, teacherId: string) {
  const db = getDb();
  return db.query.turmas.findFirst({
    where: (t, { eq: e, and: a }) =>
      a(e(t.id, id), e(t.teacherId, teacherId)),
  });
}

export async function getTurmaMembers(turmaId: string) {
  const db = getDb();

  return db
    .select({
      studentId: students.id,
      studentUserId: students.userId,


      joinedAt: turmaStudents.createdAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(turmaStudents)
    .innerJoin(students, eq(turmaStudents.studentId, students.id))
    .innerJoin(user, eq(students.userId, user.id))
    .where(eq(turmaStudents.turmaId, turmaId))
    .orderBy(desc(turmaStudents.createdAt));
}

export async function getTurmaLessons(turmaId: string, teacherId: string) {
  const db = getDb();

  return db
    .select({
      id: lessons.id,
      title: lessons.title,
      category: lessons.category,
      status: lessons.status,
      linkedAt: turmaLessons.createdAt,
    })
    .from(turmaLessons)
    .innerJoin(lessons, eq(turmaLessons.lessonId, lessons.id))
    .where(
      and(
        eq(turmaLessons.turmaId, turmaId),
        eq(lessons.teacherId, teacherId),
      ),
    )
    .orderBy(desc(turmaLessons.createdAt));
}

export async function getTurmaTasks(turmaId: string, teacherId: string) {
  const db = getDb();

  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      taskType: tasks.taskType,
      level: tasks.level,
      status: tasks.status,
      linkedAt: turmaTasks.createdAt,
    })
    .from(turmaTasks)
    .innerJoin(tasks, eq(turmaTasks.taskId, tasks.id))
    .where(
      and(eq(turmaTasks.turmaId, turmaId), eq(tasks.teacherId, teacherId)),
    )
    .orderBy(desc(turmaTasks.createdAt));
}

export async function getAvailableLessons(
  teacherId: string,
  turmaId: string,
) {
  const db = getDb();

  const linkedLessonIds = await db
    .select({ lessonId: turmaLessons.lessonId })
    .from(turmaLessons)
    .where(eq(turmaLessons.turmaId, turmaId));

  const excludeIds = linkedLessonIds.map((l) => l.lessonId);

  const conditions = [
    eq(lessons.teacherId, teacherId),
    eq(lessons.status, "published"),
  ];

  if (excludeIds.length > 0) {
    conditions.push(notInArray(lessons.id, excludeIds));
  }

  return db
    .select({ id: lessons.id, title: lessons.title })
    .from(lessons)
    .where(and(...conditions))
    .orderBy(desc(lessons.createdAt));
}

export async function getAvailableTasks(teacherId: string, turmaId: string) {
  const db = getDb();

  const linkedTaskIds = await db
    .select({ taskId: turmaTasks.taskId })
    .from(turmaTasks)
    .where(eq(turmaTasks.turmaId, turmaId));

  const excludeIds = linkedTaskIds.map((t) => t.taskId);

  const conditions = [
    eq(tasks.teacherId, teacherId),
    eq(tasks.status, "published"),
  ];

  if (excludeIds.length > 0) {
    conditions.push(notInArray(tasks.id, excludeIds));
  }

  return db
    .select({ id: tasks.id, title: tasks.title })
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));
}

export async function getTurmasForSelector(teacherId: string) {
  const db = getDb();
  return db
    .select({ id: turmas.id, name: turmas.name, color: turmas.color })
    .from(turmas)
    .where(eq(turmas.teacherId, teacherId))
    .orderBy(desc(turmas.createdAt));
}

export async function getLessonTurmaIds(lessonId: string) {
  const db = getDb();
  const rows = await db
    .select({ turmaId: turmaLessons.turmaId })
    .from(turmaLessons)
    .where(eq(turmaLessons.lessonId, lessonId));
  return rows.map((r) => r.turmaId);
}

export async function getTaskTurmaIds(taskId: string) {
  const db = getDb();
  const rows = await db
    .select({ turmaId: turmaTasks.turmaId })
    .from(turmaTasks)
    .where(eq(turmaTasks.taskId, taskId));
  return rows.map((r) => r.turmaId);
}

export async function getPostTurmaIds(postId: string) {
  const db = getDb();
  const rows = await db
    .select({ turmaId: turmaPosts.turmaId })
    .from(turmaPosts)
    .where(eq(turmaPosts.postId, postId));
  return rows.map((r) => r.turmaId);
}

export async function getChallengeTurmaIds(challengeId: string) {
  const db = getDb();
  const rows = await db
    .select({ turmaId: turmaChallenges.turmaId })
    .from(turmaChallenges)
    .where(eq(turmaChallenges.challengeId, challengeId));
  return rows.map((r) => r.turmaId);
}

export async function getPendingInvites(turmaId: string) {
  const db = getDb();
  const now = new Date();

  return db
    .select({
      id: invitations.id,
      email: invitations.email,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.turmaId, turmaId),
        isNull(invitations.acceptedAt),
        gt(invitations.expiresAt, now),
      ),
    )
    .orderBy(desc(invitations.createdAt));
}

export async function getAvailableStudentsForTurma(
  turmaId: string,
  teacherId: string,
) {
  const db = getDb();

  const inTurma = await db
    .select({ studentId: turmaStudents.studentId })
    .from(turmaStudents)
    .where(eq(turmaStudents.turmaId, turmaId));

  const inTurmaIds = inTurma.map((r) => r.studentId);

  const conditions = [eq(students.teacherId, teacherId)];
  if (inTurmaIds.length > 0) {
    conditions.push(notInArray(students.id, inTurmaIds));
  }

  return db
    .select({
      id: students.id,
      name: user.name,
      email: user.email,
    })
    .from(students)
    .innerJoin(user, eq(students.userId, user.id))
    .where(and(...conditions))
    .orderBy(user.name);
}

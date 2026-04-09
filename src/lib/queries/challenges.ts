import { getDb } from "@/lib/db";
import {
  challenges,
  challengeResponses,
  turmaChallenges,
  turmas,
  students,
  user,
} from "@/lib/db/schema";
import { eq, and, desc, inArray, count } from "drizzle-orm";

export async function getChallenges(teacherId: string) {
  const db = getDb();

  const challengeRows = await db
    .select()
    .from(challenges)
    .where(eq(challenges.teacherId, teacherId))
    .orderBy(desc(challenges.createdAt));

  if (challengeRows.length === 0) return [];

  const challengeIds = challengeRows.map((c) => c.id);

  // Get turma links
  const turmaLinks = await db
    .select({
      challengeId: turmaChallenges.challengeId,
      turmaId: turmas.id,
      turmaName: turmas.name,
      turmaColor: turmas.color,
    })
    .from(turmaChallenges)
    .innerJoin(turmas, eq(turmaChallenges.turmaId, turmas.id))
    .where(inArray(turmaChallenges.challengeId, challengeIds));

  const turmaMap = new Map<string, { id: string; name: string; color: string | null }[]>();
  for (const link of turmaLinks) {
    const arr = turmaMap.get(link.challengeId) ?? [];
    arr.push({ id: link.turmaId, name: link.turmaName, color: link.turmaColor });
    turmaMap.set(link.challengeId, arr);
  }

  // Get response counts
  const responseCounts = await db
    .select({
      challengeId: challengeResponses.challengeId,
      count: count(),
    })
    .from(challengeResponses)
    .where(inArray(challengeResponses.challengeId, challengeIds))
    .groupBy(challengeResponses.challengeId);

  const responseCountMap = new Map(responseCounts.map((r) => [r.challengeId, r.count]));

  return challengeRows.map((challenge) => ({
    ...challenge,
    turmas: turmaMap.get(challenge.id) ?? [],
    responseCount: responseCountMap.get(challenge.id) ?? 0,
  }));
}

export async function getChallenge(id: string, teacherId: string) {
  const db = getDb();
  return db.query.challenges.findFirst({
    where: (c, { eq: e, and: a }) =>
      a(e(c.id, id), e(c.teacherId, teacherId)),
  });
}

export async function getChallengeResponses(challengeId: string, teacherId: string) {
  const db = getDb();

  // Verify challenge belongs to teacher
  const challenge = await db.query.challenges.findFirst({
    where: (c, { eq: e, and: a }) =>
      a(e(c.id, challengeId), e(c.teacherId, teacherId)),
  });

  if (!challenge) return [];

  const responses = await db
    .select()
    .from(challengeResponses)
    .where(eq(challengeResponses.challengeId, challengeId))
    .orderBy(desc(challengeResponses.createdAt));

  if (responses.length === 0) return [];

  // Get student names
  const studentIds = [...new Set(responses.map((r) => r.studentId))];
  const studentRows = await db
    .select({ id: students.id, userId: students.userId })
    .from(students)
    .where(inArray(students.id, studentIds));

  const userIds = studentRows.map((s) => s.userId);
  const userRows = userIds.length > 0
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

  return responses.map((r) => ({
    ...r,
    studentName: studentNameMap.get(r.studentId) || "Aluno",
  }));
}

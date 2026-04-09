import { getDb } from "@/lib/db";
import {
  challenges,
  challengeResponses,
  turmaChallenges,
  turmaStudents,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function getStudentChallenges(teacherId: string, studentId: string) {
  const db = getDb();

  // Get turma IDs the student belongs to
  const studentTurmas = await db
    .select({ turmaId: turmaStudents.turmaId })
    .from(turmaStudents)
    .where(eq(turmaStudents.studentId, studentId));

  const turmaIds = studentTurmas.map((t) => t.turmaId);
  if (turmaIds.length === 0) return [];

  // Get challenge IDs linked to those turmas
  const linkedChallenges = await db
    .select({ challengeId: turmaChallenges.challengeId })
    .from(turmaChallenges)
    .where(inArray(turmaChallenges.turmaId, turmaIds));

  const challengeIds = [...new Set(linkedChallenges.map((c) => c.challengeId))];
  if (challengeIds.length === 0) return [];

  // Get published challenges
  const publishedChallenges = await db
    .select()
    .from(challenges)
    .where(
      and(
        eq(challenges.teacherId, teacherId),
        eq(challenges.status, "published"),
        inArray(challenges.id, challengeIds),
      ),
    );

  if (publishedChallenges.length === 0) return [];

  // Get student's responses
  const responses = await db
    .select({
      challengeId: challengeResponses.challengeId,
      id: challengeResponses.id,
    })
    .from(challengeResponses)
    .where(eq(challengeResponses.studentId, studentId));

  const responseMap = new Map(responses.map((r) => [r.challengeId, r.id]));

  return publishedChallenges.map((challenge) => ({
    ...challenge,
    responded: responseMap.has(challenge.id),
  }));
}

export async function getStudentChallenge(challengeId: string, teacherId: string) {
  const db = getDb();

  return db.query.challenges.findFirst({
    where: (c, { eq: e, and: a }) =>
      a(e(c.id, challengeId), e(c.teacherId, teacherId), e(c.status, "published")),
  });
}

export async function getChallengeResponse(studentId: string, challengeId: string) {
  const db = getDb();

  return db.query.challengeResponses.findFirst({
    where: (r, { eq: e, and: a }) =>
      a(e(r.studentId, studentId), e(r.challengeId, challengeId)),
  });
}

import { getDb } from "@/lib/db";
import { students, teachers, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getStudentProfile(studentId: string) {
  const db = getDb();

  const [result] = await db
    .select({
      teacherName: user.name,
    })
    .from(students)
    .innerJoin(teachers, eq(students.teacherId, teachers.id))
    .innerJoin(user, eq(teachers.userId, user.id))
    .where(eq(students.id, studentId))
    .limit(1);

  return {
    teacherName: result?.teacherName ?? "Professor",
  };
}

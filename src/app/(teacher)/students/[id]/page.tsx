import { notFound } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import {
  getStudentProfile,
  getStudentSubmissions,
  getStudentProgress,
  getStudentTurmas,
} from "@/lib/queries/students";
import { StudentProfile } from "@/components/teacher/student-profile";

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;

  const student = await getStudentProfile(id, teacher.id);
  if (!student) notFound();

  const [submissions, progress, turmas] = await Promise.all([
    getStudentSubmissions(id),
    getStudentProgress(id),
    getStudentTurmas(id),
  ]);

  return (
    <div className="animate-fade-in">
      <StudentProfile
        student={student}
        submissions={submissions}
        progress={progress}
        turmas={turmas}
      />
    </div>
  );
}

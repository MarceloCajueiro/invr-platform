import { getTeacher } from "@/lib/auth/get-teacher";
import { getStudents } from "@/lib/queries/students";
import { getTurmasForSelector } from "@/lib/queries/turmas";
import { PageHeader } from "@/components/ui/page-header";
import { StudentList } from "@/components/teacher/student-list";
import { InviteStudentForm } from "@/components/teacher/invite-student-form";

export default async function StudentsPage() {
  const { teacher } = await getTeacher();
  const students = await getStudents(teacher.id);
  const turmas = await getTurmasForSelector(teacher.id);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Alunos"
        description="Gerencie seus alunos e acompanhe o progresso."
      />

      <InviteStudentForm turmas={turmas} />

      <StudentList students={students} />
    </div>
  );
}

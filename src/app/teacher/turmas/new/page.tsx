import { getTeacher } from "@/lib/auth/get-teacher";
import { PageHeader } from "@/components/ui/page-header";
import { TurmaForm } from "@/components/teacher/turma-form";
import { createTurma } from "@/lib/actions/turmas";

export default async function NewTurmaPage() {
  await getTeacher();

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader title="Nova Turma" description="Crie uma nova turma para seus alunos." />
      <TurmaForm action={createTurma} />
    </div>
  );
}

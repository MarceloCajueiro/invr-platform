import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getTurmas } from "@/lib/queries/turmas";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TurmaCard } from "@/components/teacher/turma-card";

export default async function TurmasPage() {
  const { teacher } = await getTeacher();
  const turmas = await getTurmas(teacher.id);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Turmas"
        description="Gerencie suas turmas e alunos."
        action={
          <Link href="/teacher/turmas/new">
            <Button>
              <Plus size={16} />
              Nova Turma
            </Button>
          </Link>
        }
      />

      {turmas.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhuma turma criada"
          description="Crie sua primeira turma para organizar seus alunos."
          action={
            <Link href="/teacher/turmas/new">
              <Button>Nova Turma</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmas.map((turma) => (
            <TurmaCard key={turma.id} turma={turma} />
          ))}
        </div>
      )}
    </div>
  );
}

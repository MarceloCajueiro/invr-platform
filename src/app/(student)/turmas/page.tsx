import { Users } from "lucide-react";
import Link from "next/link";
import { getStudent } from "@/lib/auth/get-student";
import { getMyTurmas } from "@/lib/queries/student-turmas";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { TurmaCard } from "@/components/student/turma-card";

export default async function TurmasPage() {
  const { student } = await getStudent();
  const turmas = await getMyTurmas(student.id);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Minhas Turmas"
        description="Turmas que você participa"
        action={
          <Link href="/turmas/join">
            <Button>Entrar em uma Turma</Button>
          </Link>
        }
      />

      {turmas.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhuma turma"
          description="Você ainda não faz parte de nenhuma turma. Peça o código de convite ao seu professor!"
          action={
            <Link href="/turmas/join">
              <Button>Entrar em uma Turma</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {turmas.map((turma) => (
            <TurmaCard key={turma.id} turma={turma} />
          ))}
        </div>
      )}
    </div>
  );
}

import { getTeacher } from "@/lib/auth/get-teacher";
import { PageHeader } from "@/components/ui/page-header";
import { ChallengeForm } from "@/components/teacher/challenge-form";
import { createChallenge } from "@/lib/actions/challenges";
import { getTurmasForSelector } from "@/lib/queries/turmas";

export default async function NewChallengePage() {
  const { teacher } = await getTeacher();
  const turmas = await getTurmasForSelector(teacher.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader title="Novo Challenge" description="Crie um novo desafio para seus alunos." />
      <ChallengeForm action={createChallenge} turmas={turmas} />
    </div>
  );
}

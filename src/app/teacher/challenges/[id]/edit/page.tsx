import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getChallenge } from "@/lib/queries/challenges";
import { updateChallenge } from "@/lib/actions/challenges";
import { PageHeader } from "@/components/ui/page-header";
import { ChallengeForm } from "@/components/teacher/challenge-form";
import { getTurmasForSelector, getChallengeTurmaIds } from "@/lib/queries/turmas";

interface EditChallengePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditChallengePage({ params }: EditChallengePageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;

  const challenge = await getChallenge(id, teacher.id);
  if (!challenge) redirect("/teacher/challenges");

  const [turmas, selectedTurmaIds] = await Promise.all([
    getTurmasForSelector(teacher.id),
    getChallengeTurmaIds(challenge.id),
  ]);

  const updateChallengeWithId = updateChallenge.bind(null, challenge.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader
        title="Editar Challenge"
        description={`Editando: ${challenge.title}`}
      />
      <ChallengeForm
        challenge={challenge}
        action={updateChallengeWithId}
        turmas={turmas}
        selectedTurmaIds={selectedTurmaIds}
      />
    </div>
  );
}

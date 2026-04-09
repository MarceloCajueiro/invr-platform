import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getChallenges } from "@/lib/queries/challenges";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ChallengeList } from "@/components/teacher/challenge-list";
import { ChallengeCard } from "@/components/student/challenge-card";
import { DraftOverlay } from "@/components/teacher/draft-overlay";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";

interface ChallengesPageProps {
  searchParams: Promise<{ preview?: string }>;
}

export default async function ChallengesPage({ searchParams }: ChallengesPageProps) {
  const { teacher } = await getTeacher();
  const sp = await searchParams;
  const preview = isPreviewMode(sp);
  const challenges = await getChallenges(teacher.id);

  if (preview) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Challenges"
          description="Desafios do seu professor"
        />

        {challenges.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Nenhum desafio disponível"
            description="Seu professor ainda não publicou desafios. Volte em breve!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {challenges.map((challenge, i) => (
              <DraftOverlay key={challenge.id} isDraft={challenge.status === "draft"}>
                <ChallengeCard
                  challenge={{ ...challenge, responded: false }}
                  index={i}
                  href={previewHref(`/teacher/challenges/${challenge.id}/edit`, sp)}
                />
              </DraftOverlay>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Challenges"
        description="Crie desafios para seus alunos."
        action={
          <Link href="/teacher/challenges/new">
            <Button>
              <Plus size={16} />
              Novo Challenge
            </Button>
          </Link>
        }
      />

      <ChallengeList challenges={challenges} />
    </div>
  );
}

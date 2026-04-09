import { Trophy } from "lucide-react";
import { getStudent } from "@/lib/auth/get-student";
import { getStudentChallenges } from "@/lib/queries/student-challenges";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ChallengeCard } from "@/components/student/challenge-card";

export default async function ChallengesPage() {
  const { student } = await getStudent();
  const challenges = await getStudentChallenges(student.teacherId, student.id);

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
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

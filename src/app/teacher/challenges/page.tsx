import Link from "next/link";
import { Plus } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getChallenges } from "@/lib/queries/challenges";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ChallengeList } from "@/components/teacher/challenge-list";

export default async function ChallengesPage() {
  const { teacher } = await getTeacher();
  const challenges = await getChallenges(teacher.id);

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

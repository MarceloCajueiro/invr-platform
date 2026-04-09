import Link from "next/link";
import { Trophy, Pencil, MessageSquare, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteChallenge, toggleChallengeStatus } from "@/lib/actions/challenges";
import { DeleteButton } from "@/components/teacher/delete-button";
import { TurmaBadges } from "@/components/teacher/turma-badges";

interface Challenge {
  id: string;
  title: string;
  status: "draft" | "published";
  dueDate: Date | null;
  responseCount: number;
  createdAt: Date;
  turmas: { id: string; name: string; color: string | null }[];
}

interface ChallengeListProps {
  challenges: Challenge[];
}

const statusLabels: Record<"draft" | "published", string> = {
  draft: "Rascunho",
  published: "Publicado",
};

function formatDueDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString("pt-BR");
}

function isDueSoon(date: Date | null): boolean {
  if (!date) return false;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 days
}

function isOverdue(date: Date | null): boolean {
  if (!date) return false;
  return date.getTime() < Date.now();
}

export function ChallengeList({ challenges }: ChallengeListProps) {
  if (challenges.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Nenhum desafio encontrado"
        description="Crie seu primeiro desafio para seus alunos."
        action={
          <Link href="/teacher/challenges/new">
            <Button>Novo Challenge</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {challenges.map((challenge) => (
        <Card key={challenge.id} className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-text-primary truncate">
                  {challenge.title}
                </h3>
                <Badge variant={challenge.status}>
                  {statusLabels[challenge.status]}
                </Badge>
                {challenge.dueDate && (
                  <Badge
                    variant={
                      isOverdue(challenge.dueDate)
                        ? "fora"
                        : isDueSoon(challenge.dueDate)
                          ? "challenges"
                          : "default"
                    }
                  >
                    <Calendar size={10} className="mr-1" />
                    {formatDueDate(challenge.dueDate)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  {challenge.responseCount} {challenge.responseCount === 1 ? "resposta" : "respostas"}
                </span>
                <span>
                  {challenge.createdAt.toLocaleDateString("pt-BR")}
                </span>
                {challenge.turmas.length > 0 && (
                  <>
                    <span className="text-border">·</span>
                    <TurmaBadges turmas={challenge.turmas} />
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <form action={toggleChallengeStatus}>
                <input type="hidden" name="id" value={challenge.id} />
                <Button variant="ghost" size="sm" type="submit">
                  {challenge.status === "draft" ? "Publicar" : "Despublicar"}
                </Button>
              </form>

              {challenge.responseCount > 0 && (
                <Link href={`/teacher/challenges/${challenge.id}/responses`}>
                  <Button variant="secondary" size="sm">
                    <MessageSquare size={14} />
                    Respostas
                  </Button>
                </Link>
              )}

              <Link href={`/teacher/challenges/${challenge.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil size={14} />
                  Editar
                </Button>
              </Link>

              <DeleteButton action={deleteChallenge} id={challenge.id} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

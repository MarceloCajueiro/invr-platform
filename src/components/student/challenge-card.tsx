import Link from "next/link";
import { Trophy, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    dueDate: Date | null;
    responded: boolean;
  };
  index: number;
  href?: string;
}

function formatDueDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString("pt-BR");
}

function isOverdue(date: Date | null): boolean {
  if (!date) return false;
  return date.getTime() < Date.now();
}

export function ChallengeCard({ challenge, index, href }: ChallengeCardProps) {
  const overdue = isOverdue(challenge.dueDate);

  return (
    <Link href={href ?? `/challenges/${challenge.id}`}>
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-challenges/10 flex items-center justify-center shrink-0">
              <Trophy size={20} className="text-challenges" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-primary truncate">
                {challenge.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                {challenge.responded ? (
                  <Badge variant="tarefas">
                    <CheckCircle size={10} className="mr-1" />
                    Respondido
                  </Badge>
                ) : overdue ? (
                  <Badge variant="fora">Encerrado</Badge>
                ) : (
                  <Badge variant="challenges">Pendente</Badge>
                )}
                {challenge.dueDate && (
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDueDate(challenge.dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

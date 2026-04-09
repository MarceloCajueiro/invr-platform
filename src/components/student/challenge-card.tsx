import Link from "next/link";
import Image from "next/image";
import { Trophy, Calendar, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    coverImageUrl?: string | null;
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
        hoverable
        className="animate-slide-up overflow-hidden"
        style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
      >
        <div className="flex">
          {/* Thumbnail */}
          <div className="relative w-24 sm:w-40 min-h-24 shrink-0">
            {challenge.coverImageUrl ? (
              <Image
                src={challenge.coverImageUrl}
                alt={challenge.title}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 640px) 96px, 160px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-challenges-light to-challenges-bg">
                <Trophy size={32} className="text-text-muted opacity-50" />
              </div>
            )}
            {challenge.responded && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white text-xs font-medium bg-success px-2 py-0.5 rounded-full">
                  Respondido
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 p-4 flex flex-col justify-center gap-1.5 items-start">
            <div className="flex items-center gap-2">
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
            </div>
            <h3 className="font-medium text-text-primary line-clamp-2">
              {challenge.title}
            </h3>
            {challenge.dueDate && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Calendar size={12} />
                <span>Prazo: {formatDueDate(challenge.dueDate)}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

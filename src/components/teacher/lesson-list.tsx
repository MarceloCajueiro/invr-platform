import Link from "next/link";
import { BookOpen, Pencil, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteLesson, toggleLessonStatus } from "@/lib/actions/lessons";
import { DeleteButton } from "@/components/teacher/delete-button";
import { TurmaBadges } from "@/components/teacher/turma-badges";
import type { BadgeVariant } from "@/components/ui/badge";

interface Lesson {
  id: string;
  title: string;
  category: "conversation" | "grammar" | "vocabulary" | "listening" | "culture";
  status: "draft" | "published";
  durationMinutes: number | null;
  createdAt: Date;
  turmas: { id: string; name: string; color: string | null }[];
}

interface LessonListProps {
  lessons: Lesson[];
}

const categoryLabels: Record<Lesson["category"], string> = {
  conversation: "Conversação",
  grammar: "Gramática",
  vocabulary: "Vocabulário",
  listening: "Listening",
  culture: "Cultura",
};

const categoryBadgeVariant: Record<Lesson["category"], BadgeVariant> = {
  conversation: "aulas",
  grammar: "tarefas",
  vocabulary: "fora",
  listening: "challenges",
  culture: "default",
};

const statusLabels: Record<Lesson["status"], string> = {
  draft: "Rascunho",
  published: "Publicada",
};

export function LessonList({ lessons }: LessonListProps) {
  if (lessons.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Nenhuma aula encontrada"
        description="Crie sua primeira aula para começar a ensinar."
        action={
          <Link href="/teacher/lessons/new">
            <Button>Nova Aula</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {lessons.map((lesson) => (
        <Card key={lesson.id} className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-text-primary truncate">
                  {lesson.title}
                </h3>
                <Badge variant={categoryBadgeVariant[lesson.category]}>
                  {categoryLabels[lesson.category]}
                </Badge>
                <Badge variant={lesson.status}>
                  {statusLabels[lesson.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {lesson.durationMinutes && (
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock size={12} />
                    <span>{lesson.durationMinutes} min</span>
                  </div>
                )}
                {lesson.turmas.length > 0 && (
                  <>
                    {lesson.durationMinutes && (
                      <span className="text-border">·</span>
                    )}
                    <TurmaBadges turmas={lesson.turmas} />
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <form action={toggleLessonStatus}>
                <input type="hidden" name="id" value={lesson.id} />
                <Button variant="ghost" size="sm" type="submit">
                  {lesson.status === "draft" ? "Publicar" : "Despublicar"}
                </Button>
              </form>

              <Link href={`/teacher/lessons/${lesson.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil size={14} />
                  Editar
                </Button>
              </Link>

              <DeleteButton action={deleteLesson} id={lesson.id} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

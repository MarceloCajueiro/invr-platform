import Link from "next/link";
import { HelpCircle, Headphones, PenLine, FileEdit, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteTask, toggleTaskStatus } from "@/lib/actions/tasks";
import type { BadgeVariant } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

interface Task {
  id: string;
  title: string;
  taskType: "quiz" | "listening" | "fill_gaps" | "writing";
  level: "beginner" | "intermediate" | "advanced";
  status: "draft" | "published";
  questions: string | null;
  createdAt: Date;
}

interface TaskListProps {
  tasks: Task[];
}

const typeIcons: Record<Task["taskType"], LucideIcon> = {
  quiz: HelpCircle,
  listening: Headphones,
  fill_gaps: PenLine,
  writing: FileEdit,
};

const typeLabels: Record<Task["taskType"], string> = {
  quiz: "Quiz",
  listening: "Listening",
  fill_gaps: "Lacunas",
  writing: "Escrita",
};

const typeBadgeVariant: Record<Task["taskType"], BadgeVariant> = {
  quiz: "aulas",
  listening: "challenges",
  fill_gaps: "tarefas",
  writing: "fora",
};

const levelLabels: Record<Task["level"], string> = {
  beginner: "Iniciante",
  intermediate: "Intermediario",
  advanced: "Avancado",
};

const statusLabels: Record<Task["status"], string> = {
  draft: "Rascunho",
  published: "Publicada",
};

function getQuestionCount(questions: string | null): number {
  if (!questions) return 0;
  try {
    const parsed = JSON.parse(questions);
    if (Array.isArray(parsed)) return parsed.length;
    return 1;
  } catch {
    return 0;
  }
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={HelpCircle}
        title="Nenhuma tarefa encontrada"
        description="Crie sua primeira tarefa para seus alunos."
        action={
          <Link href="/teacher/tasks/new">
            <Button>Nova Tarefa</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const Icon = typeIcons[task.taskType];
        const questionCount = getQuestionCount(task.questions);

        return (
          <Card key={task.id} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} className="text-text-muted shrink-0" />
                  <h3 className="text-sm font-semibold text-text-primary truncate">
                    {task.title}
                  </h3>
                  <Badge variant={typeBadgeVariant[task.taskType]}>
                    {typeLabels[task.taskType]}
                  </Badge>
                  <Badge variant={task.level}>
                    {levelLabels[task.level]}
                  </Badge>
                  <Badge variant={task.status}>
                    {statusLabels[task.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <span>
                    {questionCount}{" "}
                    {questionCount === 1 ? "questao" : "questoes"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <form action={toggleTaskStatus}>
                  <input type="hidden" name="id" value={task.id} />
                  <Button variant="ghost" size="sm" type="submit">
                    {task.status === "draft" ? "Publicar" : "Despublicar"}
                  </Button>
                </form>

                <Link href={`/teacher/tasks/${task.id}/edit`}>
                  <Button variant="secondary" size="sm">
                    <Pencil size={14} />
                    Editar
                  </Button>
                </Link>

                <form action={deleteTask}>
                  <input type="hidden" name="id" value={task.id} />
                  <Button variant="danger" size="sm" type="submit">
                    Excluir
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

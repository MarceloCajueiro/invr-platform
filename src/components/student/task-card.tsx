import Link from "next/link";
import {
  HelpCircle,
  Headphones,
  PenLine,
  FileEdit,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DateBadge, type DateBadgeChannel } from "@/components/ui/date-badge";
import { HomeworkBadge } from "@/components/ui/homework-badge";
import { cn } from "@/lib/utils";

const taskTypeConfig: Record<
  string,
  { icon: typeof HelpCircle; label: string; color: string; channel: DateBadgeChannel }
> = {
  quiz: { icon: HelpCircle, label: "Quiz", color: "text-aulas", channel: "aulas" },
  listening: { icon: Headphones, label: "Listening", color: "text-challenges", channel: "challenges" },
  fill_gaps: {
    icon: PenLine,
    label: "Lacunas",
    color: "text-tarefas",
    channel: "tarefas",
  },
  writing: { icon: FileEdit, label: "Redação", color: "text-fora", channel: "fora" },
};

const levelLabels: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    taskType: string;
    level: string;
    description?: string | null;
    publishedAt?: Date | null;
    createdAt: Date;
    isHomework?: boolean;
  };
  submission?: {
    score: number | null;
    status: string;
  };
  index?: number;
  href?: string;
}

function ScoreDisplay({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-success bg-tarefas-bg"
      : score >= 60
        ? "text-warning bg-challenges-bg"
        : "text-error bg-fora-bg";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold",
        color,
      )}
    >
      <CheckCircle2 size={14} />
      {score}%
    </span>
  );
}

export function TaskCard({ task, submission, index = 0, href }: TaskCardProps) {
  const config = taskTypeConfig[task.taskType] || taskTypeConfig.quiz;
  const Icon = config.icon;

  const isGraded = submission?.status === "graded" && submission.score !== null;
  const isSubmitted = submission?.status === "submitted";

  return (
    <Link
      href={href ?? `/tasks/${task.id}`}
      className="flex items-stretch gap-3 animate-slide-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
    >
      <DateBadge
        date={task.publishedAt ?? task.createdAt}
        channel={config.channel}
      />
      <Card hoverable className="flex-1 overflow-hidden">
        <div className="p-5 flex items-start gap-4">
          {/* Type icon */}
          <div
            className={cn(
              "w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0",
              task.taskType === "quiz" && "bg-aulas-bg",
              task.taskType === "listening" && "bg-challenges-bg",
              task.taskType === "fill_gaps" && "bg-tarefas-bg",
              task.taskType === "writing" && "bg-fora-bg",
            )}
          >
            <Icon size={20} className={config.color} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge
                variant={
                  (task.level as BadgeVariant) || "default"
                }
              >
                {levelLabels[task.level] || task.level}
              </Badge>
              <Badge variant="default">{config.label}</Badge>
              {task.isHomework && <HomeworkBadge />}
            </div>
            <h3 className="font-medium text-text-primary truncate">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-text-muted mt-0.5 truncate">
                {task.description}
              </p>
            )}
          </div>

          {/* Status / Score */}
          <div className="shrink-0 flex items-center">
            {isGraded ? (
              <ScoreDisplay score={submission.score!} />
            ) : isSubmitted ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-challenges-bg text-challenges">
                <Clock size={12} />
                Pendente
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm text-text-muted">
                Iniciar
                <ArrowRight size={14} />
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

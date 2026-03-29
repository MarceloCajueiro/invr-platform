import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  Flame,
  Trophy,
  Calendar,
  BookOpen,
  ClipboardCheck,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StudentProfile as StudentProfileData } from "@/lib/queries/students";
import type { StudentSubmission } from "@/lib/queries/students";
import type { StudentLessonProgress } from "@/lib/queries/students";
import type { StudentTurma } from "@/lib/queries/students";

interface StudentProfileProps {
  student: StudentProfileData;
  submissions: StudentSubmission[];
  progress: StudentLessonProgress[];
  turmas: StudentTurma[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const statusLabels: Record<string, string> = {
  in_progress: "Em andamento",
  submitted: "Enviada",
  graded: "Corrigida",
};

const statusVariant: Record<string, "draft" | "published" | "default"> = {
  in_progress: "draft",
  submitted: "default",
  graded: "published",
};

export function StudentProfile({
  student,
  submissions,
  progress,
  turmas,
}: StudentProfileProps) {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/students"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar para alunos
      </Link>

      {/* Student header */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-aulas flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-white">
              {getInitials(student.name)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-text-primary font-display truncate">
              {student.name}
            </h2>
            <p className="text-sm text-text-muted">{student.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-2 text-sm">
            <Zap size={16} className="text-challenges" />
            <div>
              <p className="font-semibold text-text-primary">{student.xp}</p>
              <p className="text-xs text-text-muted">XP total</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Flame size={16} className="text-tarefas" />
            <div>
              <p className="font-semibold text-text-primary">
                {student.currentStreak}
              </p>
              <p className="text-xs text-text-muted">Streak atual</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Trophy size={16} className="text-fora" />
            <div>
              <p className="font-semibold text-text-primary">
                {student.longestStreak}
              </p>
              <p className="text-xs text-text-muted">Melhor streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-text-muted" />
            <div>
              <p className="font-semibold text-text-primary">
                {formatDate(student.lastActivityAt)}
              </p>
              <p className="text-xs text-text-muted">Ultima atividade</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Submissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck size={16} className="text-tarefas" />
            <h3 className="text-sm font-semibold text-text-primary">
              Submissoes recentes
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">
              Nenhuma submissao encontrada.
            </p>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {sub.taskTitle}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDate(sub.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {sub.score !== null && (
                      <span className="text-sm font-semibold text-text-primary">
                        {sub.score}%
                      </span>
                    )}
                    <Badge variant={statusVariant[sub.status] ?? "default"}>
                      {statusLabels[sub.status] ?? sub.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lesson progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-aulas" />
            <h3 className="text-sm font-semibold text-text-primary">
              Progresso nas aulas
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          {progress.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">
              Nenhum progresso registrado.
            </p>
          ) : (
            <div className="space-y-3">
              {progress.map((lp) => (
                <div key={lp.id} className="py-2 border-b border-border last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {lp.lessonTitle}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-text-muted">
                        {lp.progress}%
                      </span>
                      {lp.watchedAt && (
                        <span className="text-xs text-text-muted">
                          {formatDate(lp.watchedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-bg-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-tarefas rounded-full transition-all"
                      style={{ width: `${Math.min(lp.progress, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Turmas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-fora" />
            <h3 className="text-sm font-semibold text-text-primary">Turmas</h3>
          </div>
        </CardHeader>
        <CardContent>
          {turmas.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">
              Aluno nao esta em nenhuma turma.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {turmas.map((turma) => (
                <Badge key={turma.id} variant="aulas">
                  {turma.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

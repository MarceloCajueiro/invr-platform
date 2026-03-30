import Link from "next/link";
import { GraduationCap, Zap, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { StudentListItem } from "@/lib/queries/students";

interface StudentListProps {
  students: StudentListItem[];
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
  if (!date) return "Sem atividade";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function StudentList({ students }: StudentListProps) {
  if (students.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Nenhum aluno"
        description="Convide alunos para começar a acompanhar o progresso deles."
      />
    );
  }

  return (
    <div className="space-y-3">
      {students.map((student) => (
        <Link key={student.id} href={`/teacher/students/${student.id}`}>
          <Card hoverable className="p-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-aulas flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-white">
                  {getInitials(student.name)}
                </span>
              </div>

              {/* Name & email */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-text-primary truncate">
                  {student.name}
                </h3>
                <p className="text-xs text-text-muted truncate">
                  {student.email}
                </p>
              </div>

              {/* XP */}
              <Badge variant="challenges" className="shrink-0">
                <Zap size={12} className="mr-1" />
                {student.xp} XP
              </Badge>

              {/* Streak */}
              {student.currentStreak > 0 && (
                <div className="flex items-center gap-1 text-sm text-tarefas shrink-0">
                  <Flame size={14} />
                  <span className="font-medium">{student.currentStreak}</span>
                </div>
              )}

              {/* Last activity */}
              <span className="text-xs text-text-muted shrink-0 hidden sm:block">
                {formatDate(student.lastActivityAt)}
              </span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

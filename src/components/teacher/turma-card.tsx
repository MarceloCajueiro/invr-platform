"use client";

import Link from "next/link";
import { Users, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

interface TurmaCardData {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  level: "beginner" | "intermediate" | "advanced" | null;
  inviteCode: string;
  studentCount: number;
}

interface TurmaCardProps {
  turma: TurmaCardData;
}

const levelLabels: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

const levelBadgeVariant: Record<string, BadgeVariant> = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
};

export function TurmaCard({ turma }: TurmaCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(turma.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Link href={`/teacher/turmas/${turma.id}`}>
      <Card hoverable className="overflow-hidden">
        <div
          className="h-[3px]"
          style={{ backgroundColor: turma.color || "#6c5ce7" }}
        />
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {turma.name}
            </h3>
            {turma.level && (
              <Badge variant={levelBadgeVariant[turma.level]}>
                {levelLabels[turma.level]}
              </Badge>
            )}
          </div>

          {turma.description && (
            <p className="text-xs text-text-secondary line-clamp-2 mb-3">
              {turma.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Users size={14} />
              <span>
                {turma.studentCount}{" "}
                {turma.studentCount === 1 ? "aluno" : "alunos"}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] bg-bg-light hover:bg-border transition-colors"
              title="Copiar código de convite"
            >
              <span className="text-xs font-mono text-text-secondary">
                {turma.inviteCode}
              </span>
              {copied ? (
                <Check size={12} className="text-tarefas" />
              ) : (
                <Copy size={12} className="text-text-muted" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

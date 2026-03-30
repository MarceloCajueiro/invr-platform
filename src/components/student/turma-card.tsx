import { Card } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

interface TurmaCardProps {
  turma: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    level: "beginner" | "intermediate" | "advanced" | null;
  };
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
  return (
    <Card className="overflow-hidden">
      {/* Colored top bar */}
      <div
        className="h-[3px]"
        style={{ backgroundColor: turma.color || "var(--color-aulas)" }}
      />

      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-text-primary">{turma.name}</h3>
          {turma.level && (
            <Badge variant={levelBadgeVariant[turma.level]}>
              {levelLabels[turma.level]}
            </Badge>
          )}
        </div>

        {turma.description && (
          <p className="text-sm text-text-secondary line-clamp-2">
            {turma.description}
          </p>
        )}
      </div>
    </Card>
  );
}

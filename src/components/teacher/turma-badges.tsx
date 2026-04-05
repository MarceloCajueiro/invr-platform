"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface TurmaBadgesProps {
  turmas: { id: string; name: string; color: string | null }[];
  max?: number;
}

export function TurmaBadges({ turmas, max = 2 }: TurmaBadgesProps) {
  const [expanded, setExpanded] = useState(false);

  if (turmas.length === 0) return null;

  const visible = expanded ? turmas : turmas.slice(0, max);
  const hiddenCount = turmas.length - max;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((turma) => (
        <Badge key={turma.id} variant="default" className="gap-1">
          {turma.color && (
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: turma.color }}
            />
          )}
          {turma.name}
        </Badge>
      ))}
      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          +{hiddenCount}
        </button>
      )}
      {expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          menos
        </button>
      )}
    </div>
  );
}

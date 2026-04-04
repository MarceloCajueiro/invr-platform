"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface TurmaOption {
  id: string;
  name: string;
  color: string | null;
}

interface TurmaSelectorProps {
  turmas: TurmaOption[];
  selectedIds?: string[];
  name?: string;
}

export function TurmaSelector({
  turmas,
  selectedIds = [],
  name = "turmaIds",
}: TurmaSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedIds),
  );

  if (turmas.length === 0) return null;

  const allSelected = turmas.length > 0 && turmas.every((t) => selected.has(t.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(turmas.map((t) => t.id)));
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Users size={16} />
          Turmas
        </h3>

        <input type="hidden" name={name} value={JSON.stringify([...selected])} />

        <label className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-md hover:bg-bg-light transition-colors">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="rounded border-border text-aulas focus:ring-aulas"
          />
          <span className="text-sm font-medium text-text-primary">
            Todas as turmas
          </span>
        </label>

        <div className="border-t border-border pt-2 space-y-0.5">
          {turmas.map((turma) => (
            <label
              key={turma.id}
              className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-md hover:bg-bg-light transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.has(turma.id)}
                onChange={() => toggle(turma.id)}
                className="rounded border-border text-aulas focus:ring-aulas"
              />
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: turma.color || "#6c5ce7" }}
              />
              <span className="text-sm text-text-secondary">{turma.name}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

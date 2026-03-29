"use client";

import { useState } from "react";
import { BookOpen, ClipboardList, Unlink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import {
  linkLesson,
  unlinkLesson,
  linkTask,
  unlinkTask,
} from "@/lib/actions/turmas";

interface LinkedLesson {
  id: string;
  title: string;
  category: string;
  status: string;
}

interface LinkedTask {
  id: string;
  title: string;
  taskType: string;
  level: string;
  status: string;
}

interface AvailableItem {
  id: string;
  title: string;
}

interface TurmaContentProps {
  turmaId: string;
  type: "lessons" | "tasks";
  items: LinkedLesson[] | LinkedTask[];
  available: AvailableItem[];
}

export function TurmaContent({
  turmaId,
  type,
  items,
  available,
}: TurmaContentProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  const isLessons = type === "lessons";
  const label = isLessons ? "Aula" : "Tarefa";
  const labelPlural = isLessons ? "Aulas" : "Tarefas";
  const Icon = isLessons ? BookOpen : ClipboardList;
  const unlinkAction = isLessons ? unlinkLesson : unlinkTask;
  const linkAction = isLessons ? linkLesson : linkTask;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          {labelPlural} Vinculadas
        </h3>
        {available.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAdd(!showAdd)}
          >
            <Plus size={14} />
            Vincular {label}
          </Button>
        )}
      </div>

      {showAdd && (
        <Card className="p-4">
          <form
            action={linkAction}
            onSubmit={() => {
              setShowAdd(false);
              setSelectedId("");
            }}
            className="flex items-end gap-3"
          >
            <input type="hidden" name="turmaId" value={turmaId} />
            <div className="flex-1 space-y-1.5">
              <label className="block text-xs font-medium text-text-primary">
                Selecionar {label}
              </label>
              <select
                name={isLessons ? "lessonId" : "taskId"}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#f8f9fb] border border-border text-text-primary focus:outline-none focus:border-aulas transition-colors appearance-none"
              >
                <option value="" disabled>
                  Escolha uma {label.toLowerCase()}...
                </option>
                {available.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" disabled={!selectedId}>
              Vincular
            </Button>
          </form>
        </Card>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Icon}
          title={`Nenhuma ${label.toLowerCase()} vinculada`}
          description={`Vincule ${labelPlural.toLowerCase()} publicadas a esta turma.`}
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={16} className="text-text-muted shrink-0" />
                  <span className="text-sm font-medium text-text-primary truncate">
                    {item.title}
                  </span>
                </div>
                <form action={unlinkAction}>
                  <input type="hidden" name="turmaId" value={turmaId} />
                  <input
                    type="hidden"
                    name={isLessons ? "lessonId" : "taskId"}
                    value={item.id}
                  />
                  <Button variant="ghost" size="sm" type="submit">
                    <Unlink size={14} />
                    Desvincular
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

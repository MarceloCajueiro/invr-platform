"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionEditor } from "@/components/teacher/question-editor";
import { AiGeneratorPanel } from "@/components/teacher/ai-generator-panel";
import { TurmaSelector } from "@/components/teacher/turma-selector";
import { HomeworkBadge } from "@/components/ui/homework-badge";
import { toInputDate } from "@/lib/utils";

type TaskType = "quiz" | "listening" | "fill_gaps" | "writing";
type Level = "beginner" | "intermediate" | "advanced";

const AI_SUPPORTED_TYPES: TaskType[] = ["quiz", "fill_gaps", "writing"];

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  taskType: TaskType;
  level: Level;
  questions: string | null;
  publishedAt: Date | null;
  isHomework: boolean;
}

interface TaskFormProps {
  task?: TaskData;
  action: (formData: FormData) => Promise<void>;
  turmas?: { id: string; name: string; color: string | null }[];
  selectedTurmaIds?: string[];
}

const typeOptions = [
  { value: "quiz", label: "Quiz" },
  { value: "listening", label: "Listening" },
  { value: "fill_gaps", label: "Preencher Lacunas" },
  { value: "writing", label: "Escrita" },
];

const levelOptions = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced", label: "Avançado" },
];

export function TaskForm({ task, action, turmas = [], selectedTurmaIds = [] }: TaskFormProps) {
  const isEdit = !!task;
  const [taskType, setTaskType] = useState<TaskType>(
    task?.taskType ?? "quiz",
  );
  const [level, setLevel] = useState<Level>(task?.level ?? "beginner");
  const [generatedQuestions, setGeneratedQuestions] = useState<string | null>(
    null,
  );
  const [aiPrompt, setAiPrompt] = useState("");

  const handleAiGenerated = (questions: string, prompt: string) => {
    setGeneratedQuestions(questions);
    setAiPrompt(prompt);
  };

  // Build a stable key for QuestionEditor that changes when AI generates new content
  const editorKey = `${taskType}-${generatedQuestions ?? "manual"}`;

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-5">
          <Input
            label="Título"
            name="title"
            placeholder="Ex: Quiz sobre Present Perfect"
            defaultValue={task?.title ?? ""}
            required
          />

          <Select
            label="Tipo"
            name="taskType"
            options={typeOptions}
            defaultValue={task?.taskType ?? "quiz"}
            onChange={(e) => {
              const newType = e.target.value as TaskType;
              setTaskType(newType);
              setGeneratedQuestions(null);
              setAiPrompt("");
            }}
          />

          <Select
            label="Nível"
            name="level"
            options={levelOptions}
            defaultValue={task?.level ?? "beginner"}
            onChange={(e) => setLevel(e.target.value as Level)}
          />

          <Textarea
            label="Descrição"
            name="description"
            placeholder="Descreva a tarefa..."
            rows={4}
            defaultValue={task?.description ?? ""}
          />

          <div className="space-y-1.5">
            <Input
              label="Data de publicação"
              name="publishedAt"
              type="date"
              defaultValue={toInputDate(task?.publishedAt)}
            />
            <p className="text-xs text-text-muted">
              Pode agendar para o futuro — alunos só veem a partir dessa data.
            </p>
          </div>

          {AI_SUPPORTED_TYPES.includes(taskType) && (
            <AiGeneratorPanel
              taskType={taskType}
              level={level}
              onGenerated={handleAiGenerated}
            />
          )}

          <QuestionEditor
            key={editorKey}
            taskType={taskType}
            initialQuestions={generatedQuestions ?? task?.questions ?? undefined}
            name="questions"
            level={level}
          />

          <input
            type="hidden"
            name="aiGenerated"
            value={generatedQuestions ? "true" : "false"}
          />
          <input type="hidden" name="aiPrompt" value={aiPrompt} />

          <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-border">
            <input
              type="checkbox"
              name="isHomework"
              defaultChecked={task?.isHomework ?? false}
              className="mt-1 w-4 h-4 rounded border-border text-challenges focus:ring-challenges"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary">
                  Marcar como <em>homework</em>
                </span>
                <HomeworkBadge />
              </div>
              <p className="text-sm text-text-muted mt-0.5">
                Sinaliza para o aluno que esta tarefa deve estar pronta para a próxima aula.
              </p>
            </div>
          </label>

          {turmas.length > 0 && (
            <TurmaSelector turmas={turmas} selectedIds={selectedTurmaIds} />
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit">
              {isEdit ? "Salvar Alterações" : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

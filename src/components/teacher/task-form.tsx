"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionEditor } from "@/components/teacher/question-editor";

type TaskType = "quiz" | "listening" | "fill_gaps" | "writing";

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  taskType: TaskType;
  level: "beginner" | "intermediate" | "advanced";
  questions: string | null;
}

interface TaskFormProps {
  task?: TaskData;
  action: (formData: FormData) => Promise<void>;
}

const typeOptions = [
  { value: "quiz", label: "Quiz" },
  { value: "listening", label: "Listening" },
  { value: "fill_gaps", label: "Preencher Lacunas" },
  { value: "writing", label: "Escrita" },
];

const levelOptions = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermediario" },
  { value: "advanced", label: "Avancado" },
];

export function TaskForm({ task, action }: TaskFormProps) {
  const isEdit = !!task;
  const [taskType, setTaskType] = useState<TaskType>(
    task?.taskType ?? "quiz",
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-5">
          <Input
            label="Titulo"
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
            onChange={(e) => setTaskType(e.target.value as TaskType)}
          />

          <Select
            label="Nivel"
            name="level"
            options={levelOptions}
            defaultValue={task?.level ?? "beginner"}
          />

          <Textarea
            label="Descricao"
            name="description"
            placeholder="Descreva a tarefa..."
            rows={4}
            defaultValue={task?.description ?? ""}
          />

          <QuestionEditor
            key={taskType}
            taskType={taskType}
            initialQuestions={task?.questions ?? undefined}
            name="questions"
          />

          <div className="flex justify-end pt-2">
            <Button type="submit">
              {isEdit ? "Salvar Alteracoes" : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

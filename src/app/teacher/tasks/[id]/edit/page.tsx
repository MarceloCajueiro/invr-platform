import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getTask } from "@/lib/queries/tasks";
import { updateTask } from "@/lib/actions/tasks";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { TaskForm } from "@/components/teacher/task-form";
import { QuizPlayer } from "@/components/student/quiz-player";
import { FillGapsPlayer } from "@/components/student/fill-gaps-player";
import { WritingPlayer } from "@/components/student/writing-player";
import { ListeningPlayer } from "@/components/student/listening-player";
import { getTurmasForSelector, getTaskTurmaIds } from "@/lib/queries/turmas";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";
import type { QuizQuestion, FillGapQuestion } from "@/lib/validations/tasks";

const levelLabels: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

const typeLabels: Record<string, string> = {
  quiz: "Quiz",
  listening: "Listening",
  fill_gaps: "Preencher Lacunas",
  writing: "Redação",
};

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function EditTaskPage({ params, searchParams }: EditTaskPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;
  const sp = await searchParams;

  const task = await getTask(id, teacher.id);
  if (!task) redirect("/teacher/tasks");

  if (isPreviewMode(sp)) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <Link
          href={previewHref("/teacher/tasks", sp)}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Voltar para tarefas
        </Link>

        {task.status === "draft" && (
          <div className="mb-4">
            <Badge variant="info">Não visível para alunos</Badge>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={(task.level as BadgeVariant) || "default"}>
              {levelLabels[task.level] || task.level}
            </Badge>
            <Badge variant="default">
              {typeLabels[task.taskType] || task.taskType}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-text-primary font-display">
            {task.title}
          </h1>
          {task.description && (
            <p className="text-text-secondary mt-1">{task.description}</p>
          )}
        </div>

        {task.taskType === "quiz" && (
          <QuizPlayer
            questions={
              task.questions
                ? (JSON.parse(task.questions) as QuizQuestion[])
                : []
            }
            taskId={task.id}
            readOnly
          />
        )}

        {task.taskType === "fill_gaps" && (
          <FillGapsPlayer
            questions={
              task.questions
                ? (JSON.parse(task.questions) as FillGapQuestion[])
                : []
            }
            taskId={task.id}
            readOnly
          />
        )}

        {task.taskType === "writing" && (
          <WritingPlayer task={task} readOnly />
        )}

        {task.taskType === "listening" && (
          <ListeningPlayer task={task} readOnly />
        )}
      </div>
    );
  }

  const [turmas, selectedTurmaIds] = await Promise.all([
    getTurmasForSelector(teacher.id),
    getTaskTurmaIds(task.id),
  ]);

  const updateTaskWithId = updateTask.bind(null, task.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader
        title="Editar Tarefa"
        description={`Editando: ${task.title}`}
      />
      <TaskForm
        task={task}
        action={updateTaskWithId}
        turmas={turmas}
        selectedTurmaIds={selectedTurmaIds}
      />
    </div>
  );
}

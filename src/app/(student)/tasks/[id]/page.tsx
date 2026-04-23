import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStudent } from "@/lib/auth/get-student";
import { getStudentTask, getSubmission } from "@/lib/queries/student-tasks";
import { QuizPlayer } from "@/components/student/quiz-player";
import { FillGapsPlayer } from "@/components/student/fill-gaps-player";
import { WritingPlayer } from "@/components/student/writing-player";
import { ListeningPlayer } from "@/components/student/listening-player";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { HomeworkBadge } from "@/components/ui/homework-badge";
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

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { student } = await getStudent();
  const task = await getStudentTask(id, student.teacherId);

  if (!task) notFound();

  const submission = await getSubmission(student.id, id);

  const submissionData = submission
    ? {
        answers: submission.answers,
        score: submission.score,
        feedback: submission.feedback,
        status: submission.status,
      }
    : undefined;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Back button */}
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para tarefas
      </Link>

      {/* Task header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={(task.level as BadgeVariant) || "default"}>
            {levelLabels[task.level] || task.level}
          </Badge>
          <Badge variant="default">
            {typeLabels[task.taskType] || task.taskType}
          </Badge>
          {task.isHomework && <HomeworkBadge />}
        </div>
        <h1 className="text-2xl font-bold text-text-primary font-display">
          {task.title}
        </h1>
        {task.description && (
          <p className="text-text-secondary mt-1">{task.description}</p>
        )}
      </div>

      {/* Player based on task type */}
      {task.taskType === "quiz" && (
        <QuizPlayer
          questions={
            task.questions
              ? (JSON.parse(task.questions) as QuizQuestion[])
              : []
          }
          taskId={task.id}
          existingSubmission={submissionData}
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
          existingSubmission={submissionData}
        />
      )}

      {task.taskType === "writing" && (
        <WritingPlayer task={task} existingSubmission={submissionData} />
      )}

      {task.taskType === "listening" && (
        <ListeningPlayer task={task} existingSubmission={submissionData} />
      )}
    </div>
  );
}

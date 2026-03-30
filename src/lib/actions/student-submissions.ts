"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getStudent } from "@/lib/auth/get-student";
import { getDb } from "@/lib/db";
import { tasks, submissions } from "@/lib/db/schema";
import type { QuizQuestion, FillGapQuestion } from "@/lib/validations/tasks";
import { correctWriting } from "@/lib/services/ai/groq";

export async function submitAnswers(taskId: string, answers: string) {
  const { student } = await getStudent();
  const db = getDb();

  // Verify the task exists, is published, and belongs to student's teacher
  const task = await db.query.tasks.findFirst({
    where: (t, { eq: e, and: a }) =>
      a(
        e(t.id, taskId),
        e(t.teacherId, student.teacherId),
        e(t.status, "published"),
      ),
  });

  if (!task) {
    throw new Error("Tarefa não encontrada");
  }

  // Check if student already submitted
  const existing = await db.query.submissions.findFirst({
    where: (s, { eq: e, and: a }) =>
      a(e(s.studentId, student.id), e(s.taskId, taskId)),
  });

  if (existing) {
    throw new Error("Você já enviou esta tarefa");
  }

  let score: number | null = null;
  let gradedBy: "auto" | "ai" | "teacher" | null = null;
  let status: "submitted" | "graded" = "submitted";
  let feedback: string | null = null;

  if (task.taskType === "quiz" || task.taskType === "listening") {
    // Auto-grade quiz and listening
    const questions: QuizQuestion[] = task.questions
      ? JSON.parse(task.questions)
      : [];

    // For listening, questions may be nested
    let quizQuestions = questions;
    if (task.taskType === "listening" && task.questions) {
      const parsed = JSON.parse(task.questions);
      // Listening format: { text, audioUrl, questions: QuizQuestion[] }
      quizQuestions = parsed.questions || parsed;
    }

    const studentAnswers: Record<string, string> = JSON.parse(answers);
    let correct = 0;
    const total = quizQuestions.length;

    for (const question of quizQuestions) {
      const studentAnswer = studentAnswers[String(question.number)];
      const correctOption = question.options.find((o) => o.correct);
      if (correctOption && studentAnswer === correctOption.letter) {
        correct++;
      }
    }

    score = total > 0 ? Math.round((correct / total) * 100) : 0;
    gradedBy = "auto";
    status = "graded";
    feedback = `Você acertou ${correct} de ${total} questões.`;
  } else if (task.taskType === "fill_gaps") {
    // Auto-grade fill_gaps
    const questions: FillGapQuestion[] = task.questions
      ? JSON.parse(task.questions)
      : [];
    const studentAnswers: Record<string, string> = JSON.parse(answers);
    let correct = 0;
    const total = questions.length;

    for (const question of questions) {
      const studentAnswer = (
        studentAnswers[String(question.number)] || ""
      )
        .trim()
        .toLowerCase();
      const correctAnswer = question.answer.trim().toLowerCase();

      // Check main answer and alternatives
      const allCorrect = [
        correctAnswer,
        ...(question.alternatives || []).map((a) => a.trim().toLowerCase()),
      ];
      if (allCorrect.includes(studentAnswer)) {
        correct++;
      }
    }

    score = total > 0 ? Math.round((correct / total) * 100) : 0;
    gradedBy = "auto";
    status = "graded";
    feedback = `Você acertou ${correct} de ${total} preenchimentos.`;
  } else if (task.taskType === "writing") {
    // Attempt AI grading via Groq; fall back to teacher grading on failure
    try {
      const writingPrompt = task.questions
        ? JSON.parse(task.questions)
        : null;
      const promptText = writingPrompt?.prompt ?? task.description ?? "";
      const level = task.level ?? "beginner";

      const correction = await correctWriting(answers, promptText, level);

      score = Math.round(correction.score * 10); // Convert 0-10 to 0-100
      feedback = JSON.stringify(correction);
      gradedBy = "ai";
      status = "graded";
    } catch {
      // AI correction failed — leave for teacher manual grading
      score = null;
      gradedBy = null;
      status = "submitted";
      feedback = null;
    }
  }

  await db.insert(submissions).values({
    studentId: student.id,
    taskId,
    answers,
    score,
    feedback,
    gradedBy,
    status,
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);

  return { score, feedback, status };
}

"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { submitAnswers } from "@/lib/actions/student-submissions";
import type { FillGapQuestion } from "@/lib/validations/tasks";

interface FillGapsPlayerProps {
  questions: FillGapQuestion[];
  taskId: string;
  existingSubmission?: {
    answers: string | null;
    score: number | null;
    feedback: string | null;
    status: string;
  };
}

export function FillGapsPlayer({
  questions,
  taskId,
  existingSubmission,
}: FillGapsPlayerProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    feedback: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Show results if already submitted
  if (existingSubmission) {
    const savedAnswers: Record<string, string> = existingSubmission.answers
      ? JSON.parse(existingSubmission.answers)
      : {};

    return (
      <div className="space-y-6">
        <ScoreHeader
          score={existingSubmission.score}
          feedback={existingSubmission.feedback}
        />
        <div className="space-y-4">
          {questions.map((q) => {
            const studentAnswer = savedAnswers[String(q.number)] || "";
            const isCorrect = checkAnswer(studentAnswer, q);

            return (
              <Card key={q.number}>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-medium text-text-muted mt-1 shrink-0">
                      {q.number}.
                    </span>
                    <div className="flex-1 space-y-2">
                      <p className="text-text-primary">{q.text}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium border",
                            isCorrect
                              ? "bg-tarefas-bg border-success text-success"
                              : "bg-fora-bg border-error text-error line-through",
                          )}
                        >
                          {studentAnswer || "(sem resposta)"}
                        </span>
                        {!isCorrect && (
                          <span className="px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium bg-tarefas-bg border border-success text-success">
                            {q.answer}
                          </span>
                        )}
                        {isCorrect ? (
                          <CheckCircle2 size={16} className="text-success" />
                        ) : (
                          <XCircle size={16} className="text-error" />
                        )}
                      </div>
                      {q.explanation && !isCorrect && (
                        <p className="text-xs text-text-muted italic">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Submitted screen
  if (submitted && result) {
    return (
      <div className="space-y-6">
        <ScoreHeader score={result.score} feedback={result.feedback} />
        <div className="text-center">
          <a href="/tasks" className="text-sm text-aulas hover:underline">
            Voltar para tarefas
          </a>
        </div>
      </div>
    );
  }

  // Interactive fill gaps
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {questions.map((q) => {
          const studentAnswer = answers[q.number] || "";
          const isCorrect = checked ? checkAnswer(studentAnswer, q) : null;

          return (
            <Card key={q.number}>
              <CardContent>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-text-muted mt-1 shrink-0">
                    {q.number}.
                  </span>
                  <div className="flex-1 space-y-2">
                    <p className="text-text-primary">{q.text}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={studentAnswer}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.number]: e.target.value,
                          }))
                        }
                        disabled={checked}
                        placeholder="Sua resposta..."
                        className={cn(
                          "px-3 py-2 rounded-[var(--radius-sm)] bg-[#f8f9fb] border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-aulas transition-colors w-48",
                          checked &&
                            isCorrect &&
                            "border-success bg-tarefas-bg text-success font-medium",
                          checked &&
                            !isCorrect &&
                            "border-error bg-fora-bg text-error",
                          !checked && "border-border",
                        )}
                      />
                      {checked && isCorrect && (
                        <CheckCircle2 size={16} className="text-success" />
                      )}
                      {checked && !isCorrect && (
                        <>
                          <XCircle size={16} className="text-error" />
                          <span className="text-sm text-success font-medium">
                            {q.answer}
                          </span>
                        </>
                      )}
                    </div>
                    {checked && !isCorrect && q.explanation && (
                      <p className="text-xs text-text-muted italic">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end gap-3">
        {!checked ? (
          <Button
            onClick={() => setChecked(true)}
            disabled={Object.keys(answers).length === 0}
          >
            Verificar
          </Button>
        ) : (
          <Button
            loading={isPending}
            onClick={() => {
              startTransition(async () => {
                const answersMap: Record<string, string> = {};
                for (const [key, value] of Object.entries(answers)) {
                  answersMap[String(key)] = value;
                }
                const res = await submitAnswers(
                  taskId,
                  JSON.stringify(answersMap),
                );
                setResult({
                  score: res.score ?? 0,
                  feedback: res.feedback ?? "",
                });
                setSubmitted(true);
              });
            }}
          >
            <Send size={16} />
            Enviar
          </Button>
        )}
      </div>
    </div>
  );
}

function checkAnswer(answer: string, question: FillGapQuestion): boolean {
  const studentAnswer = answer.trim().toLowerCase();
  const correctAnswer = question.answer.trim().toLowerCase();
  const allCorrect = [
    correctAnswer,
    ...(question.alternatives || []).map((a) => a.trim().toLowerCase()),
  ];
  return allCorrect.includes(studentAnswer);
}

function ScoreHeader({
  score,
  feedback,
}: {
  score: number | null;
  feedback: string | null;
}) {
  const color =
    score !== null && score >= 80
      ? "text-success"
      : score !== null && score >= 60
        ? "text-warning"
        : "text-error";

  return (
    <Card>
      <CardContent>
        <div className="text-center py-6 space-y-3">
          <h2 className="text-xl font-bold font-display text-text-primary">
            Resultado
          </h2>
          {score !== null && (
            <p className={cn("text-5xl font-bold font-display", color)}>
              {score}%
            </p>
          )}
          {feedback && (
            <p className="text-sm text-text-secondary">{feedback}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

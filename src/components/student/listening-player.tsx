"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  RotateCcw,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { submitAnswers } from "@/lib/actions/student-submissions";
import type { QuizQuestion } from "@/lib/validations/tasks";

interface ListeningPlayerProps {
  task: {
    id: string;
    questions?: string | null;
  };
  existingSubmission?: {
    answers: string | null;
    score: number | null;
    feedback: string | null;
    status: string;
  };
}

interface ListeningData {
  text?: string;
  audioUrl?: string;
  questions?: QuizQuestion[];
}

export function ListeningPlayer({
  task,
  existingSubmission,
}: ListeningPlayerProps) {
  const parsed: ListeningData = task.questions
    ? JSON.parse(task.questions)
    : {};
  const audioUrl = parsed.audioUrl;
  const questions: QuizQuestion[] = parsed.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
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

        {audioUrl && (
          <Card>
            <CardContent>
              <AudioSection audioUrl={audioUrl} text={parsed.text} />
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {questions.map((q) => {
            const studentAnswer = savedAnswers[String(q.number)];
            const correctOption = q.options.find((o) => o.correct);
            const isCorrect = studentAnswer === correctOption?.letter;

            return (
              <Card key={q.number}>
                <CardContent>
                  <p className="font-medium text-text-primary mb-3">
                    {q.number}. {q.text}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.letter}
                        className={cn(
                          "px-4 py-2.5 rounded-[var(--radius-sm)] border text-sm",
                          opt.correct &&
                            "bg-tarefas-bg border-success text-success font-medium",
                          !opt.correct &&
                            studentAnswer === opt.letter &&
                            "bg-fora-bg border-error text-error",
                          !opt.correct &&
                            studentAnswer !== opt.letter &&
                            "border-border text-text-secondary",
                        )}
                      >
                        <span className="font-medium mr-2">{opt.letter})</span>
                        {opt.text}
                        {opt.correct && (
                          <CheckCircle2
                            size={14}
                            className="inline ml-2 text-success"
                          />
                        )}
                        {!opt.correct && studentAnswer === opt.letter && (
                          <XCircle
                            size={14}
                            className="inline ml-2 text-error"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  {q.explanation && !isCorrect && (
                    <p className="mt-2 text-xs text-text-muted italic">
                      {q.explanation}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // No audio and no questions
  if (!audioUrl && questions.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 space-y-3">
            <Headphones size={48} className="mx-auto text-text-muted" />
            <h2 className="text-lg font-bold font-display text-text-primary">
              Áudio em preparação
            </h2>
            <p className="text-sm text-text-secondary">
              O professor ainda está preparando o conteúdo de áudio para esta
              tarefa. Volte em breve!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Score screen after finishing
  if (finished) {
    if (result) {
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

    const correctCount = questions.filter((q) => {
      const correctOpt = q.options.find((o) => o.correct);
      return selectedAnswers[q.number] === correctOpt?.letter;
    }).length;
    const previewScore = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="animate-pop-in">
        <Card>
          <CardContent>
            <div className="text-center py-8 space-y-4">
              {previewScore >= 80 ? (
                <div className="space-y-2">
                  <Trophy size={48} className="mx-auto text-success" />
                  <h2 className="text-2xl font-bold font-display text-success">
                    Parabéns!
                  </h2>
                </div>
              ) : (
                <div className="space-y-2">
                  <RotateCcw size={48} className="mx-auto text-text-muted" />
                  <h2 className="text-2xl font-bold font-display text-text-primary">
                    Exercício finalizado
                  </h2>
                </div>
              )}

              <p
                className={cn(
                  "text-5xl font-bold font-display",
                  previewScore >= 80
                    ? "text-success"
                    : previewScore >= 60
                      ? "text-warning"
                      : "text-error",
                )}
              >
                {previewScore}%
              </p>

              <p className="text-text-secondary">
                Você acertou {correctCount} de {questions.length} questões.
              </p>

              <Button
                loading={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const answersMap: Record<string, string> = {};
                    for (const [key, value] of Object.entries(selectedAnswers)) {
                      answersMap[String(key)] = value;
                    }
                    const res = await submitAnswers(
                      task.id,
                      JSON.stringify(answersMap),
                    );
                    setResult({
                      score: res.score ?? 0,
                      feedback: res.feedback ?? "",
                    });
                  });
                }}
              >
                Enviar respostas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interactive listening quiz
  const question = questions[currentIndex];
  const selectedLetter = selectedAnswers[question?.number];
  const correctOption = question?.options.find((o) => o.correct);
  const isCorrect = selectedLetter === correctOption?.letter;
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="space-y-6">
      {/* Audio player */}
      {audioUrl && (
        <Card>
          <CardContent>
            <AudioSection audioUrl={audioUrl} text={parsed.text} />
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {questions.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-text-muted">
            <span>
              Questão {currentIndex + 1} de {questions.length}
            </span>
            <span>
              {Math.round(((currentIndex + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-challenges rounded-full transition-all duration-500"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Question */}
      {question && (
        <Card>
          <CardContent>
            <p className="font-medium text-text-primary text-lg mb-6">
              {question.number}. {question.text}
            </p>

            <div className="space-y-3">
              {question.options.map((opt) => {
                const isSelected = selectedLetter === opt.letter;
                const showCorrect = showFeedback && opt.correct;
                const showWrong = showFeedback && isSelected && !opt.correct;

                return (
                  <button
                    key={opt.letter}
                    disabled={showFeedback}
                    onClick={() => {
                      setSelectedAnswers((prev) => ({
                        ...prev,
                        [question.number]: opt.letter,
                      }));
                      setShowFeedback(true);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-[var(--radius-sm)] border transition-all text-sm",
                      !showFeedback &&
                        !isSelected &&
                        "border-border hover:border-challenges hover:bg-challenges-bg/50",
                      !showFeedback &&
                        isSelected &&
                        "border-challenges bg-challenges-bg",
                      showCorrect &&
                        "bg-tarefas-bg border-success text-success font-medium",
                      showWrong && "bg-fora-bg border-error text-error",
                      showFeedback &&
                        !showCorrect &&
                        !showWrong &&
                        "border-border text-text-muted",
                    )}
                  >
                    <span className="font-medium mr-2">{opt.letter})</span>
                    {opt.text}
                    {showCorrect && (
                      <CheckCircle2
                        size={14}
                        className="inline ml-2 text-success"
                      />
                    )}
                    {showWrong && (
                      <XCircle size={14} className="inline ml-2 text-error" />
                    )}
                  </button>
                );
              })}
            </div>

            {showFeedback && (
              <div
                className={cn(
                  "mt-4 p-3 rounded-[var(--radius-sm)] text-sm",
                  isCorrect
                    ? "bg-tarefas-bg text-tarefas"
                    : "bg-fora-bg text-fora",
                )}
              >
                {isCorrect ? (
                  <p className="font-medium">Correto!</p>
                ) : (
                  <p>
                    <span className="font-medium">Incorreto.</span> A resposta
                    correta é{" "}
                    <strong>
                      {correctOption?.letter}) {correctOption?.text}
                    </strong>
                  </p>
                )}
                {question.explanation && (
                  <p className="mt-1 text-xs opacity-80">
                    {question.explanation}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Next button */}
      {showFeedback && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              if (isLast) {
                setFinished(true);
              } else {
                setCurrentIndex((i) => i + 1);
                setShowFeedback(false);
              }
            }}
          >
            {isLast ? "Ver resultado" : "Próxima"}
            <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}

function AudioSection({
  audioUrl,
  text,
}: {
  audioUrl: string;
  text?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
        <Headphones size={16} className="text-challenges" />
        Ouça o áudio
      </div>
      <audio controls className="w-full" src={audioUrl}>
        Seu navegador não suporta o elemento de áudio.
      </audio>
      {text && (
        <p className="text-sm text-text-secondary italic">{text}</p>
      )}
    </div>
  );
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
          {score !== null && score >= 80 && (
            <Trophy size={40} className="mx-auto text-success" />
          )}
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

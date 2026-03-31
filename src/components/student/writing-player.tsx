"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Send, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitAnswers } from "@/lib/actions/student-submissions";
import { WritingFeedback } from "./writing-feedback";

interface WritingPlayerProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    questions?: string | null;
  };
  existingSubmission?: {
    answers: string | null;
    score: number | null;
    feedback: string | null;
    status: string;
  };
}

export function WritingPlayer({ task, existingSubmission }: WritingPlayerProps) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Parse writing prompt from questions JSON
  const prompt = task.questions ? JSON.parse(task.questions) : null;

  // Show results if already submitted
  if (existingSubmission) {
    const isGraded = existingSubmission.status === "graded";
    const score = existingSubmission.score;
    const hasStructuredFeedback =
      isGraded &&
      existingSubmission.feedback &&
      existingSubmission.feedback.startsWith("{");

    return (
      <div className="space-y-6">
        {hasStructuredFeedback ? (
          // AI-graded: show structured correction feedback
          <WritingFeedback feedback={existingSubmission.feedback!} />
        ) : (
          // Teacher-graded or awaiting grading
          <Card>
            <CardContent>
              <div className="text-center py-6 space-y-3">
                {isGraded ? (
                  <>
                    <CheckCircle2 size={40} className="mx-auto text-success" />
                    <h2 className="text-xl font-bold font-display text-text-primary">
                      Corrigido
                    </h2>
                    {score !== null && (
                      <p
                        className={cn(
                          "text-5xl font-bold font-display",
                          score >= 80
                            ? "text-success"
                            : score >= 60
                              ? "text-warning"
                              : "text-error",
                        )}
                      >
                        {score}%
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <Clock size={40} className="mx-auto text-challenges" />
                    <h2 className="text-xl font-bold font-display text-text-primary">
                      Enviado para correção
                    </h2>
                    <p className="text-sm text-text-secondary">
                      Aguarde a correção automática ou do professor.
                    </p>
                  </>
                )}
                {existingSubmission.feedback && !hasStructuredFeedback && (
                  <div className="mt-4 p-4 rounded-[var(--radius-sm)] bg-aulas-bg text-left">
                    <p className="text-xs font-medium text-aulas mb-1">
                      Feedback do professor
                    </p>
                    <p className="text-sm text-text-primary whitespace-pre-wrap">
                      {existingSubmission.feedback}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submitted text */}
        <Card>
          <CardContent>
            <p className="text-xs font-medium text-text-muted mb-2">
              Sua redação
            </p>
            <p className="text-sm text-text-primary whitespace-pre-wrap">
              {existingSubmission.answers || ""}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Submitted confirmation
  if (submitted) {
    return (
      <div className="animate-pop-in">
        <Card>
          <CardContent>
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 size={48} className="mx-auto text-success" />
              <h2 className="text-xl font-bold font-display text-text-primary">
                Redação enviada!
              </h2>
              <p className="text-sm text-text-secondary">
                Seu professor receberá sua redação e fará a correção.
              </p>
              <Link href="/tasks" className="text-sm text-aulas hover:underline">
                Voltar para tarefas
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Word counter
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      {/* Prompt / Instructions */}
      {(prompt || task.description) && (
        <Card>
          <CardContent>
            <h3 className="font-medium text-text-primary mb-2">Instruções</h3>
            {prompt?.prompt && (
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {prompt.prompt}
              </p>
            )}
            {prompt?.instructions && (
              <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">
                {prompt.instructions}
              </p>
            )}
            {!prompt && task.description && (
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {task.description}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Writing area */}
      <div>
        <Textarea
          label="Sua redação"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva sua resposta aqui..."
        />
        <p className="text-xs text-text-muted mt-1">
          {wordCount} {wordCount === 1 ? "palavra" : "palavras"}
        </p>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          loading={isPending}
          disabled={text.trim().length === 0}
          onClick={() => {
            startTransition(async () => {
              await submitAnswers(task.id, text);
              setSubmitted(true);
            });
          }}
        >
          <Send size={16} />
          Enviar para correção
        </Button>
      </div>
    </div>
  );
}

"use client";

import { CheckCircle2, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WritingCorrection } from "@/lib/services/ai/groq";

interface WritingFeedbackProps {
  feedback: string;
}

const typeLabelMap: Record<string, string> = {
  grammar: "Gramática",
  vocabulary: "Vocabulário",
  spelling: "Ortografia",
};

const typeBadgeColor: Record<string, string> = {
  grammar: "bg-challenges-bg text-challenges",
  vocabulary: "bg-aulas-bg text-aulas",
  spelling: "bg-fora-bg text-fora",
};

export function WritingFeedback({ feedback }: WritingFeedbackProps) {
  let correction: WritingCorrection;
  try {
    correction = JSON.parse(feedback);
  } catch {
    // Not a structured correction — show as plain text
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-text-primary whitespace-pre-wrap">
            {feedback}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Verify it has the expected structure
  if (typeof correction.score !== "number" || !correction.feedback) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-text-primary whitespace-pre-wrap">
            {feedback}
          </p>
        </CardContent>
      </Card>
    );
  }

  const scoreColor =
    correction.score >= 7
      ? "text-success"
      : correction.score >= 5
        ? "text-warning"
        : "text-error";

  const scoreLabel =
    correction.score >= 7
      ? "Bom trabalho!"
      : correction.score >= 5
        ? "Pode melhorar"
        : "Precisa de atenção";

  return (
    <div className="space-y-4">
      {/* Score & Feedback */}
      <Card>
        <CardContent>
          <div className="text-center py-4 space-y-2">
            <CheckCircle2 size={36} className="mx-auto text-success" />
            <h2 className="text-lg font-bold font-display text-text-primary">
              Correção por IA
            </h2>
            <p className={cn("text-5xl font-bold font-display", scoreColor)}>
              {correction.score.toFixed(1)}
            </p>
            <p className={cn("text-sm font-medium", scoreColor)}>
              {scoreLabel}
            </p>
          </div>
          <div className="mt-3 p-3 rounded-[var(--radius-sm)] bg-aulas-bg">
            <p className="text-sm text-text-primary whitespace-pre-wrap">
              {correction.feedback}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error list */}
      {correction.errors && correction.errors.length > 0 && (
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-warning" />
              <h3 className="font-medium text-text-primary">
                Correções ({correction.errors.length})
              </h3>
            </div>
            <div className="space-y-3">
              {correction.errors.map((error, i) => (
                <div
                  key={i}
                  className="p-3 rounded-[var(--radius-sm)] bg-surface-secondary"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase px-2 py-0.5 rounded-full",
                        typeBadgeColor[error.type] ?? "bg-surface-tertiary text-text-muted",
                      )}
                    >
                      {typeLabelMap[error.type] ?? error.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="line-through text-error font-medium">
                      {error.original}
                    </span>
                    <ArrowRight size={14} className="text-text-muted shrink-0" />
                    <span className="text-success font-medium">
                      {error.correction}
                    </span>
                  </div>
                  {error.explanation && (
                    <p className="text-xs text-text-secondary mt-1.5">
                      {error.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {correction.tips && correction.tips.length > 0 && (
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={18} className="text-challenges" />
              <h3 className="font-medium text-text-primary">
                Dicas para melhorar
              </h3>
            </div>
            <ul className="space-y-2">
              {correction.tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-text-secondary"
                >
                  <span className="text-challenges font-bold mt-0.5">
                    {i + 1}.
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

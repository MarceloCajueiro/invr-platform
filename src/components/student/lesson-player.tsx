"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichContent } from "@/components/ui/rich-content";
import { updateLessonProgress } from "@/lib/actions/student-progress";

const categoryLabels: Record<string, string> = {
  conversation: "Conversação",
  grammar: "Gramática",
  vocabulary: "Vocabulário",
  listening: "Listening",
  culture: "Cultura",
};

const categoryBadgeVariant: Record<string, BadgeVariant> = {
  conversation: "aulas",
  grammar: "tarefas",
  vocabulary: "fora",
  listening: "challenges",
  culture: "default",
};

interface LessonPlayerProps {
  lesson: {
    id: string;
    title: string;
    content?: string | null;
    category: string;
    durationMinutes?: number | null;
  };
  initialProgress: number;
}

export function LessonPlayer({ lesson, initialProgress }: LessonPlayerProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [isPending, startTransition] = useTransition();

  function handleToggleWatched() {
    const newProgress = progress >= 100 ? 0 : 100;
    startTransition(async () => {
      await updateLessonProgress(lesson.id, newProgress);
      setProgress(newProgress);
    });
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant={categoryBadgeVariant[lesson.category] || "default"}>
            {categoryLabels[lesson.category] || lesson.category}
          </Badge>
          <h1 className="text-xl font-display font-bold text-text-primary">
            {lesson.title}
          </h1>
          {lesson.durationMinutes && (
            <p className="text-sm text-text-muted">{lesson.durationMinutes} min</p>
          )}
        </div>

        <Button
          onClick={handleToggleWatched}
          loading={isPending}
          variant={progress >= 100 ? "success" : "primary"}
          size="sm"
          className="shrink-0"
        >
          <Check size={14} />
          {progress >= 100 ? "Assistida" : "Marcar como assistida"}
        </Button>
      </div>

      {lesson.content && <RichContent content={lesson.content} />}
    </div>
  );
}

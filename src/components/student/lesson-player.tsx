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

  function handleMarkWatched() {
    startTransition(async () => {
      await updateLessonProgress(lesson.id, 100);
      setProgress(100);
    });
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="space-y-3">
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

      {progress < 100 ? (
        <Button
          onClick={handleMarkWatched}
          loading={isPending}
          variant="primary"
          size="md"
        >
          <Check size={16} />
          Marcar como assistida
        </Button>
      ) : (
        <div className="flex items-center gap-2 text-success text-sm font-medium">
          <Check size={16} />
          Aula assistida
        </div>
      )}

      {lesson.content && <RichContent content={lesson.content} />}
    </div>
  );
}

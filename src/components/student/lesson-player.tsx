"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Download, FileText, Headphones } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

interface LessonPlayerProps {
  lesson: {
    id: string;
    title: string;
    description?: string | null;
    category: string;
    videoUrl?: string | null;
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

  function renderVideo() {
    if (!lesson.videoUrl) return null;

    const youtubeId = extractYouTubeId(lesson.videoUrl);
    if (youtubeId) {
      return (
        <div className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      );
    }

    const vimeoId = extractVimeoId(lesson.videoUrl);
    if (vimeoId) {
      return (
        <div className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden bg-black">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            title={lesson.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      );
    }

    // Fallback: direct video URL
    return (
      <div className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden bg-black">
        <video
          src={lesson.videoUrl}
          controls
          className="w-full h-full"
          title={lesson.title}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Video */}
      {renderVideo()}

      {/* Header */}
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

      {/* Progress action */}
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

      {/* Description */}
      {lesson.description && (
        <div className="prose prose-sm max-w-none text-text-secondary">
          <ReactMarkdown>{lesson.description}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

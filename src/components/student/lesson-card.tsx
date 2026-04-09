import Link from "next/link";
import Image from "next/image";
import { Clock, PlayCircle } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

const categoryPlaceholderColors: Record<string, string> = {
  conversation: "bg-gradient-to-br from-aulas-light to-aulas-bg",
  grammar: "bg-gradient-to-br from-tarefas-light to-tarefas-bg",
  vocabulary: "bg-gradient-to-br from-fora-light to-fora-bg",
  listening: "bg-gradient-to-br from-challenges-light to-challenges-bg",
  culture: "bg-gradient-to-br from-gray-200 to-gray-100",
};

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    category: string;
    coverImageUrl?: string | null;
    durationMinutes?: number | null;
  };
  progress?: number;
  index?: number;
  href?: string;
}

export function LessonCard({ lesson, progress = 0, index = 0, href }: LessonCardProps) {
  return (
    <Link href={href ?? `/lessons/${lesson.id}`}>
      <Card
        hoverable
        className="animate-slide-up overflow-hidden"
        style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
      >
        <div className="flex">
          {/* Thumbnail */}
          <div className="relative w-24 sm:w-40 min-h-24 shrink-0">
            {lesson.coverImageUrl ? (
              <Image
                src={lesson.coverImageUrl}
                alt={lesson.title}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 640px) 96px, 160px"
              />
            ) : (
              <div
                className={cn(
                  "w-full h-full flex items-center justify-center",
                  categoryPlaceholderColors[lesson.category] || "bg-gray-100",
                )}
              >
                <PlayCircle
                  size={32}
                  className="text-text-muted opacity-50"
                />
              </div>
            )}
            {progress >= 90 && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white text-xs font-medium bg-success px-2 py-0.5 rounded-full">
                  Assistida
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 p-4 flex flex-col justify-center gap-1.5 items-start">
            <Badge variant={categoryBadgeVariant[lesson.category] || "default"}>
              {categoryLabels[lesson.category] || lesson.category}
            </Badge>
            <h3 className="font-medium text-text-primary line-clamp-2">
              {lesson.title}
            </h3>
            {lesson.durationMinutes && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Clock size={12} />
                <span>{lesson.durationMinutes} min</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {progress > 0 && (
          <div className="h-1 bg-border">
            <div
              className="h-full bg-aulas rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </Card>
    </Link>
  );
}

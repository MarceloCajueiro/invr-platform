import { BookOpen } from "lucide-react";
import { getStudent } from "@/lib/auth/get-student";
import { getStudentLessons } from "@/lib/queries/student-lessons";
import { getDb } from "@/lib/db";
import { lessonProgresses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { LessonCard } from "@/components/student/lesson-card";
import Link from "next/link";
import { cn } from "@/lib/utils";

const categories = [
  { value: "all", label: "Todas" },
  { value: "conversation", label: "Conversação", variant: "aulas" as BadgeVariant },
  { value: "grammar", label: "Gramática", variant: "tarefas" as BadgeVariant },
  { value: "vocabulary", label: "Vocabulário", variant: "fora" as BadgeVariant },
  { value: "listening", label: "Listening", variant: "challenges" as BadgeVariant },
  { value: "culture", label: "Cultura", variant: "default" as BadgeVariant },
];

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { student } = await getStudent();
  const lessons = await getStudentLessons(student.teacherId, student.id);

  const db = getDb();
  const progresses = await db
    .select()
    .from(lessonProgresses)
    .where(eq(lessonProgresses.studentId, student.id));

  const progressMap = new Map(
    progresses.map((p) => [p.lessonId, p.progress]),
  );

  const params = await searchParams;
  const activeCategory = params.category || "all";

  const filteredLessons =
    activeCategory === "all"
      ? lessons
      : lessons.filter((l) => l.category === activeCategory);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Aulas"
        description="Acompanhe suas aulas e progresso"
      />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.value;
          return (
            <Link
              key={cat.value}
              href={
                cat.value === "all"
                  ? "/lessons"
                  : `/lessons?category=${cat.value}`
              }
            >
              <Badge
                variant={isActive ? (cat.variant || "aulas") : "default"}
                className={cn(
                  "cursor-pointer transition-all text-sm px-3 py-1",
                  isActive && "ring-1 ring-aulas/30",
                )}
              >
                {cat.label}
              </Badge>
            </Link>
          );
        })}
      </div>

      {filteredLessons.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhuma aula disponível"
          description={
            activeCategory !== "all"
              ? "Não há aulas nesta categoria ainda."
              : "Seu professor ainda não publicou aulas. Volte em breve!"
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredLessons.map((lesson, i) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              progress={progressMap.get(lesson.id) ?? 0}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

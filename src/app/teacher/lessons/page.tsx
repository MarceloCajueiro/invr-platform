import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getLessons } from "@/lib/queries/lessons";
import { getTurmasForSelector } from "@/lib/queries/turmas";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LessonFilters } from "@/components/teacher/lesson-filters";
import { LessonList } from "@/components/teacher/lesson-list";
import { LessonCard } from "@/components/student/lesson-card";
import { DraftOverlay } from "@/components/teacher/draft-overlay";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";

interface LessonsPageProps {
  searchParams: Promise<{ status?: string; category?: string; turmaId?: string; preview?: string }>;
}

export default async function LessonsPage({ searchParams }: LessonsPageProps) {
  const { teacher } = await getTeacher();
  const filters = await searchParams;
  const preview = isPreviewMode(filters);
  const [lessons, turmasOptions] = await Promise.all([
    getLessons(teacher.id, filters),
    getTurmasForSelector(teacher.id),
  ]);

  if (preview) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Aulas"
          description="Acompanhe suas aulas e progresso"
        />

        {lessons.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nenhuma aula disponível"
            description="Seu professor ainda não publicou aulas. Volte em breve!"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {lessons.map((lesson, i) => (
              <DraftOverlay key={lesson.id} isDraft={lesson.status === "draft"}>
                <LessonCard
                  lesson={lesson}
                  progress={0}
                  index={i}
                  href={previewHref(`/teacher/lessons/${lesson.id}/edit`, filters)}
                />
              </DraftOverlay>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Aulas"
        description="Gerencie suas aulas e conteúdos."
        action={
          <Link href="/teacher/lessons/new">
            <Button>
              <Plus size={16} />
              Nova Aula
            </Button>
          </Link>
        }
      />

      <LessonFilters turmas={turmasOptions} />

      <LessonList lessons={lessons} />
    </div>
  );
}

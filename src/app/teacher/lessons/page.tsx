import Link from "next/link";
import { Plus } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getLessons } from "@/lib/queries/lessons";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { LessonFilters } from "@/components/teacher/lesson-filters";
import { LessonList } from "@/components/teacher/lesson-list";

interface LessonsPageProps {
  searchParams: Promise<{ status?: string; category?: string }>;
}

export default async function LessonsPage({ searchParams }: LessonsPageProps) {
  const { teacher } = await getTeacher();
  const filters = await searchParams;
  const lessons = await getLessons(teacher.id, filters);

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

      <LessonFilters />

      <LessonList lessons={lessons} />
    </div>
  );
}

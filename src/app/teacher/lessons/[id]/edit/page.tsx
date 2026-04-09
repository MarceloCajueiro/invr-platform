import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getLesson } from "@/lib/queries/lessons";
import { updateLesson } from "@/lib/actions/lessons";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { LessonForm } from "@/components/teacher/lesson-form";
import { LessonPlayer } from "@/components/student/lesson-player";
import { getTurmasForSelector, getLessonTurmaIds } from "@/lib/queries/turmas";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";

interface EditLessonPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function EditLessonPage({ params, searchParams }: EditLessonPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;
  const sp = await searchParams;

  const lesson = await getLesson(id, teacher.id);
  if (!lesson) redirect("/teacher/lessons");

  if (isPreviewMode(sp)) {
    return (
      <div className="animate-fade-in max-w-2xl">
        <Link
          href={previewHref("/teacher/lessons", sp)}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Voltar para aulas
        </Link>

        {lesson.status === "draft" && (
          <div className="mb-4">
            <Badge variant="info">Não visível para alunos</Badge>
          </div>
        )}

        <LessonPlayer
          lesson={lesson}
          initialProgress={0}
          readOnly
        />
      </div>
    );
  }

  const [turmas, selectedTurmaIds] = await Promise.all([
    getTurmasForSelector(teacher.id),
    getLessonTurmaIds(lesson.id),
  ]);

  const updateLessonWithId = updateLesson.bind(null, lesson.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader
        title="Editar Aula"
        description={`Editando: ${lesson.title}`}
      />
      <LessonForm
        lesson={lesson}
        action={updateLessonWithId}
        turmas={turmas}
        selectedTurmaIds={selectedTurmaIds}
      />
    </div>
  );
}

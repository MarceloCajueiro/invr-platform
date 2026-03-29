import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getLesson } from "@/lib/queries/lessons";
import { updateLesson } from "@/lib/actions/lessons";
import { PageHeader } from "@/components/ui/page-header";
import { LessonForm } from "@/components/teacher/lesson-form";

interface EditLessonPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;

  const lesson = await getLesson(id, teacher.id);
  if (!lesson) redirect("/lessons");

  const updateLessonWithId = updateLesson.bind(null, lesson.id);

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title="Editar Aula"
        description={`Editando: ${lesson.title}`}
      />
      <LessonForm lesson={lesson} action={updateLessonWithId} />
    </div>
  );
}

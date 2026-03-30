import { getTeacher } from "@/lib/auth/get-teacher";
import { PageHeader } from "@/components/ui/page-header";
import { LessonForm } from "@/components/teacher/lesson-form";
import { createLesson } from "@/lib/actions/lessons";

export default async function NewLessonPage() {
  await getTeacher();

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Nova Aula" description="Preencha os dados da nova aula." />
      <LessonForm action={createLesson} />
    </div>
  );
}

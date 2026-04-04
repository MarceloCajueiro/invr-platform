import { getTeacher } from "@/lib/auth/get-teacher";
import { PageHeader } from "@/components/ui/page-header";
import { LessonForm } from "@/components/teacher/lesson-form";
import { createLesson } from "@/lib/actions/lessons";
import { getTurmasForSelector } from "@/lib/queries/turmas";

export default async function NewLessonPage() {
  const { teacher } = await getTeacher();
  const turmas = await getTurmasForSelector(teacher.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader title="Nova Aula" description="Preencha os dados da nova aula." />
      <LessonForm action={createLesson} turmas={turmas} />
    </div>
  );
}

import { getTeacher } from "@/lib/auth/get-teacher";
import { PageHeader } from "@/components/ui/page-header";
import { TaskForm } from "@/components/teacher/task-form";
import { createTask } from "@/lib/actions/tasks";
import { getTurmasForSelector } from "@/lib/queries/turmas";

export default async function NewTaskPage() {
  const { teacher } = await getTeacher();
  const turmas = await getTurmasForSelector(teacher.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader title="Nova Tarefa" description="Preencha os dados da nova tarefa." />
      <TaskForm action={createTask} turmas={turmas} />
    </div>
  );
}

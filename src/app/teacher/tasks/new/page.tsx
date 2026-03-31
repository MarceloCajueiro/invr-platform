import { getTeacher } from "@/lib/auth/get-teacher";
import { PageHeader } from "@/components/ui/page-header";
import { TaskForm } from "@/components/teacher/task-form";
import { createTask } from "@/lib/actions/tasks";

export default async function NewTaskPage() {
  await getTeacher();

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader title="Nova Tarefa" description="Preencha os dados da nova tarefa." />
      <TaskForm action={createTask} />
    </div>
  );
}

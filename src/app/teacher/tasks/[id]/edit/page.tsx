import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getTask } from "@/lib/queries/tasks";
import { updateTask } from "@/lib/actions/tasks";
import { PageHeader } from "@/components/ui/page-header";
import { TaskForm } from "@/components/teacher/task-form";

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;

  const task = await getTask(id, teacher.id);
  if (!task) redirect("/teacher/tasks");

  const updateTaskWithId = updateTask.bind(null, task.id);

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title="Editar Tarefa"
        description={`Editando: ${task.title}`}
      />
      <TaskForm task={task} action={updateTaskWithId} />
    </div>
  );
}

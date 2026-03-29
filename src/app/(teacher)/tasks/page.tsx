import Link from "next/link";
import { Plus } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getTasks } from "@/lib/queries/tasks";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { TaskFilters } from "@/components/teacher/task-filters";
import { TaskList } from "@/components/teacher/task-list";

interface TasksPageProps {
  searchParams: Promise<{ status?: string; taskType?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { teacher } = await getTeacher();
  const filters = await searchParams;
  const tasks = await getTasks(teacher.id, filters);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tarefas"
        description="Gerencie suas tarefas e exercicios."
        action={
          <Link href="/tasks/new">
            <Button>
              <Plus size={16} />
              Nova Tarefa
            </Button>
          </Link>
        }
      />

      <TaskFilters />

      <TaskList tasks={tasks} />
    </div>
  );
}

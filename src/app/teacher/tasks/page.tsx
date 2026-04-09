import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getTasks } from "@/lib/queries/tasks";
import { getTurmasForSelector } from "@/lib/queries/turmas";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskFilters } from "@/components/teacher/task-filters";
import { TaskList } from "@/components/teacher/task-list";
import { TaskCard } from "@/components/student/task-card";
import { DraftOverlay } from "@/components/teacher/draft-overlay";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";

interface TasksPageProps {
  searchParams: Promise<{ status?: string; taskType?: string; turmaId?: string; preview?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { teacher } = await getTeacher();
  const filters = await searchParams;
  const preview = isPreviewMode(filters);
  const [tasks, turmasOptions] = await Promise.all([
    getTasks(teacher.id, filters),
    getTurmasForSelector(teacher.id),
  ]);

  if (preview) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Tarefas"
          description="Complete as atividades do seu professor"
        />

        {tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Nenhuma tarefa disponível"
            description="Seu professor ainda não publicou tarefas. Volte em breve!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((task, i) => (
              <DraftOverlay key={task.id} isDraft={task.status === "draft"}>
                <TaskCard
                  task={task}
                  index={i}
                  href={previewHref(`/teacher/tasks/${task.id}/edit`, filters)}
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
        title="Tarefas"
        description="Gerencie suas tarefas e exercicios."
        action={
          <Link href="/teacher/tasks/new">
            <Button>
              <Plus size={16} />
              Nova Tarefa
            </Button>
          </Link>
        }
      />

      <TaskFilters turmas={turmasOptions} />

      <TaskList tasks={tasks} />
    </div>
  );
}

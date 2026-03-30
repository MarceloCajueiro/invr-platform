import { ClipboardList } from "lucide-react";
import { getStudent } from "@/lib/auth/get-student";
import { getStudentTasks } from "@/lib/queries/student-tasks";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskCard } from "@/components/student/task-card";

export default async function TasksPage() {
  const { student } = await getStudent();
  const tasks = await getStudentTasks(student.teacherId, student.id);

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
            <TaskCard
              key={task.id}
              task={task}
              submission={task.submission}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

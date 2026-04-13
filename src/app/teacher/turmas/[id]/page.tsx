import { redirect } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import {
  getTurma,
  getTurmaMembers,
  getTurmaLessons,
  getTurmaTasks,
  getAvailableLessons,
  getAvailableTasks,
  getPendingInvites,
  getAvailableStudentsForTurma,
} from "@/lib/queries/turmas";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { TurmaDetail } from "@/components/teacher/turma-detail";
import { TurmaInviteCode } from "@/components/teacher/turma-invite-code";

interface TurmaDetailPageProps {
  params: Promise<{ id: string }>;
}

const levelLabels: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export default async function TurmaDetailPage({
  params,
}: TurmaDetailPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;

  const turma = await getTurma(id, teacher.id);
  if (!turma) redirect("/teacher/turmas");

  const [members, linkedLessons, linkedTasks, availableLessons, availableTasks, pendingInvites, availableStudents] =
    await Promise.all([
      getTurmaMembers(turma.id),
      getTurmaLessons(turma.id, teacher.id),
      getTurmaTasks(turma.id, teacher.id),
      getAvailableLessons(teacher.id, turma.id),
      getAvailableTasks(teacher.id, turma.id),
      getPendingInvites(turma.id),
      getAvailableStudentsForTurma(turma.id, teacher.id),
    ]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={turma.name}
        description={turma.description || undefined}
        action={
          <div className="flex items-center gap-3">
            {turma.level && (
              <Badge variant={turma.level}>{levelLabels[turma.level]}</Badge>
            )}
            <TurmaInviteCode code={turma.inviteCode} />
          </div>
        }
      />

      <TurmaDetail
        turmaId={turma.id}
        members={members}
        pendingInvites={pendingInvites}
        availableStudents={availableStudents}
        linkedLessons={linkedLessons}
        linkedTasks={linkedTasks}
        availableLessons={availableLessons}
        availableTasks={availableTasks}
        settings={{
          id: turma.id,
          name: turma.name,
          description: turma.description,
          color: turma.color,
          level: turma.level,
          notifyNewLesson: turma.notifyNewLesson,
          notifyNewTask: turma.notifyNewTask,
        }}
      />
    </div>
  );
}

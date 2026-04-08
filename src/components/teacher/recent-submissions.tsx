import { Inbox } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { RecentSubmission } from "@/lib/queries/dashboard";

const statusConfig: Record<
  RecentSubmission["status"],
  { label: string; variant: BadgeVariant }
> = {
  in_progress: { label: "Em andamento", variant: "draft" },
  submitted: { label: "Pendente", variant: "aulas" },
  graded: { label: "Avaliado", variant: "tarefas" },
};

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export interface RecentSubmissionsProps {
  submissions: RecentSubmission[];
}

export function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-text-primary font-display">
          Submissões recentes
        </h2>
      </CardHeader>
      <CardContent className="p-0">
        {submissions.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nenhuma submissão ainda"
            description="Quando seus alunos enviarem tarefas, elas aparecerão aqui."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-3 sm:px-6 py-3 text-text-secondary font-medium">
                    Aluno
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-text-secondary font-medium">
                    Tarefa
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-text-secondary font-medium">
                    Nota
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-text-secondary font-medium">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-text-secondary font-medium hidden sm:table-cell">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => {
                  const status = statusConfig[sub.status];
                  return (
                    <tr
                      key={sub.id}
                      className="border-b border-border last:border-b-0 hover:bg-bg-light transition-colors"
                    >
                      <td className="px-3 sm:px-6 py-3 text-text-primary font-medium">
                        {sub.studentName}
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-text-secondary">
                        {sub.taskTitle}
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-text-primary">
                        {sub.score !== null ? `${sub.score}%` : "-"}
                      </td>
                      <td className="px-3 sm:px-6 py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-text-secondary hidden sm:table-cell">
                        {formatDate(sub.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

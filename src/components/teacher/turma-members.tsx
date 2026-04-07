import { Users, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { removeStudentFromTurma } from "@/lib/actions/turmas";
import { AddStudentToTurma } from "@/components/teacher/add-student-to-turma";

interface Member {
  studentId: string;
  userName: string;
  userEmail: string;
  joinedAt: Date;
}

interface PendingInvite {
  id: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

interface AvailableStudent {
  id: string;
  name: string;
  email: string;
}

interface TurmaMembersProps {
  turmaId: string;
  members: Member[];
  pendingInvites: PendingInvite[];
  availableStudents: AvailableStudent[];
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours <= 0) return "Expirado";
  if (diffHours < 24) return `Expira em ${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  return `Expira em ${diffDays}d`;
}

export function TurmaMembers({
  turmaId,
  members,
  pendingInvites,
  availableStudents,
}: TurmaMembersProps) {
  return (
    <div className="space-y-6">
      {/* Add student button */}
      <div className="flex justify-end">
        <AddStudentToTurma
          turmaId={turmaId}
          availableStudents={availableStudents}
        />
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
            <Clock size={14} />
            Convites pendentes
          </h3>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)] bg-warning-bg/50 border border-warning/10"
              >
                <p className="text-sm text-text-secondary flex-1">
                  {invite.email}
                </p>
                <Badge variant="draft">{formatRelativeDate(invite.expiresAt)}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members table */}
      {members.length === 0 && pendingInvites.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum aluno na turma"
          description="Convide alunos na página de Alunos ou adicione alunos existentes."
        />
      ) : members.length === 0 ? null : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-text-muted">
                  Aluno
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-muted">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.studentId}
                  className="border-b border-border last:border-0 hover:bg-bg-light transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-text-primary">
                        {member.userName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {member.userEmail}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <form action={removeStudentFromTurma}>
                      <input type="hidden" name="turmaId" value={turmaId} />
                      <input
                        type="hidden"
                        name="studentId"
                        value={member.studentId}
                      />
                      <Button variant="danger" size="sm" type="submit">
                        <Trash2 size={14} />
                        Remover
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { removeStudentFromTurma } from "@/lib/actions/turmas";

interface Member {
  studentId: string;
  userName: string;
  userEmail: string;
  joinedAt: Date;
}

interface TurmaMembersProps {
  turmaId: string;
  members: Member[];
}

export function TurmaMembers({ turmaId, members }: TurmaMembersProps) {
  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum aluno na turma"
        description="Compartilhe o código de convite para que alunos possam entrar."
      />
    );
  }

  return (
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
                  <p className="text-xs text-text-muted">{member.userEmail}</p>
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
  );
}

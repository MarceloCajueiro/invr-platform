import Link from "next/link";
import { GraduationCap, Users } from "lucide-react";
import { getStudent } from "@/lib/auth/get-student";
import { getStudentProfile } from "@/lib/queries/student-profile";
import { getMyTurmas } from "@/lib/queries/student-turmas";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { TurmaCard } from "@/components/student/turma-card";
import { ProfileUserCard } from "@/components/student/profile-user-card";

export default async function ProfilePage() {
  const { user, student } = await getStudent();
  const [profile, turmas] = await Promise.all([
    getStudentProfile(student.id),
    getMyTurmas(student.id),
  ]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Meu Perfil" />

      {/* User data + logout */}
      <ProfileUserCard userName={user.name} userEmail={user.email} />

      {/* Teacher */}
      <Card>
        <CardContent className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-aulas-bg flex items-center justify-center shrink-0">
            <GraduationCap size={20} className="text-aulas" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">Professor(a)</p>
            <p className="font-medium text-text-primary">{profile.teacherName}</p>
          </div>
        </CardContent>
      </Card>

      {/* Turmas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-display text-text-primary">
            Minhas Turmas
          </h2>
          <Link href="/turmas/join">
            <Button variant="ghost" size="sm">
              Entrar em uma Turma
            </Button>
          </Link>
        </div>

        {turmas.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhuma turma"
            description="Você ainda não faz parte de nenhuma turma. Peça o código de convite ao seu professor!"
            action={
              <Link href="/turmas/join">
                <Button>Entrar em uma Turma</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {turmas.map((turma) => (
              <TurmaCard key={turma.id} turma={turma} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

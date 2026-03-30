import { Users, BookOpen, ClipboardList, Clock } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getDashboardKPIs, getRecentSubmissions } from "@/lib/queries/dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/teacher/kpi-card";
import { RecentSubmissions } from "@/components/teacher/recent-submissions";

export default async function DashboardPage() {
  const { user, teacher } = await getTeacher();
  const [kpis, recentSubmissions] = await Promise.all([
    getDashboardKPIs(teacher.id),
    getRecentSubmissions(teacher.id),
  ]);

  const firstName = user.name.split(" ")[0];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description={`Olá, ${firstName}! Aqui está o resumo da sua plataforma.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Alunos"
          value={kpis.students}
          icon={Users}
          color="aulas"
        />
        <KpiCard
          title="Aulas publicadas"
          value={kpis.lessons}
          icon={BookOpen}
          color="tarefas"
        />
        <KpiCard
          title="Tarefas publicadas"
          value={kpis.tasks}
          icon={ClipboardList}
          color="challenges"
        />
        <KpiCard
          title="Pendentes de correção"
          value={kpis.pendingSubmissions}
          icon={Clock}
          color="fora"
        />
      </div>

      <RecentSubmissions submissions={recentSubmissions} />
    </div>
  );
}

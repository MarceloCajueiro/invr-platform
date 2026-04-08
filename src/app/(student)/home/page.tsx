import { BookOpen, ClipboardList, FileText } from "lucide-react";
import { getStudent } from "@/lib/auth/get-student";
import {
  getHomeStats,
  getRecentActivity,
} from "@/lib/queries/student-home";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProgressRing } from "@/components/student/progress-ring";
import { ChannelCard } from "@/components/student/channel-card";
import { ActivityFeed } from "@/components/student/activity-feed";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function HomePage() {
  const { user, student } = await getStudent();
  const [stats, activities] = await Promise.all([
    getHomeStats(student.id, student.teacherId),
    getRecentActivity(student.id),
  ]);

  const firstName = user.name.split(" ")[0];
  const progressPercent =
    stats.totalLessons > 0
      ? Math.round((stats.watchedLessons / stats.totalLessons) * 100)
      : 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Greeting + Progress */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <ProgressRing percentage={progressPercent} />
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-display">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-text-secondary mt-1">
            {stats.watchedLessons} de {stats.totalLessons} aulas assistidas
          </p>

        </div>
      </div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <ChannelCard
          channel="aulas"
          title="Aulas"
          count={stats.totalLessons}
          subtitle={`${stats.watchedLessons} assistidas`}
          href="/lessons"
          icon={BookOpen}
        />
        <ChannelCard
          channel="tarefas"
          title="Tarefas"
          count={stats.totalTasks}
          subtitle={`${stats.completedTasks} completas`}
          href="/tasks"
          icon={ClipboardList}
        />
        <ChannelCard
          channel="fora"
          title="Blog"
          count="Novo"
          subtitle="Dicas e conteúdo"
          href="/blog"
          icon={FileText}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold font-display text-text-primary">
            Atividade recente
          </h2>
        </CardHeader>
        <CardContent>
          <ActivityFeed activities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}

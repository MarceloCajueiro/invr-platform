import type { RecentActivityItem } from "@/lib/queries/student-home";

interface ActivityFeedProps {
  activities: RecentActivityItem[];
}

function formatRelativeDate(date: Date | null): string {
  if (!date) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        <p className="text-sm">Nenhuma atividade recente.</p>
        <p className="text-xs mt-1">
          Assista aulas ou envie tarefas para ver sua atividade aqui.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {activities.map((activity) => (
        <li key={activity.id} className="flex items-center gap-3 py-3">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              activity.type === "submission" ? "bg-tarefas" : "bg-aulas"
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate">
              {activity.title}
            </p>
            <p className="text-xs text-text-muted">
              {activity.type === "submission"
                ? "Tarefa enviada"
                : "Aula assistida"}
            </p>
          </div>
          <span className="text-xs text-text-muted whitespace-nowrap">
            {formatRelativeDate(activity.date)}
          </span>
        </li>
      ))}
    </ul>
  );
}

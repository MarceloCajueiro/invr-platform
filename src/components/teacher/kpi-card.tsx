import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const colorMap = {
  aulas: {
    border: "border-l-aulas",
    bg: "bg-aulas-bg",
    text: "text-aulas",
  },
  tarefas: {
    border: "border-l-tarefas",
    bg: "bg-tarefas-bg",
    text: "text-tarefas",
  },
  fora: {
    border: "border-l-fora",
    bg: "bg-fora-bg",
    text: "text-fora",
  },
  challenges: {
    border: "border-l-challenges",
    bg: "bg-challenges-bg",
    text: "text-challenges",
  },
} as const;

export type KpiColor = keyof typeof colorMap;

export interface KpiCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: KpiColor;
}

export function KpiCard({ title, value, icon: Icon, color }: KpiCardProps) {
  const colors = colorMap[color];

  return (
    <Card className={`border-l-4 ${colors.border}`}>
      <CardContent className="flex items-center gap-4 py-5">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-[var(--radius-md)] ${colors.bg}`}
        >
          <Icon size={24} className={colors.text} />
        </div>
        <div>
          <p className="text-3xl font-bold text-text-primary">{value}</p>
          <p className="text-sm text-text-secondary">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

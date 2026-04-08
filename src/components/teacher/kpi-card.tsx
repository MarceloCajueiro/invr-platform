import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const colorMap = {
  aulas: {
    bg: "bg-aulas-bg",
    text: "text-aulas",
  },
  tarefas: {
    bg: "bg-tarefas-bg",
    text: "text-tarefas",
  },
  fora: {
    bg: "bg-fora-bg",
    text: "text-fora",
  },
  challenges: {
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
    <Card className={colors.bg}>
      <CardContent className="py-5 px-5">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon size={16} className={colors.text} />
          <p className="text-sm font-medium text-text-secondary">{title}</p>
        </div>
        <p className="text-3xl font-bold font-display text-text-primary">{value}</p>
      </CardContent>
    </Card>
  );
}

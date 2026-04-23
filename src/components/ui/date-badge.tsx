import { cn } from "@/lib/utils";

export type DateBadgeChannel = "aulas" | "tarefas" | "fora" | "challenges" | "neutral";

const channelStyles: Record<
  DateBadgeChannel,
  { bg: string; border: string; day: string; month: string }
> = {
  aulas: {
    bg: "bg-aulas-bg",
    border: "border-aulas/20",
    day: "text-aulas-shadow",
    month: "text-aulas",
  },
  tarefas: {
    bg: "bg-tarefas-bg",
    border: "border-tarefas/20",
    day: "text-tarefas-shadow",
    month: "text-tarefas",
  },
  fora: {
    bg: "bg-fora-bg",
    border: "border-fora/20",
    day: "text-fora-shadow",
    month: "text-fora",
  },
  challenges: {
    bg: "bg-challenges-bg",
    border: "border-challenges/30",
    day: "text-challenges-shadow",
    month: "text-challenges-shadow",
  },
  neutral: {
    bg: "bg-bg-card",
    border: "border-border",
    day: "text-text-primary",
    month: "text-text-secondary",
  },
};

export interface DateBadgeProps {
  date: Date | string;
  channel?: DateBadgeChannel;
  size?: "sm" | "md";
  className?: string;
}

function formatParts(date: Date) {
  const day = date.toLocaleDateString("pt-BR", { day: "2-digit" });
  const monthRaw = date.toLocaleDateString("pt-BR", { month: "short" });
  const month = monthRaw.replace(".", "");
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
  const year = date.toLocaleDateString("pt-BR", { year: "numeric" });
  return { day, month: monthCap, year };
}

export function DateBadge({
  date,
  channel = "neutral",
  size = "md",
  className,
}: DateBadgeProps) {
  const parsed = typeof date === "string" ? new Date(date) : date;
  const { day, month, year } = formatParts(parsed);
  const style = channelStyles[channel];

  const paddingCls = size === "sm" ? "px-2.5 py-2 w-16" : "px-3 py-2.5 w-[72px]";
  const dayCls = size === "sm" ? "text-lg leading-none" : "text-2xl leading-none";
  const monthCls = size === "sm" ? "text-[10px]" : "text-xs";
  const yearCls = size === "sm" ? "text-[9px]" : "text-[10px]";

  return (
    <div
      className={cn(
        "shrink-0 flex flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border font-display tabular-nums select-none",
        paddingCls,
        style.bg,
        style.border,
        className,
      )}
    >
      <span className={cn("font-bold", dayCls, style.day)}>{day}</span>
      <span
        className={cn(
          "uppercase font-semibold tracking-wider",
          monthCls,
          style.month,
        )}
      >
        {month}
      </span>
      <span className={cn(yearCls, "text-text-muted")}>{year}</span>
    </div>
  );
}

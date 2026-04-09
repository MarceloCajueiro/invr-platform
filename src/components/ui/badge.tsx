import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const variantStyles = {
  aulas: "bg-aulas-bg text-aulas",
  tarefas: "bg-tarefas-bg text-tarefas",
  fora: "bg-fora-bg text-fora",
  challenges: "bg-challenges-bg text-challenges",
  draft: "bg-gray-100 text-text-muted",
  published: "bg-tarefas-bg text-tarefas",
  beginner: "bg-tarefas-bg text-tarefas",
  intermediate: "bg-aulas-bg text-aulas",
  advanced: "bg-fora-bg text-fora",
  info: "bg-info/10 text-info",
  default: "bg-gray-100 text-text-secondary",
} as const;

export type BadgeVariant = keyof typeof variantStyles;

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

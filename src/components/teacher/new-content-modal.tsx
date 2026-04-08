"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ClipboardList, FileText, Trophy } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface ChannelCard {
  label: string;
  description: string;
  icon: typeof BookOpen;
  bgClass: string;
  hoverClass: string;
  iconColorClass: string;
  href: string | null;
  disabled?: boolean;
}

const channels: ChannelCard[] = [
  {
    label: "Aula",
    description: "Crie uma nova aula para seus alunos",
    icon: BookOpen,
    bgClass: "bg-aulas/10",
    hoverClass: "hover:bg-aulas/20",
    iconColorClass: "text-aulas",
    href: "/teacher/lessons/new",
  },
  {
    label: "Tarefa",
    description: "Crie uma nova tarefa ou atividade",
    icon: ClipboardList,
    bgClass: "bg-tarefas/10",
    hoverClass: "hover:bg-tarefas/20",
    iconColorClass: "text-tarefas",
    href: "/teacher/tasks/new",
  },
  {
    label: "Post",
    description: "Publique um aviso ou conteúdo",
    icon: FileText,
    bgClass: "bg-fora/10",
    hoverClass: "hover:bg-fora/20",
    iconColorClass: "text-fora",
    href: "/teacher/posts/new",
  },
  {
    label: "Challenge",
    description: "Desafie seus alunos",
    icon: Trophy,
    bgClass: "bg-challenges/10",
    hoverClass: "hover:bg-challenges/20",
    iconColorClass: "text-challenges",
    href: null,
    disabled: true,
  },
];

export function NewContentModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        handleOpen();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleOpen]);

  function handleCardClick(channel: ChannelCard) {
    if (channel.disabled || !channel.href) return;
    router.push(channel.href);
    handleClose();
  }

  // TODO: Consider converting to a dropdown/popover when a Popover primitive exists in the DS
  return (
    <Modal open={open} onClose={handleClose} title="Novo conteúdo" className="max-w-sm">
      <div className="grid grid-cols-2 gap-3">
        {channels.map((channel) => {
          const Icon = channel.icon;

          return (
            <button
              key={channel.label}
              onClick={() => handleCardClick(channel)}
              disabled={channel.disabled}
              className={`
                rounded-xl p-6 flex flex-col items-center gap-3 text-center
                transition-colors cursor-pointer
                ${channel.bgClass} ${channel.disabled ? "opacity-60 cursor-not-allowed" : channel.hoverClass}
              `}
            >
              <Icon size={32} className={channel.iconColorClass} />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {channel.label}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {channel.description}
                </p>
              </div>
              {channel.disabled && (
                <span className="text-xs font-medium uppercase tracking-wider bg-border/50 text-text-muted rounded-full px-2 py-0.5">
                  Em breve
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

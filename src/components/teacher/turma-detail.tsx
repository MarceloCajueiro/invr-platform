"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { TurmaMembers } from "@/components/teacher/turma-members";
import { TurmaContent } from "@/components/teacher/turma-content";
import { TurmaSettings } from "@/components/teacher/turma-settings";

interface Member {
  studentId: string;
  userName: string;
  userEmail: string;
  xp: number;
  currentStreak: number;
  joinedAt: Date;
}

interface LinkedLesson {
  id: string;
  title: string;
  category: string;
  status: string;
}

interface LinkedTask {
  id: string;
  title: string;
  taskType: string;
  level: string;
  status: string;
}

interface AvailableItem {
  id: string;
  title: string;
}

interface TurmaSettingsData {
  id: string;
  notifyNewLesson: boolean;
  notifyNewTask: boolean;
}

interface TurmaDetailProps {
  turmaId: string;
  members: Member[];
  linkedLessons: LinkedLesson[];
  linkedTasks: LinkedTask[];
  availableLessons: AvailableItem[];
  availableTasks: AvailableItem[];
  settings: TurmaSettingsData;
}

const tabs = [
  { id: "membros", label: "Membros" },
  { id: "aulas", label: "Aulas" },
  { id: "tarefas", label: "Tarefas" },
  { id: "configuracoes", label: "Configurações" },
];

export function TurmaDetail({
  turmaId,
  members,
  linkedLessons,
  linkedTasks,
  availableLessons,
  availableTasks,
  settings,
}: TurmaDetailProps) {
  const [activeTab, setActiveTab] = useState("membros");

  return (
    <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "membros" && (
        <TurmaMembers turmaId={turmaId} members={members} />
      )}
      {activeTab === "aulas" && (
        <TurmaContent
          turmaId={turmaId}
          type="lessons"
          items={linkedLessons}
          available={availableLessons}
        />
      )}
      {activeTab === "tarefas" && (
        <TurmaContent
          turmaId={turmaId}
          type="tasks"
          items={linkedTasks}
          available={availableTasks}
        />
      )}
      {activeTab === "configuracoes" && <TurmaSettings settings={settings} />}
    </Tabs>
  );
}

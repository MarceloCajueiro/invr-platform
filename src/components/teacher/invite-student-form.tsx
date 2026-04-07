"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createInvitation } from "@/lib/actions/invitations";

interface Turma {
  id: string;
  name: string;
  color: string | null;
}

interface InviteStudentFormProps {
  turmas: Turma[];
}

export function InviteStudentForm({ turmas }: InviteStudentFormProps) {
  const [email, setEmail] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !turmaId) return;

    setLoading(true);
    setFeedback(null);

    try {
      await createInvitation(email.trim(), turmaId);
      setFeedback({
        type: "success",
        message: `Convite enviado para ${email}`,
      });
      setEmail("");
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Erro ao enviar convite",
      });
    } finally {
      setLoading(false);
    }
  }

  if (turmas.length === 0) {
    return (
      <div className="mb-6 rounded-[var(--radius-md)] bg-warning-bg border border-warning/20 px-4 py-3 text-sm text-text-secondary">
        Para convidar alunos, primeiro{" "}
        <Link href="/teacher/turmas/new" className="text-aulas font-medium underline">
          crie uma turma
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="w-48">
          <Select
            label="Turma"
            options={turmas.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="Selecione..."
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
            required
          />
        </div>
        <div className="flex-1 max-w-sm">
          <Input
            label="Convidar aluno"
            type="email"
            placeholder="email@exemplo.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" loading={loading} size="md">
          <Send size={14} />
          Convidar
        </Button>
      </form>

      {feedback && (
        <div
          className={`flex items-center gap-2 mt-3 text-sm ${
            feedback.type === "success" ? "text-tarefas" : "text-error"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          {feedback.message}
        </div>
      )}
    </div>
  );
}

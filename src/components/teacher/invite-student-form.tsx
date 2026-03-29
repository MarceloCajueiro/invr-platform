"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createInvitation } from "@/lib/actions/invitations";

export function InviteStudentForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setFeedback(null);

    try {
      await createInvitation(email.trim());
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

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
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

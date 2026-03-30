"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { joinTurma } from "@/lib/actions/student-turmas";

export default function JoinTurmaPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError("O código deve ter 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const result = await joinTurma(trimmed);
      if (result.success) {
        router.push("/turmas");
      } else {
        setError(result.error || "Erro ao entrar na turma.");
      }
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <Link
        href="/turmas"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para turmas
      </Link>

      <PageHeader
        title="Entrar em uma Turma"
        description="Digite o código de convite fornecido pelo professor"
      />

      <Card className="max-w-md">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Código de convite"
              icon={KeyRound}
              placeholder="Ex: ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
              autoFocus
            />

            {error && (
              <p className="text-sm text-error">{error}</p>
            )}

            <Button type="submit" loading={loading} disabled={code.length !== 6}>
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
  getInvitationByToken,
  acceptInvitation,
} from "@/lib/actions/invitations";

type Invitation = {
  id: string;
  email: string;
  token: string;
  teacherId: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
};

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">(
    "loading",
  );
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function validate() {
      try {
        const result = await getInvitationByToken(token);
        if (result) {
          setInvitation(result as Invitation);
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    }
    validate();
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await acceptInvitation(token, name, password);
      router.push("/home");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao aceitar convite. Tente novamente.",
      );
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-tarefas animate-spin" />
        <p className="mt-4 text-text-secondary text-sm">
          Validando convite...
        </p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-16 text-center">
        <XCircle className="w-12 h-12 text-fora mb-4" />
        <h1
          className="text-2xl font-extrabold text-text-primary"
          style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
        >
          Convite inválido
        </h1>
        <p className="mt-2 text-text-secondary">
          Este convite expirou ou já foi utilizado.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold text-text-primary tracking-tight"
          style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
        >
          Aceitar convite
        </h1>
        <p className="mt-2 text-text-secondary">
          Crie sua conta para começar a estudar no Fluent
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-[var(--radius-sm)] bg-fora-bg px-4 py-3 text-sm text-fora">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            disabled
            value={invitation?.email ?? ""}
            className="w-full px-3 py-2.5 bg-input-bg border border-border rounded-[var(--radius-sm)] text-text-muted cursor-not-allowed"
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Nome
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full px-3 py-2.5 bg-input-bg border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-tarefas transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full px-3 py-2.5 pr-10 bg-input-bg border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-tarefas transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-tarefas text-white font-medium rounded-[var(--radius-sm)] hover:brightness-110 active:translate-y-[2px] transition-all disabled:opacity-60 disabled:pointer-events-none"
        >
          {submitting ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Aceitar e começar
            </>
          )}
        </button>
      </form>
    </div>
  );
}

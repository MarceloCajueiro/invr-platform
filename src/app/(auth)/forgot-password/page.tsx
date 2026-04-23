"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    await authClient.requestPasswordReset(
      { email, redirectTo: "/reset-password" },
      {
        onSuccess: () => {
          setSubmitted(true);
          setLoading(false);
        },
        onError: () => {
          // Anti-enumeration: show the same success UI regardless of server error.
          setSubmitted(true);
          setLoading(false);
        },
      },
    );
  }

  if (submitted) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1
            className="text-3xl font-extrabold text-text-primary tracking-tight"
            style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
          >
            Verifique seu email
          </h1>
          <p className="mt-2 text-text-secondary">
            Se existir uma conta para <strong>{email}</strong>, enviaremos as instruções em alguns minutos.
          </p>
          <p className="mt-2 text-text-secondary text-sm">
            Não recebeu? Confira sua pasta de spam ou{" "}
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setEmail("");
              }}
              className="text-aulas font-medium hover:underline"
            >
              tente outro email
            </button>
            .
          </p>
        </div>
        <Link href="/sign-in" className="text-sm text-aulas font-medium hover:underline">
          ← Voltar para o login
        </Link>
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
          Esqueceu a senha?
        </h1>
        <p className="mt-2 text-text-secondary">
          Informe seu email e enviaremos um link para redefinir a senha.
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
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full px-3 py-2.5 bg-input-bg border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-aulas transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-aulas text-white font-medium rounded-[var(--radius-sm)] hover:brightness-110 active:translate-y-[2px] transition-all disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Enviar link
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Lembrou a senha?{" "}
        <Link href="/sign-in" className="text-aulas font-medium hover:underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}

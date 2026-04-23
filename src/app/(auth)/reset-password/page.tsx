"use client";

import { Suspense, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { translateAuthError } from "@/lib/auth/errors";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    const expired = linkError === "INVALID_TOKEN";
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1
            className="text-3xl font-extrabold text-text-primary tracking-tight"
            style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
          >
            {expired ? "Link expirado" : "Link inválido"}
          </h1>
          <p className="mt-2 text-text-secondary">
            {expired
              ? "Este link de redefinição expirou. Solicite um novo para continuar."
              : "Este link de redefinição é inválido ou está incompleto."}
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-aulas text-white font-medium rounded-[var(--radius-sm)] hover:brightness-110 active:translate-y-[2px] transition-all"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    await authClient.resetPassword(
      { newPassword: password, token: token as string },
      {
        onSuccess: () => {
          router.push("/sign-in?reset=success");
        },
        onError: (ctx) => {
          setError(
            translateAuthError(
              ctx.error.message,
              "Não foi possível redefinir a senha. Tente novamente.",
            ),
          );
          setLoading(false);
        },
      },
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold text-text-primary tracking-tight"
          style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
        >
          Nova senha
        </h1>
        <p className="mt-2 text-text-secondary">
          Escolha uma senha com no mínimo 8 caracteres.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-[var(--radius-sm)] bg-fora-bg px-4 py-3 text-sm text-fora"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Nova senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full px-3 py-2.5 pr-10 bg-input-bg border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-aulas transition-colors"
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

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Confirmar nova senha
          </label>
          <input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="********"
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
              <KeyRound className="w-4 h-4" />
              Redefinir senha
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link href="/sign-in" className="text-aulas font-medium hover:underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

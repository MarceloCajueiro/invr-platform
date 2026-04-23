"use client";

import { Suspense, useState, useEffect, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { LogIn, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { translateAuthError } from "@/lib/auth/errors";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showResetBanner, setShowResetBanner] = useState(
    searchParams.get("reset") === "success",
  );
  const { data: session } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      const role = (session.user as { role?: string }).role;
      const dest = role === "student" ? "/home" : "/teacher/dashboard";
      router.replace(dest);
    }
  }, [session, router]);

  // Drop the ?reset=success query param from the URL after first paint so the
  // banner doesn't persist across reloads or back-navigation.
  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      router.replace("/sign-in");
    }
  }, [searchParams, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: () => {
          router.push("/teacher/dashboard");
        },
        onError: (ctx) => {
          setError(translateAuthError(ctx.error.message, "Erro ao fazer login. Tente novamente."));
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
          Bem-vindo de volta
        </h1>
        <p className="mt-2 text-text-secondary">
          Entre na sua conta para continuar
        </p>
      </div>

      {showResetBanner && !session?.user && (
        <div
          role="status"
          className="mb-6 flex items-start gap-2 rounded-[var(--radius-sm)] bg-tarefas-bg px-4 py-3 text-sm text-tarefas"
        >
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Senha redefinida com sucesso. Faça login com sua nova senha.</span>
        </div>
      )}

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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-primary"
            >
              Senha
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-aulas hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
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

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-aulas text-white font-medium rounded-[var(--radius-sm)] hover:brightness-110 active:translate-y-[2px] transition-all disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Entrar
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Não tem uma conta?{" "}
        <Link
          href="/sign-up"
          className="text-aulas font-medium hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

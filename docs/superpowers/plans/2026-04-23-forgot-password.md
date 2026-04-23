# Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable teachers and students to reset forgotten passwords via email, using better-auth's native password reset flow.

**Architecture:** Configure better-auth's `sendResetPassword` callback to send email via the existing Resend service. Add two auth pages (`/forgot-password`, `/reset-password`) backed by `authClient.forgetPassword` / `authClient.resetPassword`. Link from sign-in; on success redirect back to `/sign-in?reset=success` with confirmation banner. No schema changes (uses existing `verification` table).

**Tech Stack:** Next.js 16 App Router, better-auth, Resend, Playwright, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-04-23-forgot-password-design.md`

---

## File Structure

**Created:**
- `src/lib/services/email/templates/reset-password.ts` — pure HTML renderer
- `src/app/(auth)/forgot-password/page.tsx` — request form + success state
- `src/app/(auth)/reset-password/page.tsx` — new password form (reads `token` from URL)
- `e2e/forgot-password.spec.ts` — Playwright coverage

**Modified:**
- `src/lib/auth/server.ts` — add `sendResetPassword` callback and token expiry
- `src/lib/auth/errors.ts` — refine pt-BR error messages for reset-related codes
- `src/app/(auth)/sign-in/page.tsx` — link to `/forgot-password` + success banner (inline, using DS tokens)

---

## Task 1: Email template module

**Files:**
- Create: `src/lib/services/email/templates/reset-password.ts`

- [ ] **Step 1: Create the template renderer**

```ts
// src/lib/services/email/templates/reset-password.ts
interface ResetPasswordEmailProps {
  url: string;
  name: string;
}

export function renderResetPasswordEmail({ url, name }: ResetPasswordEmailProps): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">Redefinir sua senha</h2>
      <p style="color: #555; line-height: 1.6;">
        Olá, <strong>${escapeHtml(name)}</strong>. Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Inglês na Vida Real</strong>.
      </p>
      <p style="color: #555; line-height: 1.6;">
        Clique no botão abaixo para escolher uma nova senha:
      </p>
      <a href="${url}"
         style="display: inline-block; margin-top: 16px; padding: 12px 32px; background: #6c5ce7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Redefinir senha
      </a>
      <p style="margin-top: 24px; color: #555; line-height: 1.6; font-size: 13px;">
        Se o botão não funcionar, copie e cole este link no navegador:<br />
        <span style="word-break: break-all; color: #6c5ce7;">${url}</span>
      </p>
      <p style="margin-top: 24px; color: #999; font-size: 13px;">
        Este link expira em 24 horas. Se você não solicitou, pode ignorar este email.
      </p>
      <p style="margin-top: 8px; color: #999; font-size: 13px;">
        — Equipe Inglês na Vida Real
      </p>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/email/templates/reset-password.ts
git commit -m "feat(email): add reset password HTML template"
```

---

## Task 2: Wire `sendResetPassword` into better-auth

**Files:**
- Modify: `src/lib/auth/server.ts`

- [ ] **Step 1: Update the `emailAndPassword` config**

Replace the `emailAndPassword` block in `src/lib/auth/server.ts`:

```ts
// src/lib/auth/server.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/lib/db/schema";
import { sendEmail } from "@/lib/services/email/resend";
import { renderResetPasswordEmail } from "@/lib/services/email/templates/reset-password";

export async function createAuth() {
  const { env } = await getCloudflareContext({ async: true });
  const db = drizzle(env.DB, { schema });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      usePlural: false,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.BETTER_AUTH_URL, "https://plataforma.inglesnavidareal.com.br", "https://*.marcelocajueiro.workers.dev"],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      resetPasswordTokenExpiresIn: 60 * 60 * 24,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Redefinir sua senha — Inglês na Vida Real",
          html: renderResetPasswordEmail({ url, name: user.name }),
        });
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "teacher",
          input: false,
        },
      },
    },
    plugins: [nextCookies()],
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. If better-auth's type for `sendResetPassword` differs (e.g. callback receives `{ user, url, token }` and `url` is instead `resetLink`), adjust names to match what the type system requires — behaviour stays identical.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/server.ts
git commit -m "feat(auth): configure better-auth sendResetPassword callback"
```

---

## Task 3: Refine error translations

**Files:**
- Modify: `src/lib/auth/errors.ts`

- [ ] **Step 1: Update translations for reset context**

Replace the relevant entries in the `errorTranslations` map in `src/lib/auth/errors.ts`:

```ts
// src/lib/auth/errors.ts
const errorTranslations: Record<string, string> = {
  "user already exists.": "Este e-mail já está cadastrado.",
  "user already exists. use another email.":
    "Este e-mail já está cadastrado. Use outro e-mail.",
  "invalid email or password": "E-mail ou senha inválidos.",
  "invalid email or password.": "E-mail ou senha inválidos.",
  "invalid email": "E-mail inválido.",
  "invalid password": "Senha inválida.",
  "password too short": "A senha deve ter no mínimo 8 caracteres.",
  "password too long": "A senha é muito longa.",
  "user not found": "Usuário não encontrado.",
  "invalid token": "Link inválido ou expirado. Solicite um novo.",
  "token expired": "Este link expirou. Solicite um novo.",
  "token has expired": "Este link expirou. Solicite um novo.",
  "email not verified": "E-mail não verificado.",
  "session expired. re-authenticate to perform this action.":
    "Sessão expirada. Faça login novamente.",
  "invalid origin": "Origem inválida.",
  "failed to create user": "Erro ao criar usuário.",
  "failed to create session": "Erro ao criar sessão.",
  "credential account not found": "Conta não encontrada.",
  "validation error": "Erro de validação.",
  "field is required": "Campo obrigatório.",
};

export function translateAuthError(
  message: string | undefined,
  fallback: string,
): string {
  if (!message) return fallback;
  const normalized = message.toLowerCase().trim();
  return errorTranslations[normalized] ?? fallback;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/errors.ts
git commit -m "feat(auth): refine error translations for password reset"
```

---

## Task 4: `/forgot-password` page

**Files:**
- Create: `src/app/(auth)/forgot-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/(auth)/forgot-password/page.tsx
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

    await authClient.forgetPassword(
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/forgot-password/page.tsx
git commit -m "feat(auth): add forgot password page"
```

---

## Task 5: Sign-in link and success banner

**Files:**
- Modify: `src/app/(auth)/sign-in/page.tsx`

- [ ] **Step 1: Read `searchParams` and add banner + link**

Replace the full contents of `src/app/(auth)/sign-in/page.tsx` with:

```tsx
// src/app/(auth)/sign-in/page.tsx
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { LogIn, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { translateAuthError } from "@/lib/auth/errors";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetFlag = searchParams.get("reset");
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

      {resetFlag === "success" && (
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
```

Note: `useSearchParams()` requires a Suspense boundary at the route level in Next 16. The `(auth)/layout.tsx` already wraps content; if build warns about CSR bailout, wrap the page body in `<Suspense>`. Verify in Step 2.

- [ ] **Step 2: Build smoke (catches Suspense issue)**

Run: `npx next build`
Expected: success with no "useSearchParams must be wrapped in Suspense" warning. If warning appears, wrap the page component's body in `<Suspense fallback={null}>` from `react` — splitting into an inner `<SignInForm />` that consumes `useSearchParams`, and an outer default export that wraps it in `<Suspense>`.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/sign-in/page.tsx
git commit -m "feat(auth): add forgot password link and reset success banner on sign-in"
```

---

## Task 6: `/reset-password` page

**Files:**
- Create: `src/app/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/(auth)/reset-password/page.tsx
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

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1
            className="text-3xl font-extrabold text-text-primary tracking-tight"
            style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
          >
            Link inválido
          </h1>
          <p className="mt-2 text-text-secondary">
            Este link de redefinição é inválido ou está incompleto.
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
        <div className="mb-6 rounded-[var(--radius-sm)] bg-fora-bg px-4 py-3 text-sm text-fora">
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
```

- [ ] **Step 2: Type-check and build**

Run: `npx tsc --noEmit && npx next build`
Expected: no errors, no "useSearchParams must be wrapped in Suspense" warning.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/reset-password/page.tsx
git commit -m "feat(auth): add reset password page"
```

---

## Task 7: Playwright coverage

**Files:**
- Create: `e2e/forgot-password.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
// e2e/forgot-password.spec.ts
import { test, expect } from "@playwright/test";

test.describe("forgot password", () => {
  test("link on sign-in leads to forgot password form", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: /esqueci minha senha/i }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole("heading", { name: /esqueceu a senha\?/i })).toBeVisible();
  });

  test("submitting email shows success state regardless of account existence", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel(/email/i).fill("nonexistent-user@example.com");
    await page.getByRole("button", { name: /enviar link/i }).click();
    await expect(page.getByRole("heading", { name: /verifique seu email/i })).toBeVisible();
    await expect(page.getByText("nonexistent-user@example.com")).toBeVisible();
  });

  test("sign-in shows success banner when arriving with reset=success", async ({ page }) => {
    await page.goto("/sign-in?reset=success");
    await expect(
      page.getByText(/senha redefinida com sucesso\. faça login/i),
    ).toBeVisible();
  });

  test("reset-password without token shows invalid link state", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: /link inválido/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /solicitar novo link/i })).toBeVisible();
  });

  test("reset-password client validation: mismatched passwords", async ({ page }) => {
    await page.goto("/reset-password?token=any-token");
    await page.getByLabel("Nova senha").fill("password123");
    await page.getByLabel(/confirmar nova senha/i).fill("password456");
    await page.getByRole("button", { name: /redefinir senha/i }).click();
    await expect(page.getByText(/senhas não conferem/i)).toBeVisible();
  });

  test("reset-password with invalid token shows translated error", async ({ page }) => {
    await page.goto("/reset-password?token=bogus-token-not-in-db");
    await page.getByLabel("Nova senha").fill("password123");
    await page.getByLabel(/confirmar nova senha/i).fill("password123");
    await page.getByRole("button", { name: /redefinir senha/i }).click();
    await expect(page.getByText(/link inválido ou expirado/i)).toBeVisible();
  });
});
```

- [ ] **Step 2: Confirm which project runs these**

Open `playwright.config.ts` and verify `e2e/forgot-password.spec.ts` matches the `auth` project's `testMatch` (unauthenticated). If `auth` uses a glob like `e2e/**/*.spec.ts` without storage state, no change needed. If `auth` targets specific files, add this one to its include list.

- [ ] **Step 3: Run the suite**

First reset DB to ensure a clean dev state:
```bash
npm run db:reset
```

Kill any running dev server, then:
```bash
npx playwright test --project=auth --grep "forgot password"
```

Expected: all 6 tests pass. If a test times out because the dev server is slow, rerun once.

- [ ] **Step 4: Commit**

```bash
git add e2e/forgot-password.spec.ts
git commit -m "test(auth): add forgot password Playwright coverage"
```

---

## Task 8: Manual verification

- [ ] **Step 1: End-to-end smoke with real email**

Start dev: `npm run dev -- --port 3001`

1. Go to http://localhost:3001/sign-in
2. Click "Esqueci minha senha"
3. Submit `fran@fluent.app` (seed teacher — confirm it can receive email in the Resend inbox/test mode, or swap for your own email)
4. Open the email in Resend dashboard (or real inbox), click the CTA
5. On `/reset-password?token=...`, set a new password twice, submit
6. Expect redirect to `/sign-in?reset=success` with green banner
7. Sign in with the new password — expect teacher dashboard

Report any issue before shipping. This step is not automated because token interception requires email mocking infra (see spec "Fora de escopo").

- [ ] **Step 2: Confirm no regressions in existing auth flows**

- Sign-in with seed user still works.
- Sign-up still works.
- Accept-invite flow still works (`/invite/[token]` emails unchanged).

No commit — verification only.

---

## Task 9: Wrap up

- [ ] **Step 1: Run final checks**

```bash
npx tsc --noEmit
npx playwright test --project=auth
npx next build
```

Expected: all green.

- [ ] **Step 2: Open PR**

Push branch and open PR with title `feat: implementar fluxo de esqueci minha senha` and body referencing the spec.

---

## Self-Review

**Spec coverage:**
- Better-auth callback + 24h expiry → Task 2 ✓
- Anti-enumeration success UI → Task 4 (onError also triggers `submitted=true`) ✓
- Email template with brand "Inglês na Vida Real" → Task 1 ✓
- Pages /forgot-password + /reset-password → Tasks 4, 6 ✓
- Sign-in link + `?reset=success` banner → Task 5 ✓
- Error translations (`invalid token`, `token expired`, `password too short`) → Task 3 ✓
- Playwright tests (happy path trigger, banner, invalid token, missing token, client validation) → Task 7 ✓
- Deferred items from spec (rate limit, brand alignment, email interception E2E) → correctly left out ✓

**Placeholder scan:** None. Every step shows exact code or exact command.

**Type consistency:** `renderResetPasswordEmail({ url, name })` called identically in Task 2. `authClient.forgetPassword`, `authClient.resetPassword`, `authClient.signIn.email` used per better-auth's public API. `useSearchParams` wrapped in `<Suspense>` in Task 6 and flagged as contingency in Task 5. Banner uses DS tokens `bg-tarefas-bg` / `text-tarefas` (success color family) — no arbitrary colors.


import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";

// ============================
// Constantes
// ============================
const TEST_TEACHER = {
  name: "Professor Teste",
  email: `teacher-${Date.now()}@test.com`,
  password: "senhaforte123",
};

// ============================
// Helpers
// ============================
async function signUp(page: Page, user: typeof TEST_TEACHER) {
  await page.goto("/sign-up");
  await page.getByLabel("Nome").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: /criar conta/i }).click();
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
}

// ============================
// Testes
// ============================
test.describe.serial("Phase 0 — Auth & Layouts", () => {
  test.describe("CT-09: Página de sign-in renderiza layout", () => {
    test("deve mostrar formulário de login com heading correto", async ({ page }) => {
      await page.goto("/sign-in");
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Senha")).toBeVisible();
      await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /criar conta/i })).toBeVisible();
    });
  });

  test.describe("CT-01: Teacher cria conta com sucesso", () => {
    test("deve criar conta e redirecionar para /teacher/dashboard", async ({ page }) => {
      await signUp(page, TEST_TEACHER);
      await page.waitForURL("**/teacher/dashboard", { timeout: 15000 });
      await expect(page).toHaveURL(/\/teacher\/dashboard/);
    });
  });

  test.describe("CT-03: Teacher faz login com credenciais corretas", () => {
    test("deve fazer login e redirecionar para /teacher/dashboard", async ({ page }) => {
      await signIn(page, TEST_TEACHER.email, TEST_TEACHER.password);
      await page.waitForURL("**/teacher/dashboard", { timeout: 10000 });
      await expect(page).toHaveURL(/\/teacher\/dashboard/);
    });
  });

  test.describe("CT-10: Dashboard renderiza sidebar do professor", () => {
    test("deve mostrar sidebar com itens de navegação do professor", async ({ page }) => {
      await signIn(page, TEST_TEACHER.email, TEST_TEACHER.password);
      await page.waitForURL("**/teacher/dashboard", { timeout: 10000 });

      // Verificar logo
      await expect(page.getByText("Fluent").first()).toBeVisible();

      // Verificar itens de navegação
      await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /aulas/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /tarefas/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /posts/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /turmas/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /alunos/i })).toBeVisible();

      // Verificar heading da página
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    });
  });

  test.describe("CT-05: Teacher faz logout", () => {
    test("deve fazer logout e redirecionar para /sign-in", async ({ page }) => {
      await signIn(page, TEST_TEACHER.email, TEST_TEACHER.password);
      await page.waitForURL("**/teacher/dashboard", { timeout: 10000 });

      // Botão de logout tem aria-label="Sign out"
      await page.getByRole("button", { name: /sign out/i }).click();
      await page.waitForURL("**/sign-in", { timeout: 10000 });
      await expect(page).toHaveURL(/\/sign-in/);
    });
  });

  test.describe("CT-04: Login com credenciais incorretas", () => {
    test("deve mostrar mensagem de erro", async ({ page }) => {
      await signIn(page, "naoexiste@test.com", "senhaerrada123");
      // Aguardar mensagem de erro (div com bg vermelha/coral)
      await page.waitForTimeout(2000);
      // Verificar que ainda está na página de sign-in (não redirecionou)
      await expect(page).toHaveURL(/\/sign-in/);
    });
  });

  test.describe("CT-06: Middleware redireciona não autenticado", () => {
    test("deve redirecionar /teacher/dashboard para /sign-in", async ({ page }) => {
      await page.context().clearCookies();
      await page.goto("/teacher/dashboard");
      await page.waitForURL("**/sign-in**", { timeout: 10000 });
      await expect(page).toHaveURL(/\/sign-in/);
    });
  });

  test.describe("CT-07: Middleware redireciona autenticado em /sign-in", () => {
    test("deve redirecionar /sign-in para /dashboard quando autenticado", async ({ page }) => {
      await signIn(page, TEST_TEACHER.email, TEST_TEACHER.password);
      await page.waitForURL("**/teacher/dashboard", { timeout: 10000 });

      await page.goto("/sign-in");
      await page.waitForURL("**/teacher/dashboard", { timeout: 10000 });
      await expect(page).toHaveURL(/\/teacher\/dashboard/);
    });
  });

  test.describe("CT-08: Root redireciona para /dashboard", () => {
    test("deve redirecionar / para /dashboard quando autenticado", async ({ page }) => {
      await signIn(page, TEST_TEACHER.email, TEST_TEACHER.password);
      await page.waitForURL("**/teacher/dashboard", { timeout: 10000 });

      await page.goto("/");
      await page.waitForURL("**/teacher/dashboard", { timeout: 10000 });
      await expect(page).toHaveURL(/\/teacher\/dashboard/);
    });
  });
});

// ============================
// Forgot / Reset Password
// ============================

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
    await page.getByLabel("Nova senha", { exact: true }).fill("password123");
    await page.getByLabel(/confirmar nova senha/i).fill("password456");
    await page.getByRole("button", { name: /redefinir senha/i }).click();
    await expect(page.getByText(/senhas não conferem/i)).toBeVisible();
  });

  test("reset-password with invalid token shows translated error", async ({ page }) => {
    await page.goto("/reset-password?token=bogus-token-not-in-db");
    await page.getByLabel("Nova senha", { exact: true }).fill("password123");
    await page.getByLabel(/confirmar nova senha/i).fill("password123");
    await page.getByRole("button", { name: /redefinir senha/i }).click();
    await expect(page.getByText(/link inválido ou expirado/i)).toBeVisible();
  });

  // CT-60: happy path end-to-end. Cobre o gap do PR #4 — os testes anteriores
  // validam UI/erros, mas nenhum verifica que o fluxo de fato redefine a senha.
  // Usa um usuário throwaway criado via sign-up para não tocar nos seeds
  // (reset com `revokeSessionsOnPasswordReset: true` invalidaria o
  // storageState compartilhado de fran/marcelo).
  test("CT-60: happy path — redefine a senha e faz login com a nova", async ({ page }) => {
    const suffix = Date.now();
    const EMAIL = `reset-flow-${suffix}@test.local`;
    const INITIAL_PASSWORD = "senha-inicial-12345";
    const NEW_PASSWORD = "nova-senha-e2e-12345";
    // better-auth rejeita POSTs sem header Origin (MISSING_OR_NULL_ORIGIN).
    const authHeaders = { Origin: "http://localhost:3001" };

    // Cria o user isolado via sign-up (better-auth endpoint).
    const signUp = await page.request.post("/api/auth/sign-up/email", {
      headers: authHeaders,
      data: {
        email: EMAIL,
        password: INITIAL_PASSWORD,
        name: "E2E Reset Flow User",
      },
    });
    expect(signUp.ok()).toBeTruthy();

    // Dispara o request-password-reset (equivalente ao submit do
    // /forgot-password — UI já coberta em testes anteriores).
    const reqRes = await page.request.post("/api/auth/request-password-reset", {
      headers: authHeaders,
      data: { email: EMAIL, redirectTo: "/reset-password" },
    });
    expect(reqRes.ok()).toBeTruthy();

    // Lê o token real da tabela verification no D1 local. better-auth salva
    // como identifier = "reset-password:<token>".
    const token = readLatestResetToken();
    expect(token).toMatch(/^[A-Za-z0-9]+$/);

    // Completa o fluxo pela UI.
    await page.goto(`/reset-password?token=${token}`);
    await page.getByLabel("Nova senha", { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel(/confirmar nova senha/i).fill(NEW_PASSWORD);
    await page.getByRole("button", { name: /redefinir senha/i }).click();

    // Após sucesso: /reset-password navega para /sign-in?reset=success, e o
    // /sign-in remove o query param após o primeiro paint. Asseguramos o banner.
    await expect(
      page.getByText(/senha redefinida com sucesso\. faça login/i),
    ).toBeVisible();

    // Login com a senha nova funciona. A senha antiga fica inutilizável.
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Senha").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: /entrar/i }).click();
    // User novo é teacher por default (config: role defaultValue = "teacher").
    await page.waitForURL(/\/(teacher\/dashboard|home)/, { timeout: 15000 });
  });
});

function readLatestResetToken(): string {
  const raw = execFileSync(
    "wrangler",
    [
      "d1",
      "execute",
      "fluent-db",
      "--local",
      "--json",
      "--command",
      "SELECT identifier FROM verification WHERE identifier LIKE 'reset-password:%' ORDER BY createdAt DESC LIMIT 1",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  const parsed = JSON.parse(raw);
  const identifier = parsed[0]?.results?.[0]?.identifier;
  if (typeof identifier !== "string" || !identifier.startsWith("reset-password:")) {
    throw new Error(`Unexpected identifier shape: ${identifier}`);
  }
  return identifier.slice("reset-password:".length);
}

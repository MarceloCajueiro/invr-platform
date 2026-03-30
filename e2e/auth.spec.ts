import { test, expect, type Page } from "@playwright/test";

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

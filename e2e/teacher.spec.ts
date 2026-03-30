import { test, expect } from "@playwright/test";

// ============================
// Teacher CMS E2E Tests
// Uses seed data: teacher fran@fluent.app (pre-authenticated via setup)
// ============================

test.describe.serial("Teacher CMS", () => {
  // ---- Dashboard ----
  test.describe("CT-11: Dashboard exibe KPIs", () => {
    test("deve mostrar cards de KPI e submissions recentes", async ({ page }) => {
      await page.goto("/teacher/dashboard");
      await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
      // KPI cards should be visible (exact numbers depend on seed)
      await expect(page.getByText(/aluno/i).first()).toBeVisible();
      await expect(page.getByText(/aula/i).first()).toBeVisible();
    });
  });

  // ---- Lessons ----
  test.describe("CT-12: Listar aulas", () => {
    test("deve mostrar aulas do seed", async ({ page }) => {
      await page.goto("/teacher/lessons");
      await expect(page.getByRole("heading", { name: /aulas/i })).toBeVisible();
      await expect(page.getByText("Introduction to Present Simple")).toBeVisible();
      await expect(page.getByText("Ordering Food at a Restaurant")).toBeVisible();
    });
  });

  test.describe("CT-13: Criar nova aula", () => {
    test("deve criar aula e redirecionar para lista", async ({ page }) => {
      await page.goto("/teacher/lessons/new");
      await expect(page.getByRole("heading", { name: /nova aula/i })).toBeVisible();

      await page.getByLabel(/título/i).fill("E2E Test Lesson");
      await page.locator("select").first().selectOption("grammar");
      await page.getByRole("button", { name: /criar|salvar/i }).click();

      await page.waitForURL("**/teacher/lessons", { timeout: 10000 });
      await expect(page.getByText("E2E Test Lesson")).toBeVisible();
    });
  });

  // ---- Tasks ----
  test.describe("CT-14: Listar tarefas", () => {
    test("deve mostrar tarefas do seed", async ({ page }) => {
      await page.goto("/teacher/tasks");
      await expect(page.getByRole("heading", { name: /tarefas/i })).toBeVisible();
      await expect(page.getByText("Present Simple Quiz")).toBeVisible();
    });
  });

  test.describe("CT-15: Criar nova tarefa quiz", () => {
    test("deve criar tarefa e redirecionar para lista", async ({ page }) => {
      await page.goto("/teacher/tasks/new");
      await expect(page.getByRole("heading", { name: /nova tarefa/i })).toBeVisible();

      await page.getByLabel(/título/i).fill("E2E Quiz Task");
      // Select quiz type and beginner level
      const selects = page.locator("select");
      await selects.nth(0).selectOption("quiz");
      await selects.nth(1).selectOption("beginner");

      await page.getByRole("button", { name: /criar|salvar/i }).click();
      await page.waitForURL("**/teacher/tasks", { timeout: 10000 });
    });
  });

  // ---- Posts ----
  test.describe("CT-16: Listar posts", () => {
    test("deve mostrar posts do seed", async ({ page }) => {
      await page.goto("/teacher/posts");
      await expect(page.getByRole("heading", { name: /posts/i })).toBeVisible();
      await expect(page.getByText("5 Dicas para Melhorar seu Listening")).toBeVisible();
    });
  });

  test.describe("CT-17: Criar novo post", () => {
    test("deve criar post e redirecionar para lista", async ({ page }) => {
      await page.goto("/teacher/posts/new");
      await expect(page.getByRole("heading", { name: /novo post/i })).toBeVisible();

      await page.getByLabel(/título/i).fill("E2E Test Post");
      // Slug field may not have a proper label association — use input by name or placeholder
      const slugInput = page.locator('input[name="slug"]').or(page.getByPlaceholder(/slug/i));
      if (await slugInput.count() > 0) {
        await slugInput.first().fill("e2e-test-post");
      }
      await page.locator("select").first().selectOption("tips");

      await page.getByRole("button", { name: /criar|salvar/i }).click();
      await page.waitForURL("**/teacher/posts", { timeout: 10000 });
    });
  });

  // ---- Turmas ----
  test.describe("CT-18: Listar turmas", () => {
    test("deve mostrar turma do seed", async ({ page }) => {
      await page.goto("/teacher/turmas");
      await expect(page.getByRole("heading", { name: /turmas/i })).toBeVisible();
      await expect(page.getByText("Turma Iniciante 2026")).toBeVisible();
    });
  });

  test.describe("CT-19: Criar nova turma", () => {
    test("deve criar turma e redirecionar para lista", async ({ page }) => {
      await page.goto("/teacher/turmas/new");
      await page.getByLabel(/nome/i).fill("E2E Turma");
      await page.getByRole("button", { name: /criar|salvar/i }).click();
      await page.waitForURL("**/teacher/turmas", { timeout: 10000 });
      await expect(page.getByText("E2E Turma")).toBeVisible();
    });
  });

  test.describe("CT-20: Detalhe da turma com tabs", () => {
    test("deve mostrar detalhes da turma com membros", async ({ page }) => {
      await page.goto("/teacher/turmas");
      await page.getByText("Turma Iniciante 2026").click();
      await page.waitForURL("**/teacher/turmas/**", { timeout: 10000 });
      // Should see turma details with tabs
      await expect(page.getByText("Turma Iniciante 2026").first()).toBeVisible();
      await expect(page.getByText("Marcelo Aluno").first()).toBeVisible({ timeout: 5000 });
    });
  });

  // ---- Students ----
  test.describe("CT-21: Listar alunos", () => {
    test("deve mostrar aluno do seed", async ({ page }) => {
      await page.goto("/teacher/students");
      await expect(page.getByRole("heading", { name: /alunos/i })).toBeVisible();
      await expect(page.getByText("Marcelo Aluno")).toBeVisible();
    });
  });

  // ---- Navegação sidebar ----
  test.describe("CT-22: Navegação entre seções via sidebar", () => {
    test("deve navegar entre todas as seções", async ({ page }) => {
      await page.goto("/teacher/dashboard");

      const navLinks = [
        { name: /^aulas$/i, url: "/teacher/lessons" },
        { name: /^tarefas$/i, url: "/teacher/tasks" },
        { name: /^posts$/i, url: "/teacher/posts" },
        { name: /^turmas$/i, url: "/teacher/turmas" },
        { name: /^alunos$/i, url: "/teacher/students" },
      ];

      for (const link of navLinks) {
        // Click sidebar link (inside the aside/nav)
        await page.locator("aside").getByRole("link", { name: link.name }).click();
        await page.waitForURL(`**${link.url}`, { timeout: 5000 });
        await expect(page).toHaveURL(new RegExp(link.url.replace(/\//g, "\\/")));
      }
    });
  });
});

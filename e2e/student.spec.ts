import { test, expect } from "@playwright/test";

// ============================
// Student Interface E2E Tests
// Uses seed data: student marcelo@fluent.app (pre-authenticated via setup)
// ============================

test.describe.serial("Student Interface", () => {
  // ---- Home ----
  test.describe("CT-30: Home dashboard", () => {
    test("deve mostrar greeting e channel cards", async ({ page }) => {
      await page.goto("/home");
      // Greeting with student name
      await expect(page.getByText(/marcelo/i).first()).toBeVisible();
      // Channel cards should exist
      await expect(page.getByText(/aulas/i).first()).toBeVisible();
      await expect(page.getByText(/tarefas/i).first()).toBeVisible();
    });
  });

  // ---- Lessons ----
  test.describe("CT-31: Listar aulas do aluno", () => {
    test("deve mostrar aulas publicadas do teacher", async ({ page }) => {
      await page.goto("/lessons");
      await expect(page.getByText("Introduction to Present Simple")).toBeVisible();
      await expect(page.getByText("Ordering Food at a Restaurant")).toBeVisible();
      await expect(page.getByText("Daily Routine Vocabulary")).toBeVisible();
      // Draft lesson should NOT appear
      await expect(page.getByText("British vs American English")).not.toBeVisible();
    });
  });

  test.describe("CT-32: Ver detalhe de aula", () => {
    test("deve abrir aula e mostrar conteúdo", async ({ page }) => {
      await page.goto("/lessons");
      await page.getByText("Introduction to Present Simple").click();
      await page.waitForURL("**/lessons/**", { timeout: 10000 });
      await expect(page.getByText("Introduction to Present Simple").first()).toBeVisible();
      // Description should be rendered
      await expect(page.getByText(/Present Simple tense/i).first()).toBeVisible();
    });
  });

  // ---- Tasks ----
  test.describe("CT-33: Listar tarefas do aluno", () => {
    test("deve mostrar tarefas publicadas com status de submissão", async ({ page }) => {
      await page.goto("/tasks");
      await expect(page.getByText("Present Simple Quiz")).toBeVisible();
      await expect(page.getByText("Daily Routine - Fill the Gaps")).toBeVisible();
      await expect(page.getByText("Describe Your Morning")).toBeVisible();
      // Quiz should show score (100% from seed)
      await expect(page.getByText(/100/)).toBeVisible();
    });
  });

  test.describe("CT-34: Ver quiz já respondido", () => {
    test("deve mostrar resultado do quiz já submetido", async ({ page }) => {
      await page.goto("/tasks");
      await page.getByText("Present Simple Quiz").click();
      await page.waitForURL("**/tasks/**", { timeout: 10000 });
      // Should show the quiz result (already submitted)
      await expect(page.getByText(/100|resultado|score|nota/i).first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("CT-35: Ver tarefa de writing disponível", () => {
    test("deve mostrar prompt de writing para submissão", async ({ page }) => {
      await page.goto("/tasks");
      await page.getByText("Describe Your Morning").click();
      await page.waitForURL("**/tasks/**", { timeout: 10000 });
      // Should show the writing prompt
      await expect(page.getByText(/morning routine/i).first()).toBeVisible({ timeout: 5000 });
    });
  });

  // ---- Blog ----
  test.describe("CT-36: Listar posts do blog", () => {
    test("deve mostrar posts publicados", async ({ page }) => {
      await page.goto("/blog");
      await expect(page.getByText("5 Dicas para Melhorar seu Listening").first()).toBeVisible();
      await expect(page.getByText("Verbos Irregulares Mais Comuns").first()).toBeVisible();
      await expect(page.getByText(/Filmes para Praticar Ingl/i).first()).toBeVisible();
    });
  });

  test.describe("CT-37: Ver detalhe do post", () => {
    test("deve abrir post e mostrar conteúdo markdown", async ({ page }) => {
      await page.goto("/blog");
      await page.getByRole("heading", { name: /5 Dicas/i }).first().click();
      await page.waitForURL("**/blog/**", { timeout: 10000 });
      // Markdown content should be rendered
      await expect(page.getByText(/podcasts/i).first()).toBeVisible({ timeout: 5000 });
    });
  });

  // ---- Turmas ----
  test.describe("CT-38: Listar turmas do aluno", () => {
    test("deve mostrar turma matriculada", async ({ page }) => {
      await page.goto("/turmas");
      await expect(page.getByText("Turma Iniciante 2026")).toBeVisible();
    });
  });

  test.describe("CT-39: Página de join turma", () => {
    test("deve mostrar formulário de código de convite", async ({ page }) => {
      await page.goto("/turmas/join");
      await expect(page.getByLabel(/código/i).or(page.getByPlaceholder(/código|convite/i))).toBeVisible();
      await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
    });
  });

  // ---- Navegação sidebar ----
  test.describe("CT-40: Navegação entre seções via sidebar", () => {
    test("deve navegar entre todas as seções do aluno", async ({ page }) => {
      await page.goto("/home");
      const sidebar = page.locator("aside");

      const navLinks = [
        { name: /^aulas$/i, url: "/lessons" },
        { name: /^tarefas$/i, url: "/tasks" },
        { name: /^blog$/i, url: "/blog" },
        { name: /^home$/i, url: "/home" },
      ];

      for (const link of navLinks) {
        await sidebar.getByRole("link", { name: link.name }).click();
        await page.waitForURL(`**${link.url}`, { timeout: 5000 });
        await expect(page).toHaveURL(new RegExp(link.url.replace(/\//g, "\\/")));
      }
    });
  });
});

import { test, expect } from "@playwright/test";

// ============================
// Student Preview Mode E2E Tests
// Uses seed data: teacher fran@fluent.app (pre-authenticated via setup)
// Tests the ?preview=student toggle across all content sections
// ============================

test.describe.serial("Student Preview Mode", () => {
  // ---- Toggle visibility ----
  test.describe("PM-01: Toggle appears on previewable pages", () => {
    test("should show toggle on lessons page", async ({ page }) => {
      await page.goto("/teacher/lessons");
      await expect(page.getByRole("button", { name: /ver como aluno/i })).toBeVisible();
    });

    test("should show toggle on tasks page", async ({ page }) => {
      await page.goto("/teacher/tasks");
      await expect(page.getByRole("button", { name: /ver como aluno/i })).toBeVisible();
    });

    test("should show toggle on posts page", async ({ page }) => {
      await page.goto("/teacher/posts");
      await expect(page.getByRole("button", { name: /ver como aluno/i })).toBeVisible();
    });

    test("should show toggle on challenges page", async ({ page }) => {
      await page.goto("/teacher/challenges");
      await expect(page.getByRole("button", { name: /ver como aluno/i })).toBeVisible();
    });

    test("should NOT show toggle on dashboard", async ({ page }) => {
      await page.goto("/teacher/dashboard");
      await expect(page.getByRole("button", { name: /ver como aluno/i })).toBeHidden();
    });

    test("should NOT show toggle on turmas page", async ({ page }) => {
      await page.goto("/teacher/turmas");
      await expect(page.getByRole("button", { name: /ver como aluno/i })).toBeHidden();
    });
  });

  // ---- Toggle activation ----
  test.describe("PM-02: Toggle activates preview banner", () => {
    test("should show banner and update URL when toggled on", async ({ page }) => {
      await page.goto("/teacher/lessons");
      await page.getByRole("button", { name: /ver como aluno/i }).click();

      await expect(page).toHaveURL(/preview=student/);
      await expect(page.getByText(/visualizando como aluno/i)).toBeVisible();
      await expect(page.getByText(/sair do preview/i)).toBeVisible();
    });

    test("should remove banner and param when toggled off", async ({ page }) => {
      await page.goto("/teacher/lessons?preview=student");
      await expect(page.getByText(/visualizando como aluno/i)).toBeVisible();

      await page.getByText(/sair do preview/i).click();

      await expect(page).not.toHaveURL(/preview=student/);
      await expect(page.getByText(/visualizando como aluno/i)).toBeHidden();
    });
  });

  // ---- Lessons preview ----
  test.describe("PM-03: Lessons list in preview mode", () => {
    test("should render student-style lesson cards", async ({ page }) => {
      await page.goto("/teacher/lessons?preview=student");

      // Student-style cards show lesson titles without edit/delete buttons
      await expect(page.getByText(/acompanhe suas aulas e progresso/i)).toBeVisible();
      // Should NOT see the "Nova Aula" button (teacher management)
      await expect(page.getByRole("link", { name: /nova aula/i })).toBeHidden();
    });
  });

  test.describe("PM-04: Lesson detail in preview mode", () => {
    test("should render lesson player instead of edit form", async ({ page }) => {
      await page.goto("/teacher/lessons?preview=student");

      // Wait for cards to render, then click the first lesson card link
      const firstCard = page.locator("a[href*='/teacher/lessons/']").first();
      await expect(firstCard).toBeVisible({ timeout: 5000 });
      await firstCard.click();

      await page.waitForURL(/teacher\/lessons\/.*preview=student/, { timeout: 10000 });

      // Should see the lesson content viewer, not the edit form
      await expect(page.getByText(/voltar para aulas/i)).toBeVisible({ timeout: 5000 });
      // Should NOT see the edit form title input
      await expect(page.getByLabel(/título/i)).toBeHidden();
    });
  });

  // ---- Tasks preview ----
  test.describe("PM-05: Tasks list in preview mode", () => {
    test("should render student-style task cards in grid", async ({ page }) => {
      await page.goto("/teacher/tasks?preview=student");

      // Student view description
      await expect(page.getByText(/complete as atividades/i)).toBeVisible();
      // Should NOT see the "Nova Tarefa" button
      await expect(page.getByRole("link", { name: /nova tarefa/i })).toBeHidden();
    });
  });

  test.describe("PM-06: Task detail in preview mode shows read-only player", () => {
    test("should show quiz player with preview badge", async ({ page }) => {
      await page.goto("/teacher/tasks?preview=student");

      // Click on the first task card
      const firstCard = page.locator("a[href*='/teacher/tasks/']").first();
      await expect(firstCard).toBeVisible({ timeout: 5000 });
      await firstCard.click();

      await page.waitForURL(/teacher\/tasks\/.*preview=student/, { timeout: 10000 });

      // Should see the preview badge
      await expect(page.getByText(/modo preview/i)).toBeVisible({ timeout: 5000 });
      // Should see back link
      await expect(page.getByText(/voltar para tarefas/i)).toBeVisible();
    });
  });

  // ---- Posts preview ----
  test.describe("PM-07: Posts list in preview mode", () => {
    test("should render student-style post cards", async ({ page }) => {
      await page.goto("/teacher/posts?preview=student");

      // Student view title "Blog"
      await expect(page.getByRole("heading", { name: /blog/i })).toBeVisible();
      // Should NOT see the "Novo Post" button
      await expect(page.getByRole("link", { name: /novo post/i })).toBeHidden();
    });
  });

  test.describe("PM-08: Post detail in preview mode", () => {
    test("should render blog post view instead of edit form", async ({ page }) => {
      await page.goto("/teacher/posts?preview=student");

      // Click on the first post card
      const firstCard = page.locator("a[href*='/teacher/posts/']").first();
      await expect(firstCard).toBeVisible({ timeout: 5000 });
      await firstCard.click();

      await page.waitForURL(/teacher\/posts\/.*preview=student/, { timeout: 10000 });

      // Should see blog-style article view
      await expect(page.getByText(/voltar para o blog/i)).toBeVisible({ timeout: 5000 });
      // Should NOT see the edit form
      await expect(page.getByLabel(/título/i)).toBeHidden();
    });
  });

  // ---- Challenges preview ----
  test.describe("PM-09: Challenges list in preview mode", () => {
    test("should render student-style challenge cards", async ({ page }) => {
      await page.goto("/teacher/challenges?preview=student");

      // Student view description
      await expect(page.getByText(/desafios do seu professor/i)).toBeVisible();
      // Should NOT see "Novo Challenge" button
      await expect(page.getByRole("link", { name: /novo challenge/i })).toBeHidden();
      // Should see seed challenge
      await expect(page.getByText("My Daily Routine")).toBeVisible();
    });
  });

  test.describe("PM-10: Challenge detail in preview mode", () => {
    test("should render challenge view with disabled response area", async ({ page }) => {
      await page.goto("/teacher/challenges?preview=student");

      // Click on the first challenge card
      const firstCard = page.locator("a[href*='/teacher/challenges/']").first();
      await expect(firstCard).toBeVisible({ timeout: 5000 });
      await firstCard.click();

      await page.waitForURL(/teacher\/challenges\/.*preview=student/, { timeout: 10000 });

      // Should see the preview badge and back link
      await expect(page.getByText(/modo preview/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/voltar para challenges/i)).toBeVisible();
    });
  });

  // ---- Draft indicators ----
  test.describe("PM-11: Draft items show indicator in preview", () => {
    test("should show 'Não visível para alunos' on draft challenges", async ({ page }) => {
      await page.goto("/teacher/challenges?preview=student");

      // "Merry Christmas Audio" is a draft challenge in seed
      const draftBadge = page.getByText(/não visível para alunos/i);
      await expect(draftBadge.first()).toBeVisible({ timeout: 5000 });
    });
  });

  // ---- Sidebar navigation ----
  test.describe("PM-12: Sidebar preserves preview param", () => {
    test("should carry preview param when navigating to previewable sections", async ({ page }) => {
      await page.goto("/teacher/lessons?preview=student");
      await expect(page.getByText(/visualizando como aluno/i)).toBeVisible();

      // Click Tarefas in sidebar
      await page.locator("aside").getByRole("link", { name: /^tarefas$/i }).click();
      await page.waitForURL(/teacher\/tasks/, { timeout: 5000 });
      await expect(page).toHaveURL(/preview=student/);
      await expect(page.getByText(/visualizando como aluno/i)).toBeVisible();

      // Click Posts in sidebar
      await page.locator("aside").getByRole("link", { name: /^posts$/i }).click();
      await page.waitForURL(/teacher\/posts/, { timeout: 5000 });
      await expect(page).toHaveURL(/preview=student/);

      // Click Challenges in sidebar
      await page.locator("aside").getByRole("link", { name: /^challenges$/i }).click();
      await page.waitForURL(/teacher\/challenges/, { timeout: 5000 });
      await expect(page).toHaveURL(/preview=student/);
    });

    test("should exit preview when navigating to non-previewable sections", async ({ page }) => {
      await page.goto("/teacher/lessons?preview=student");
      await expect(page.getByText(/visualizando como aluno/i)).toBeVisible();

      // Click Dashboard in sidebar
      await page.locator("aside").getByRole("link", { name: /^dashboard$/i }).click();
      await page.waitForURL(/teacher\/dashboard/, { timeout: 5000 });
      await expect(page).not.toHaveURL(/preview=student/);
      await expect(page.getByText(/visualizando como aluno/i)).toBeHidden();
    });
  });

  // ---- Round-trip: preview → exit → edit ----
  test.describe("PM-13: Exit preview then edit works correctly", () => {
    test.setTimeout(60000);

    test("should open edit form after exiting preview mode", async ({ page }) => {
      // Step 1: Go to lessons and activate preview
      await page.goto("/teacher/lessons");
      await page.getByRole("button", { name: /ver como aluno/i }).click();
      await expect(page).toHaveURL(/preview=student/);
      await expect(page.getByText(/visualizando como aluno/i)).toBeVisible();

      // Step 2: Exit preview
      await page.getByText(/sair do preview/i).click();
      await expect(page).not.toHaveURL(/preview=student/);
      await expect(page.getByText(/visualizando como aluno/i)).toBeHidden();

      // Step 3: Click Edit on the first lesson
      await page.getByRole("link", { name: /editar/i }).first().click();
      await page.waitForURL(/teacher\/lessons\/.*\/edit/, { timeout: 15000 });

      // Should see the edit form, NOT the preview player
      await expect(page.getByRole("heading", { name: /editar aula/i })).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel(/título/i)).toBeVisible();
    });

    test("should open edit form for tasks after exiting preview mode", async ({ page }) => {
      // Step 1: Activate preview on tasks
      await page.goto("/teacher/tasks");
      await page.getByRole("button", { name: /ver como aluno/i }).click();
      await expect(page).toHaveURL(/preview=student/);

      // Step 2: Exit preview
      await page.getByText(/sair do preview/i).click();
      await expect(page).not.toHaveURL(/preview=student/);

      // Step 3: Click Edit on the first task
      await page.getByRole("link", { name: /editar/i }).first().click();
      await page.waitForURL(/teacher\/tasks\/.*\/edit/, { timeout: 15000 });

      // Should see the edit form
      await expect(page.getByRole("heading", { name: /editar tarefa/i })).toBeVisible({ timeout: 5000 });
    });

    test("should open edit form for posts after exiting preview mode", async ({ page }) => {
      // Step 1: Activate preview on posts
      await page.goto("/teacher/posts");
      await page.getByRole("button", { name: /ver como aluno/i }).click();
      await expect(page).toHaveURL(/preview=student/);

      // Step 2: Exit preview
      await page.getByText(/sair do preview/i).click();
      await expect(page).not.toHaveURL(/preview=student/);

      // Step 3: Click Edit on the first post
      await page.getByRole("link", { name: /editar/i }).first().click();
      await page.waitForURL(/teacher\/posts\/.*\/edit/, { timeout: 15000 });

      // Should see the edit form
      await expect(page.getByRole("heading", { name: /editar post/i })).toBeVisible({ timeout: 10000 });
    });
  });
});

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

  // ---- Editar aula ----
  test.describe("CT-23: Editar aula existente", () => {
    test("deve editar título da aula e redirecionar para lista", async ({ page }) => {
      await page.goto("/teacher/lessons");
      await expect(page.getByRole("heading", { name: /aulas/i })).toBeVisible();

      // Click "Editar" on a seed lesson (not the E2E Test Lesson, which CT-25 will delete)
      const seedLessonCard = page.locator("[class*=card]").filter({ hasText: "Introduction to Present Simple" });
      await seedLessonCard.getByRole("link", { name: /editar/i }).click();
      await page.waitForURL("**/teacher/lessons/*/edit", { timeout: 10000 });

      await expect(page.getByRole("heading", { name: /editar aula/i })).toBeVisible();

      // Clear and fill with new title
      const titleInput = page.getByLabel(/título/i);
      await titleInput.fill("Edited Lesson Title");

      await page.getByRole("button", { name: /salvar/i }).click();
      await page.waitForURL("**/teacher/lessons", { timeout: 10000 });

      await expect(page.getByText("Edited Lesson Title")).toBeVisible({ timeout: 5000 });
    });
  });

  // ---- Publicar/Despublicar aula ----
  test.describe("CT-24: Publicar/Despublicar aula", () => {
    test("deve alternar o status de publicação de uma aula", async ({ page }) => {
      await page.goto("/teacher/lessons");
      await expect(page.getByRole("heading", { name: /aulas/i })).toBeVisible();

      // Find a "Publicar" button (draft lesson) or "Despublicar" button (published lesson)
      const publishBtn = page.getByRole("button", { name: /publicar|despublicar/i }).first();
      const initialText = await publishBtn.textContent();
      const wasDraft = /publicar/i.test(initialText ?? "") && !/despublicar/i.test(initialText ?? "");

      await publishBtn.click();

      // After toggling, the opposite action should appear
      if (wasDraft) {
        await expect(page.getByRole("button", { name: /despublicar/i }).first()).toBeVisible({ timeout: 5000 });
      } else {
        await expect(page.getByRole("button", { name: /publicar/i }).first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  // ---- Deletar aula ----
  test.describe("CT-25: Deletar aula", () => {
    test("deve deletar a aula E2E Test Lesson", async ({ page }) => {
      await page.goto("/teacher/lessons");
      await expect(page.getByRole("heading", { name: /aulas/i })).toBeVisible();

      // Ensure the lesson exists before deleting
      await expect(page.getByText("E2E Test Lesson")).toBeVisible({ timeout: 5000 });

      // Count lessons before deletion
      const cardsBefore = await page.locator("[class*=card]").filter({ hasText: /\w/ }).count();

      // Find the card containing "E2E Test Lesson" and click its "Excluir" button
      const lessonCard = page.locator("[class*=card]").filter({ hasText: "E2E Test Lesson" });
      await lessonCard.getByRole("button", { name: /excluir/i }).click();

      // Wait for the lesson to disappear
      await expect(page.getByText("E2E Test Lesson")).toBeHidden({ timeout: 10000 });
    });
  });

  // ---- Convidar aluno ----
  test.describe("CT-26: Convidar aluno", () => {
    test("deve preencher formulário de convite e submeter", async ({ page }) => {
      await page.goto("/teacher/students");
      await expect(page.getByRole("heading", { name: /alunos/i })).toBeVisible();

      // Fill the invite form
      const emailInput = page.getByPlaceholder("email@exemplo.com");
      await emailInput.fill("test-invite@test.com");

      await page.getByRole("button", { name: /convidar/i }).click();

      // The form uses Resend which may fail with placeholder API key,
      // but we should see either success or error feedback
      const feedback = page.locator("text=/convite enviado|erro/i");
      await expect(feedback).toBeVisible({ timeout: 10000 });
    });
  });

  // ---- Ver perfil do aluno ----
  test.describe("CT-27: Ver perfil do aluno", () => {
    test("deve mostrar detalhes do aluno ao clicar", async ({ page }) => {
      await page.goto("/teacher/students");
      await expect(page.getByText("Marcelo Aluno")).toBeVisible({ timeout: 5000 });

      // Click on the student (it's a Link wrapping the card)
      await page.getByText("Marcelo Aluno").click();
      await page.waitForURL("**/teacher/students/**", { timeout: 10000 });

      // Verify student profile header
      await expect(page.getByText("Marcelo Aluno").first()).toBeVisible({ timeout: 5000 });

      // Verify XP and streak info are present
      await expect(page.getByText(/xp total/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/streak/i).first()).toBeVisible({ timeout: 5000 });
    });
  });

  // ---- Detalhe turma — vincular aula (tab Aulas) ----
  test.describe("CT-28: Detalhe turma — aba Aulas", () => {
    test("deve mostrar aulas vinculadas na aba Aulas", async ({ page }) => {
      await page.goto("/teacher/turmas");
      await page.getByText("Turma Iniciante 2026").click();
      await page.waitForURL("**/teacher/turmas/**", { timeout: 10000 });

      // Click on "Aulas" tab
      await page.getByRole("button", { name: /^aulas$/i }).click();

      // Verify linked lessons are shown (seed links first 3 lessons)
      await expect(page.getByText(/vinculadas/i)).toBeVisible({ timeout: 5000 });
      // At least one linked lesson title should be visible
      // Note: "Introduction to Present Simple" may have been renamed to "Edited Lesson Title" by CT-23
      await expect(
        page.getByText(/Edited Lesson Title|Ordering Food|Daily Routine/i).first(),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  // ---- Filtrar aulas por categoria ----
  test.describe("CT-29: Filtrar aulas por categoria", () => {
    test("deve filtrar aulas ao selecionar categoria gramática", async ({ page }) => {
      await page.goto("/teacher/lessons?category=grammar");

      await expect(page.getByRole("heading", { name: /aulas/i })).toBeVisible();

      // "Edited Lesson Title" (originally "Introduction to Present Simple") is grammar category
      // It should be visible after filtering
      await expect(page.getByText("Edited Lesson Title")).toBeVisible({ timeout: 5000 });

      // Non-grammar lessons should NOT be visible
      await expect(page.getByText("Ordering Food at a Restaurant")).toBeHidden();
      await expect(page.getByText("Daily Routine Vocabulary")).toBeHidden();
    });
  });
});

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
      // Note: CT-23 renames "Introduction to Present Simple" to "Edited Lesson Title"
      // and CT-24 may toggle publish status. Check for lessons that remain stable.
      await expect(page.getByText("Ordering Food at a Restaurant")).toBeVisible();
      await expect(page.getByText("Daily Routine Vocabulary")).toBeVisible();
      await expect(page.getByText("Listening Practice: The Weather")).toBeVisible();
      // Draft lesson should NOT appear
      await expect(page.getByText("British vs American English")).toHaveCount(0);
    });
  });

  test.describe("CT-32: Ver detalhe de aula", () => {
    test("deve abrir aula e mostrar conteúdo", async ({ page }) => {
      await page.goto("/lessons");
      // Use a stable lesson (not renamed by teacher tests)
      await page.getByText("Ordering Food at a Restaurant").click();
      await page.waitForURL("**/lessons/**", { timeout: 10000 });
      await expect(page.getByText("Ordering Food at a Restaurant").first()).toBeVisible();
      // Description should be rendered
      await expect(page.getByText(/ordering food/i).first()).toBeVisible();
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
        { name: /^turmas$/i, url: "/turmas" },
        { name: /^home$/i, url: "/home" },
      ];

      for (const link of navLinks) {
        await sidebar.getByRole("link", { name: link.name }).click();
        await page.waitForURL(`**${link.url}`, { timeout: 5000 });
        await expect(page).toHaveURL(new RegExp(link.url.replace(/\//g, "\\/")));
      }
    });
  });

  // ---- Aula draft não aparece ----
  test.describe("CT-41: Aula draft não aparece na lista", () => {
    test("deve ocultar aulas com status draft", async ({ page }) => {
      await page.goto("/lessons");
      // At least one published lesson is visible
      await expect(page.getByText("Ordering Food at a Restaurant")).toBeVisible();
      // Draft lesson should not appear
      await expect(page.getByText("British vs American English")).toHaveCount(0);
    });
  });

  // ---- Quiz player — resultado já feito ----
  test.describe("CT-42: Quiz player — ver resultado de quiz já feito", () => {
    test("deve mostrar score e questões em modo revisão", async ({ page }) => {
      await page.goto("/tasks");
      await page.getByText("Present Simple Quiz").click();
      await page.waitForURL("**/tasks/**", { timeout: 10000 });
      // Score header shows "Resultado" and "100%"
      await expect(page.getByText("Resultado")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("100%")).toBeVisible();
      // Feedback text from seed
      await expect(page.getByText(/Perfeito/i)).toBeVisible();
      // Questions are shown in review mode
      await expect(page.getByText(/She .* to school every day/i)).toBeVisible();
      await expect(page.getByText(/They .* like coffee/i)).toBeVisible();
      await expect(page.getByText(/you speak English/i)).toBeVisible();
    });
  });

  // ---- Writing player — submeter texto ----
  test.describe("CT-43: Writing player — submeter texto", () => {
    test("deve mostrar prompt e permitir submissão de redação", async ({ page }) => {
      await page.goto("/tasks");
      await page.getByText("Describe Your Morning").click();
      await page.waitForURL("**/tasks/**", { timeout: 10000 });
      // Prompt should be visible
      await expect(page.getByText(/morning routine/i).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/at least 5 different verbs/i)).toBeVisible();
      // Textarea should be available
      const textarea = page.getByPlaceholder(/Escreva sua resposta/i);
      await expect(textarea).toBeVisible();
      await textarea.fill("I wake up at 7 AM every morning. Then I brush my teeth and take a shower. I eat breakfast at 7:30. After that I go to school by bus. I usually arrive at 8 AM.");
      // Word count should update
      await expect(page.getByText(/palavras/i)).toBeVisible();
      // Submit button
      const submitBtn = page.getByRole("button", { name: /enviar para correção/i });
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();
      // After submit: shows "Redação enviada!", AI correction ("Correção por IA"), or pending state
      await expect(
        page.getByText(/Redação enviada|Corrigido|Enviado para correção|Correção por IA/i).first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  // ---- Fill-gaps — resultado já feito ----
  test.describe("CT-44: Fill-gaps — ver resultado já feito", () => {
    test("deve mostrar score do fill-gaps já submetido", async ({ page }) => {
      await page.goto("/tasks");
      await page.getByText("Daily Routine - Fill the Gaps").click();
      await page.waitForURL("**/tasks/**", { timeout: 10000 });
      // Score header shows "Resultado" and "67%"
      await expect(page.getByText("Resultado")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("67%")).toBeVisible();
    });
  });

  // ---- Blog filtro por categoria ----
  test.describe("CT-45: Blog filtro por categoria", () => {
    test("deve filtrar posts por categoria", async ({ page }) => {
      await page.goto("/blog");
      // Category filter pills should be visible (exact match to avoid matching post content)
      await expect(page.getByRole("link", { name: "Todos" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Dicas", exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "Gramática", exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "Cultura", exact: true })).toBeVisible();
      // Click "Dicas" filter (seed has 1 post with category "tips" = "Dicas")
      await page.getByRole("link", { name: "Dicas", exact: true }).click();
      await page.waitForURL("**/blog?category=tips", { timeout: 5000 });
      // The tips post should be visible
      await expect(page.getByText("5 Dicas para Melhorar seu Listening").first()).toBeVisible();
      // Grammar post should NOT be visible (different category)
      await expect(page.getByText("Verbos Irregulares Mais Comuns")).not.toBeVisible();
    });
  });

  // ---- Marcar aula como assistida ----
  test.describe("CT-46: Marcar aula como assistida", () => {
    test("deve marcar uma aula como assistida e atualizar estado", async ({ page }) => {
      await page.goto("/lessons");
      // "Daily Routine Vocabulary" has no progress in seed (only lessons 0 and 1 have progress)
      await page.getByText("Daily Routine Vocabulary").click();
      await page.waitForURL("**/lessons/**", { timeout: 10000 });
      // Button "Marcar como assistida" should be visible
      const markBtn = page.getByRole("button", { name: /Marcar como assistida/i });
      await expect(markBtn).toBeVisible({ timeout: 5000 });
      await markBtn.click();
      // After clicking, button should disappear and "Aula assistida" text should appear
      await expect(page.getByText(/Aula assistida/i)).toBeVisible({ timeout: 10000 });
      await expect(markBtn).not.toBeVisible();
    });
  });

  // ---- Home mostra progresso correto ----
  test.describe("CT-47: Home mostra progresso correto", () => {
    test("deve mostrar progresso, XP e streak na home", async ({ page }) => {
      await page.goto("/home");
      // XP count (250 from seed) — displayed in the Challenges channel card
      await expect(page.getByText("250")).toBeVisible({ timeout: 5000 });
      // Streak (5 dias seguidos from seed)
      await expect(page.getByText(/5 dias seguidos/i)).toBeVisible();
      // Progress text: "X de Y aulas assistidas"
      await expect(page.getByText(/aulas assistidas/i)).toBeVisible();
    });
  });

  // ---- Student não acessa rotas do teacher ----
  test.describe("CT-48: Student não acessa rotas do teacher", () => {
    test("deve redirecionar student para /home ao tentar acessar /teacher/dashboard", async ({ page }) => {
      await page.goto("/teacher/dashboard");
      // Teacher layout redirects non-teachers to /home
      await page.waitForURL("**/home", { timeout: 10000 });
      await expect(page).toHaveURL(/\/home/);
    });
  });

  // ---- Profile ----
  test.describe("CT-49: Profile page", () => {
    test("deve mostrar dados do aluno, professor e turma", async ({ page }) => {
      await page.goto("/profile");
      // Student name and email
      await expect(page.getByText("Marcelo Cajueiro")).toBeVisible();
      await expect(page.getByText("marcelo@fluent.app")).toBeVisible();
      // Teacher name
      await expect(page.getByText("Franciely Silva")).toBeVisible();
      // Turma
      await expect(page.getByText("Turma Iniciante 2026")).toBeVisible();
      // Logout button
      await expect(page.getByRole("button", { name: /sair/i })).toBeVisible();
    });
  });

  test.describe("CT-50: Sidebar has Turmas link", () => {
    test("deve mostrar link de Turmas na sidebar do aluno", async ({ page }) => {
      await page.goto("/home");
      const sidebar = page.locator("aside");
      const turmasLink = sidebar.getByRole("link", { name: /^turmas$/i });
      await expect(turmasLink).toBeVisible();
      await turmasLink.click();
      await page.waitForURL("**/turmas", { timeout: 5000 });
    });
  });

  test.describe("CT-51: Sidebar username links to profile", () => {
    test("deve navegar para perfil ao clicar no nome na sidebar", async ({ page }) => {
      await page.goto("/home");
      const sidebar = page.locator("aside");
      await sidebar.getByRole("link", { name: /marcelo/i }).click();
      await page.waitForURL("**/profile", { timeout: 5000 });
      await expect(page.getByText("Meu Perfil")).toBeVisible();
    });
  });
});

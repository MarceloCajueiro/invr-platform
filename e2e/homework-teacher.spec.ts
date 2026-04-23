import { test, expect } from "@playwright/test";

test.describe("Homework — teacher", () => {
  test("teacher vê badge HOMEWORK na listagem de tarefas (task do seed)", async ({
    page,
  }) => {
    await page.goto("/teacher/tasks");
    await expect(page.getByRole("heading", { name: /tarefas/i })).toBeVisible();

    // A task do seed "Present Simple Quiz" tem is_homework=true
    const quizRow = page.locator("text=Present Simple Quiz").first();
    await expect(quizRow).toBeVisible();

    // O badge "Homework" aparece no mesmo card (Card tem classe p-4)
    const card = quizRow.locator("xpath=ancestor::*[contains(@class,'p-4')][1]");
    await expect(card.getByText("Homework", { exact: true })).toBeVisible();
  });

  test("teacher abre editor da task homework e vê checkbox marcado + badge preview", async ({
    page,
  }) => {
    await page.goto("/teacher/tasks");

    // Clicar no Editar da task Present Simple Quiz
    const card = page
      .locator("text=Present Simple Quiz")
      .first()
      .locator("xpath=ancestor::*[contains(@class,'p-4')][1]");
    await card.getByRole("link", { name: /editar/i }).click();

    await page.waitForURL("**/edit", { timeout: 10000 });

    // Checkbox isHomework está marcado
    const checkbox = page.locator('input[name="isHomework"]');
    await expect(checkbox).toBeChecked();

    // Badge HomeworkBadge renderiza inline no formulário
    await expect(page.getByText(/homework/i).first()).toBeVisible();
  });

  test("teacher cria tarefa nova marcada como homework e vê badge na listagem", async ({
    page,
  }) => {
    await page.goto("/teacher/tasks/new");
    await expect(page.getByRole("heading", { name: /nova tarefa/i })).toBeVisible();

    await page.getByLabel(/título/i).fill("E2E Homework Writing");

    // Mudar type para writing (aceita apenas prompt, sem múltiplas questões)
    await page.locator('select[name="taskType"]').selectOption("writing");

    // Aguardar o QuestionEditor renderizar o WritingEditor
    await page.waitForTimeout(500);

    // Preencher o prompt de escrita
    await page.getByLabel(/prompt de escrita/i).fill("Write about homework.");

    // Marcar checkbox de homework
    await page.locator('input[name="isHomework"]').check();

    // Submeter
    await page.getByRole("button", { name: /criar tarefa/i }).click();

    // Aguardar redirect para a listagem
    await page.waitForURL("**/teacher/tasks", { timeout: 15000 });

    // A linha da task recém-criada deve conter o badge "Homework"
    const newRow = page
      .locator("text=E2E Homework Writing")
      .first()
      .locator("xpath=ancestor::*[contains(@class,'p-4')][1]");
    await expect(newRow.getByText("Homework", { exact: true })).toBeVisible();
  });
});

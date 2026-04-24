import { test, expect } from "@playwright/test";

test.describe("Homework — teacher", () => {
  test("teacher vê badge HOMEWORK na listagem de tarefas (task do seed)", async ({
    page,
  }) => {
    await page.goto("/teacher/tasks");
    await expect(page.getByRole("heading", { name: /tarefas/i })).toBeVisible();

    // A task do seed "Present Simple Quiz" tem is_homework=true — badge aparece no card
    const card = page
      .locator("[data-slot='card']")
      .filter({ hasText: "Present Simple Quiz" })
      .first();
    await expect(card.getByTestId("homework-badge")).toBeVisible();
  });

  test("teacher abre editor da task homework e vê checkbox marcado + badge preview", async ({
    page,
  }) => {
    await page.goto("/teacher/tasks");

    const card = page
      .locator("[data-slot='card']")
      .filter({ hasText: "Present Simple Quiz" })
      .first();
    await card.getByRole("link", { name: /editar/i }).click();

    await page.waitForURL("**/edit", { timeout: 10000 });

    // Checkbox isHomework está marcado
    const checkbox = page.locator('input[name="isHomework"]');
    await expect(checkbox).toBeChecked();

    // Badge HomeworkBadge renderiza inline no formulário (preview)
    await expect(page.getByTestId("homework-badge")).toBeVisible();
  });

  // CT-61: regressão do commit 72354ff — FormData omite checkboxes desmarcados,
  // e o fix garante que updateTask trate essa ausência como `false` em vez de
  // manter o valor antigo. Sem esse fix, desmarcar seria silenciosamente ignorado.
  test("CT-61: desmarcar isHomework em task existente persiste (regressão)", async ({
    page,
  }) => {
    // Estado inicial: seed tem "Present Simple Quiz" com isHomework=true.
    await page.goto("/teacher/tasks");
    const card = page
      .locator("[data-slot='card']")
      .filter({ hasText: "Present Simple Quiz" })
      .first();
    await expect(card.getByTestId("homework-badge")).toBeVisible();

    // Abre o editor, desmarca, salva.
    await card.getByRole("link", { name: /editar/i }).click();
    await page.waitForURL("**/edit", { timeout: 10000 });

    const checkbox = page.locator('input[name="isHomework"]');
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();

    await page.getByRole("button", { name: /salvar alterações/i }).click();
    await page.waitForURL("**/teacher/tasks", { timeout: 15000 });

    // Asserção: badge sumiu do card (valor false persistiu).
    const cardAfter = page
      .locator("[data-slot='card']")
      .filter({ hasText: "Present Simple Quiz" })
      .first();
    await expect(cardAfter.getByTestId("homework-badge")).toHaveCount(0);

    // Cleanup: re-marca pelo editor para preservar o estado do seed para
    // outros specs (homework-teacher/homework-student dependem disso).
    await cardAfter.getByRole("link", { name: /editar/i }).click();
    await page.waitForURL("**/edit", { timeout: 10000 });
    const cb = page.locator('input[name="isHomework"]');
    await cb.check();
    await expect(cb).toBeChecked();
    await page.getByRole("button", { name: /salvar alterações/i }).click();
    await page.waitForURL("**/teacher/tasks", { timeout: 15000 });
    await expect(
      page
        .locator("[data-slot='card']")
        .filter({ hasText: "Present Simple Quiz" })
        .first()
        .getByTestId("homework-badge"),
    ).toBeVisible();
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
    await expect(page.getByLabel(/prompt de escrita/i)).toBeVisible();

    // Preencher o prompt de escrita
    await page.getByLabel(/prompt de escrita/i).fill("Write about homework.");

    // Marcar checkbox de homework
    await page.locator('input[name="isHomework"]').check();

    // Submeter
    await page.getByRole("button", { name: /criar tarefa/i }).click();

    // Aguardar redirect para a listagem
    await page.waitForURL("**/teacher/tasks", { timeout: 15000 });

    // A linha da task recém-criada deve conter o badge Homework
    const newCard = page
      .locator("[data-slot='card']")
      .filter({ hasText: "E2E Homework Writing" })
      .first();
    await expect(newCard.getByTestId("homework-badge")).toBeVisible();
  });
});

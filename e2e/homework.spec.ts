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
});

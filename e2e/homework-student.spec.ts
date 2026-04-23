import { test, expect } from "@playwright/test";

test.describe("Homework — student", () => {
  test("student vê badge Homework na listagem /tasks", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByRole("heading", { name: /tarefas/i })).toBeVisible();

    // A task "Present Simple Quiz" tem is_homework=true no seed
    const quizCard = page.locator("text=Present Simple Quiz").first();
    await expect(quizCard).toBeVisible();

    // O badge "Homework" aparece no mesmo card
    const card = quizCard.locator("xpath=ancestor::a[1]");
    await expect(card.getByText("Homework", { exact: true })).toBeVisible();
  });

  test("student vê badge Homework na tela de detalhe da tarefa homework", async ({
    page,
  }) => {
    await page.goto("/tasks");

    // Clicar no card da task homework
    const quizLink = page
      .locator("text=Present Simple Quiz")
      .first()
      .locator("xpath=ancestor::a[1]");
    await quizLink.click();

    // Aguardar navegação para o detalhe
    await page.waitForURL("**/tasks/**", { timeout: 10000 });

    // Badge "Homework" aparece no header
    await expect(page.getByText("Homework", { exact: true }).first()).toBeVisible();
  });
});

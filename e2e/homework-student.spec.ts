import { test, expect } from "@playwright/test";

test.describe("Homework — student", () => {
  test("student vê badge Homework na listagem /tasks", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByRole("heading", { name: /tarefas/i })).toBeVisible();

    // Task "Present Simple Quiz" tem is_homework=true no seed — card tem o badge
    const homeworkCard = page
      .locator("[data-slot='card']")
      .filter({ hasText: "Present Simple Quiz" })
      .first();
    await expect(homeworkCard.getByTestId("homework-badge")).toBeVisible();

    // Card "Daily Routine - Fill the Gaps" NÃO é homework — não deve ter badge
    const nonHomeworkCard = page
      .locator("[data-slot='card']")
      .filter({ hasText: "Daily Routine - Fill the Gaps" })
      .first();
    await expect(nonHomeworkCard).toBeVisible();
    await expect(nonHomeworkCard.getByTestId("homework-badge")).toHaveCount(0);
  });

  test("student vê badge Homework na tela de detalhe da tarefa homework", async ({
    page,
  }) => {
    await page.goto("/tasks");

    // Clicar no card da task homework
    const homeworkCard = page
      .locator("[data-slot='card']")
      .filter({ hasText: "Present Simple Quiz" })
      .first();
    await homeworkCard.click();

    // Aguardar navegação para o detalhe
    await page.waitForURL("**/tasks/**", { timeout: 10000 });

    // Badge "Homework" aparece no header
    await expect(page.getByTestId("homework-badge").first()).toBeVisible();
  });
});

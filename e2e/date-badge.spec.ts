import { test, expect, type Page } from "@playwright/test";

// CT-62 a CT-65: cobrem o gap do PR #6 (DateBadge). Nenhum spec anterior
// garante que o card-agenda renderiza nos listings de aluno. Asserções são
// semânticas (<time datetime>, aria-label em pt-BR) para evitar acoplamento
// a classes Tailwind — segue a lição de 1cf983a.

async function countCardsAndBadges(
  page: Page,
  hrefPrefix: string,
): Promise<{ cards: number; badges: number }> {
  return await page.evaluate(({ prefix }) => {
    const cards = Array.from(
      document.querySelectorAll(`main a[href^="${prefix}"]`),
    ).filter((a) => a.querySelector("h3"));
    const badges = cards.filter((a) => a.querySelector("time[datetime]"));
    return { cards: cards.length, badges: badges.length };
  }, { prefix: hrefPrefix });
}

test.describe("DateBadge nos listings do aluno", () => {
  test("CT-62: cada card em /lessons tem DateBadge", async ({ page }) => {
    await page.goto("/lessons");
    await expect(page.getByRole("heading", { name: /aulas/i }).first()).toBeVisible();

    const { cards, badges } = await countCardsAndBadges(page, "/lessons/");
    expect(cards).toBeGreaterThan(0);
    expect(badges).toBe(cards);
  });

  test("CT-63: cada card em /tasks tem DateBadge", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByRole("heading", { name: /tarefas/i }).first()).toBeVisible();

    const { cards, badges } = await countCardsAndBadges(page, "/tasks/");
    expect(cards).toBeGreaterThan(0);
    expect(badges).toBe(cards);
  });

  test("CT-64: cada card em /blog tem DateBadge", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { name: /blog|fora da aula/i }).first()).toBeVisible();

    const { cards, badges } = await countCardsAndBadges(page, "/blog/");
    expect(cards).toBeGreaterThan(0);
    expect(badges).toBe(cards);
  });

  test("CT-65: DateBadge tem atributo datetime válido e aria-label em pt-BR", async ({
    page,
  }) => {
    await page.goto("/lessons");
    const firstBadge = page.locator("main time[datetime]").first();
    await expect(firstBadge).toBeVisible();

    const dt = await firstBadge.getAttribute("datetime");
    expect(dt).toBeTruthy();
    expect(Number.isNaN(new Date(dt!).getTime())).toBe(false);

    const aria = await firstBadge.getAttribute("aria-label");
    // Formato pt-BR: "DD de <mês> de YYYY" (ex.: "22 de abril de 2026")
    expect(aria).toMatch(
      /^\d{1,2} de (janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de \d{4}$/,
    );
  });
});

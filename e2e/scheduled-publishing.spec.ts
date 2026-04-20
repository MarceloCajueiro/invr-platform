import { test, expect } from "@playwright/test";

function toInputDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function createAndPublishLesson(
  page: import("@playwright/test").Page,
  title: string,
  publishedAtIso: string,
) {
  await page.goto("/teacher/lessons/new");
  await page.getByLabel(/título/i).fill(title);
  await page.getByLabel(/data de publicação/i).fill(publishedAtIso);
  await page.getByRole("checkbox", { name: /turma iniciante/i }).check();
  await page.getByRole("button", { name: /criar aula/i }).click();
  await page.waitForURL("**/teacher/lessons", { timeout: 10000 });

  const card = page.locator(`h3:has-text("${title}")`).locator("xpath=ancestor::*[contains(@class,'p-4')][1]");
  await card.getByRole("button", { name: /^publicar$/i }).click();
}

test.describe("Scheduled publishing", () => {
  test("teacher schedules lesson for tomorrow; student does not see it", async ({
    browser,
  }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const title = `E2E Scheduled ${Date.now()}`;

    const teacherCtx = await browser.newContext({
      storageState: "e2e/.auth/teacher.json",
    });
    const teacherPage = await teacherCtx.newPage();
    await createAndPublishLesson(teacherPage, title, toInputDate(tomorrow));

    const card = teacherPage
      .locator(`h3:has-text("${title}")`)
      .locator("xpath=ancestor::*[contains(@class,'p-4')][1]");
    await expect(card.getByText(/Agendado/i)).toBeVisible({ timeout: 5000 });
    await teacherCtx.close();

    const studentCtx = await browser.newContext({
      storageState: "e2e/.auth/student.json",
    });
    const studentPage = await studentCtx.newPage();
    await studentPage.goto("/lessons");
    await expect(studentPage.getByText(title)).toHaveCount(0);
    await studentCtx.close();
  });

  test("teacher publishes lesson for today; student sees it", async ({
    browser,
  }) => {
    const today = new Date();
    const title = `E2E Today ${Date.now()}`;

    const teacherCtx = await browser.newContext({
      storageState: "e2e/.auth/teacher.json",
    });
    const teacherPage = await teacherCtx.newPage();
    await createAndPublishLesson(teacherPage, title, toInputDate(today));
    await teacherCtx.close();

    const studentCtx = await browser.newContext({
      storageState: "e2e/.auth/student.json",
    });
    const studentPage = await studentCtx.newPage();
    await studentPage.goto("/lessons");
    await expect(studentPage.getByText(title)).toBeVisible({ timeout: 5000 });
    await studentCtx.close();
  });
});

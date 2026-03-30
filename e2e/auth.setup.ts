import { test as setup, expect } from "@playwright/test";

const TEACHER = { email: "fran@fluent.app", password: "senha12345" };
const STUDENT = { email: "marcelo@fluent.app", password: "senha12345" };

setup("authenticate teacher", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(TEACHER.email);
  await page.getByLabel("Senha").fill(TEACHER.password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL("**/teacher/dashboard", { timeout: 15000 });
  await expect(page).toHaveURL(/\/teacher\/dashboard/);
  await page.context().storageState({ path: "e2e/.auth/teacher.json" });
});

setup("authenticate student", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(STUDENT.email);
  await page.getByLabel("Senha").fill(STUDENT.password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL("**/home", { timeout: 15000 });
  await expect(page).toHaveURL(/\/home/);
  await page.context().storageState({ path: "e2e/.auth/student.json" });
});

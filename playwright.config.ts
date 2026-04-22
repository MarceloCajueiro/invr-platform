import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "teacher",
      testMatch: /teacher\.spec\.ts|preview-mode\.spec\.ts/,
      use: {
        browserName: "chromium",
        storageState: "e2e/.auth/teacher.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "student",
      testMatch: /student\.spec\.ts/,
      use: {
        browserName: "chromium",
        storageState: "e2e/.auth/student.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "auth",
      testMatch: /auth\.spec\.ts/,
      use: { browserName: "chromium" },
    },
    {
      name: "scheduled",
      testMatch: /scheduled-publishing\.spec\.ts/,
      use: { browserName: "chromium" },
      dependencies: ["setup"],
    },
  ],
});

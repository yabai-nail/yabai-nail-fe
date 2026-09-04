import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_WEB_PORT ?? 3100);
const baseURL = process.env.E2E_WEB_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_WEB_URL
    ? undefined
    : {
        command: `pnpm exec next dev -p ${port}`,
        url: baseURL,
        env: {
          ...process.env,
          NEXT_PUBLIC_API_URL:
            process.env.E2E_API_URL ?? "http://localhost:4000/api/v1",
        },
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});

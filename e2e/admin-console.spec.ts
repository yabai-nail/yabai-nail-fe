import { expect, test, type Page } from "@playwright/test";

const phone = process.env.E2E_ADMIN_PHONE ?? "";
const password = process.env.E2E_ADMIN_PASSWORD ?? "";

const adminRoutes = [
  "/admin",
  "/admin/appointments",
  "/admin/customers",
  "/admin/messages",
  "/admin/services",
  "/admin/staff",
  "/admin/payments",
  "/admin/reviews",
  "/admin/marketing",
  "/admin/nail-designs",
  "/admin/operations",
  "/admin/reports",
  "/admin/branches",
  "/admin/audit-logs",
  "/admin/accounts",
  "/admin/settings",
] as const;

async function login(page: Page) {
  if (!phone || !password) {
    throw new Error("E2E_ADMIN_PHONE and E2E_ADMIN_PASSWORD are required for admin E2E");
  }
  await page.goto("/admin");
  await page.locator("#admin-login-phone").fill(phone);
  await page.locator("#admin-login-password").fill(password);
  await page.locator("form").press("Enter");
  await expect(page.locator("#admin-login-phone")).toBeHidden();
}

test("the protected console presents a usable sign-in form", async ({ page }) => {
  await page.goto("/admin/customers");
  await expect(page.locator("#admin-login-phone")).toBeVisible();
  await expect(page.locator("#admin-login-password")).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: /hiện mật khẩu|show password|パスワードを表示/i }).click();
  await expect(page.locator("#admin-login-password")).toHaveAttribute("type", "text");
});

test.describe("authenticated console", () => {
  test.skip(!phone || !password, "Set E2E_ADMIN_PHONE and E2E_ADMIN_PASSWORD to test signed-in routes");
  test.beforeEach(async ({ page }) => login(page));

  test("every admin route renders without a runtime, translation or horizontal-overflow failure", async ({ page }) => {
    for (const route of adminRoutes) {
      await page.goto(route);
      await expect(page.locator("#admin-login-phone")).toBeHidden();
      await expect(page.locator("body")).not.toContainText(/Application error|Internal Server Error|SYSTEM_BUSY/);
      await expect(page.locator("body")).not.toContainText(/admin\.[a-z][\w.-]+/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), route).toBe(true);
    }
  });

  test("language cards respond when their visible card area is clicked", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.getByRole("tab", { name: /ngôn ngữ|language|言語/i }).click();
    const japanese = page.getByRole("radio", { name: "日本語" });
    await japanese.locator("xpath=ancestor::label").click({ position: { x: 8, y: 8 } });
    await expect(japanese).toBeChecked();
  });

  test("the customers console stays inside narrow and desktop viewports", async ({ page }) => {
    for (const viewport of [{ width: 375, height: 812 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/admin/customers");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    }
  });
});

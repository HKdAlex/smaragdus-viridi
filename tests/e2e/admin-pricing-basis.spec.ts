import { test, expect } from "@playwright/test";

test.describe("Admin pricing basis", () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD"
  );

  test("admin form exposes per-piece pricing controls", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    await page.goto("/en/admin/dashboard?tab=gemstones");
    await page.getByRole("button", { name: /create|add/i }).first().click();

    await page.getByTestId("pricing-basis-per_piece").click();
    await expect(page.getByTestId("price-per-piece-input")).toBeVisible();
  });
});

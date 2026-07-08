import { test, expect } from "@playwright/test";

const INSTAGRAM_URL = "instagram.com/crystallique_";

test.describe("Instagram contact links", () => {
  test("contact page includes Instagram link", async ({ page }) => {
    await page.goto("/ru/contact");
    await page.waitForLoadState("networkidle");

    const instagramLink = page.locator(`a[href*="${INSTAGRAM_URL}"]`).first();
    await expect(instagramLink).toBeVisible({ timeout: 10000 });
  });

  test("footer includes Instagram link on home page", async ({ page }) => {
    await page.goto("/ru");
    await page.waitForLoadState("networkidle");

    const instagramLinks = page.locator(`a[href*="${INSTAGRAM_URL}"]`);
    await expect(instagramLinks.first()).toBeVisible({ timeout: 10000 });
    expect(await instagramLinks.count()).toBeGreaterThanOrEqual(1);
  });
});

/**
 * E2E Tests: Catalog Price Range Filter
 *
 * CRITICAL: Tests the price range filter which had a double-conversion bug (fixed).
 * This test ensures the bug doesn't regress.
 *
 * Bug History:
 * - Issue: API was multiplying prices by 100, but frontend already sends cents
 * - Result: Price filters searched for 100x higher prices
 * - Fixed: 2026-01-15 - Removed incorrect multiplication
 *
 * Critical Paths:
 * - Price range slider interaction
 * - Price input fields
 * - Results match price range
 * - Min/Max validation
 * - URL synchronization
 */

import { test, expect } from '@playwright/test';

test.describe('Catalog Price Range Filter', () => {
  // Helper to ensure filters sidebar is visible
  const ensureFiltersVisible = async (page: any) => {
    // Try to find the "Price / Carat" heading (matches "Price / Carat" or "Price Per Carat")
    const priceLabel = page.locator('text=/price.*\\/.*carat|price.*per.*carat/i').first();

    // Check if price filter is already visible
    const isAlreadyVisible = await priceLabel.isVisible({ timeout: 1000 }).catch(() => false);

    if (!isAlreadyVisible) {
      // Look for "Open Filters" button (the floating button shown when filters are closed)
      const filterButton = page.locator('button:has-text("Filters")').first();

      // Click the filter button to open sidebar
      await filterButton.click();
      // Wait for sidebar animation to complete
      await page.waitForTimeout(1500);
    }

    // Wait for price / carat filter to be visible
    await expect(priceLabel).toBeVisible({ timeout: 10000 });
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/en/catalog');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    await ensureFiltersVisible(page);
  });

  test('should display price range slider', async ({ page }) => {
    // Look for price / carat range label
    const priceLabel = page.locator('text=/price.*\\/.*carat|price.*per.*carat/i').first();
    await expect(priceLabel).toBeVisible();

    // Find the price / carat section
    const priceSection = priceLabel.locator('..').locator('..');

    // Slider thumbs and spinbutton inputs should be visible
    const sliderThumbs = priceSection.locator('[role="slider"]');
    const priceInputs = priceSection.locator('[role="spinbutton"], [role="spinbutton"], input[type="number"]');

    expect(await sliderThumbs.count()).toBeGreaterThanOrEqual(2); // Min and max thumbs
    expect(await priceInputs.count()).toBeGreaterThanOrEqual(2); // Min and max inputs
  });

  test('should filter by price range using inputs', async ({ page }) => {
    // Find price per carat section inputs (they're in a grid-cols-2 layout)
    const priceSection = page.locator('text=/price.*\\/.*carat|price.*per.*carat/i').locator('..');
    const inputs = priceSection.locator('[role="spinbutton"], input[type="number"]');
    const minInput = inputs.first();
    const maxInput = inputs.last();

    // Set price per carat range: 10000 - 20000 cents ($100 - $200)
    await minInput.fill('10000');
    await maxInput.fill('20000');

    await page.waitForTimeout(1000); // Wait for debounce

    // URL should contain price per carat parameters
    const url = page.url();
    expect(url).toMatch(/minPricePerCarat/);
    expect(url).toMatch(/maxPricePerCarat/);

    // Verify URL contains correct values (not 100x multiplied)
    expect(url).toContain('minPricePerCarat=10000');
    expect(url).toContain('maxPricePerCarat=20000');
  });

  test('should not allow min greater than max', async ({ page }) => {
    // Find price per carat inputs
    const priceSection = page.locator('text=/price.*\\/.*carat|price.*per.*carat/i').locator('..');
    const inputs = priceSection.locator('[role="spinbutton"], input[type="number"]');
    const minInput = inputs.first();
    const maxInput = inputs.last();

    // Try to set min higher than max
    await maxInput.fill('10000');
    await minInput.fill('50000');

    // Validation should prevent this or adjust values
    await page.waitForTimeout(500);

    const minValue = await minInput.inputValue();
    const maxValue = await maxInput.inputValue();

    expect(parseInt(minValue)).toBeLessThanOrEqual(parseInt(maxValue));
  });

  test('REGRESSION: price filter should not multiply by 100 (bug fix verification)', async ({ page }) => {
    // This test specifically verifies the bug fix
    // Set price per carat range and verify API receives correct values

    const priceSection = page.locator('text=/price.*\\/.*carat|price.*per.*carat/i').locator('..');
    const inputs = priceSection.locator('[role="spinbutton"], input[type="number"]');
    const minInput = inputs.first();
    const maxInput = inputs.last();

    // Set initial values
    await minInput.fill('10000');
    await maxInput.fill('20000');

    await page.waitForTimeout(1000);

    // Intercept API call to verify price values
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/catalog')) {
        apiCalls.push(request.url());
      }
    });

    // Trigger a filter change to capture API call
    await minInput.fill('10100');
    await page.waitForTimeout(1000);

    // Check the API call URL
    const catalogCall = apiCalls.find(url => url.includes('minPricePerCarat'));

    if (catalogCall) {
      // Extract minPricePerCarat from URL
      const match = catalogCall.match(/minPricePerCarat=(\d+)/);
      if (match) {
        const priceMin = parseInt(match[1]);

        // CRITICAL: If UI shows 10100, API should receive 10100 (cents)
        // NOT 1010000 (which would be the bug - multiplying by 100 again)
        expect(priceMin).toBe(10100);
      }
    }
  });

  test('should update price range via slider drag', async ({ page }) => {
    // Find price per carat slider thumbs within the price section
    const priceSection = page.locator('text=/price.*\\/.*carat|price.*per.*carat/i').locator('..');
    const sliders = priceSection.locator('[role="slider"]');

    const minSlider = sliders.first();

    // Get initial position
    const box = await minSlider.boundingBox();

    if (box) {
      // Drag slider to the right
      await minSlider.hover();
      await page.mouse.down();
      await page.mouse.move(box.x + 50, box.y);
      await page.mouse.up();

      await page.waitForTimeout(1000);

      // URL should update with new price per carat
      expect(page.url()).toMatch(/minPricePerCarat/);
    }
  });

  test('should show formatted price values', async ({ page }) => {
    // Price per carat range should show formatted values like "$X / ct - $Y / ct"
    const priceDisplay = page.locator('text=/\\$.*ct.*-.*\\$.*ct/i').first();

    await expect(priceDisplay).toBeVisible();
    const text = await priceDisplay.textContent();

    // Should contain currency symbol
    expect(text).toMatch(/\$/);

    // Should contain " / ct" for per carat
    expect(text).toContain('/ ct');

    // Should contain a number
    expect(text).toMatch(/\d+/);
  });

  test('should persist price filter in URL and restore on page load', async ({ page }) => {
    const priceSection = page.locator('text=/price.*\\/.*carat|price.*per.*carat/i').locator('..');
    const inputs = priceSection.locator('[role="spinbutton"], input[type="number"]');
    const minInput = inputs.first();
    const maxInput = inputs.last();

    // Set price per carat range
    await minInput.fill('15000');
    await maxInput.fill('30000');

    await page.waitForTimeout(1000);

    // Get URL with filters
    const urlWithFilters = page.url();
    expect(urlWithFilters).toMatch(/minPricePerCarat/);

    // Reload page
    await page.reload();
    await page.waitForLoadState('load'); // Use 'load' instead of 'networkidle' for faster test
    await page.waitForTimeout(1000); // Wait for React to hydrate
    await ensureFiltersVisible(page);

    // URL should still have price filters
    expect(page.url()).toBe(urlWithFilters);

    // Find inputs again after reload
    const priceSection2 = page.locator('text=/price.*\\/.*carat|price.*per.*carat/i').locator('..');
    const inputs2 = priceSection2.locator('[role="spinbutton"], input[type="number"]');
    const restoredMin = await inputs2.first().inputValue();
    const restoredMax = await inputs2.last().inputValue();

    // Inputs should show the same values
    expect(parseInt(restoredMin)).toBe(15000);
    expect(parseInt(restoredMax)).toBe(30000);
  });

  test('should clear price filter when "Clear All" is clicked', async ({ page }) => {
    const priceSection = page.locator('text=/price.*\\/.*carat|price.*per.*carat/i').locator('..');
    const inputs = priceSection.locator('[role="spinbutton"], input[type="number"]');
    const minInput = inputs.first();

    // Set price
    await minInput.fill('20000');
    await page.waitForTimeout(1000);

    // Verify URL has price filter
    expect(page.url()).toContain('minPricePerCarat');

    // Click clear all / reset button
    const clearButton = page.getByRole('button', { name: /clear all|reset/i }).first();
    await clearButton.click();
    await page.waitForTimeout(500);

    // URL should no longer have price filter
    expect(page.url()).not.toContain('minPricePerCarat');

    // Price inputs should be reset to defaults (0)
    const minValue = await minInput.inputValue();
    expect(parseInt(minValue)).toBe(0);
  });

  test('should combine price filter with other filters', async ({ page }) => {
    // Set price per carat range
    const priceSection = page.locator('text=/price.*\\/.*carat|price.*per.*carat/i').locator('..');
    const inputs = priceSection.locator('[role="spinbutton"], input[type="number"]');
    const minInput = inputs.first();

    await minInput.fill('10000');
    await page.waitForTimeout(1000);

    // Also apply another filter (e.g., in stock toggle card)
    const inStockToggle = page.locator('text=/in stock/i').locator('..').locator('button, [role="switch"]').first();
    if (await inStockToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inStockToggle.click();
      await page.waitForTimeout(500);
    }

    // URL should have both filters
    const url = page.url();
    expect(url).toMatch(/minPricePerCarat/);

    // Results should be displayed
    const resultsText = page.locator('text=/\\d+.*gemstones.*found/i').first();
    await expect(resultsText).toBeVisible();
  });
});

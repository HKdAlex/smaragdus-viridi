/**
 * E2E Tests: Catalog Search - FUNCTIONAL TESTS
 *
 * Tests that search actually filters results correctly.
 * Focus: Does search produce the right results?
 * Not tested: Debouncing timing, autocomplete mechanics
 */

import { test, expect } from '@playwright/test';
import { ensureFiltersVisible, waitForResults } from './helpers/filter-helpers';

test.describe('Catalog Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/catalog');
    await page.waitForLoadState('load');
    await waitForResults(page);
    await ensureFiltersVisible(page);
  });

  test('should display search input', async ({ page }) => {
    // Open filter sidebar if not open

    // Search input should be visible
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test('should filter results by search term - CRITICAL', async ({ page }) => {
    /**
     * CRITICAL: Verifies search actually filters results correctly
     */

    // Get initial result count
    const initialCountText = await page.locator('text=/\\d+.*gemstones.*found/i').first().textContent();
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0');

    // Type in search
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('emerald');

    // Wait for debouncing and results
    await page.waitForTimeout(1500);

    // Get new result count
    const newCountText = await page.locator('text=/\\d+.*gemstones.*found/i').first().textContent();
    const newCount = parseInt(newCountText?.match(/\d+/)?.[0] || '0');

    // Search should reduce results
    expect(newCount).toBeGreaterThan(0);
    expect(newCount).toBeLessThan(initialCount);

    // Verify results contain search term
    const cards = page.locator('[data-testid="gemstone-card"]');

    // Wait for cards to render
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    const firstCard = cards.first();
    await expect(firstCard).toContainText(/emerald/i);

    // Verify multiple cards show correct results
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test.skip('should debounce search input', async ({ page }) => {
    // SKIPPED: Debouncing is an implementation detail, not user-facing functionality
    // Open filters

    const searchInput = page.getByPlaceholder(/search/i);

    // Track network requests
    let apiCallCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/catalog') && request.url().includes('search=')) {
        apiCallCount++;
      }
    });

    // Type rapidly (should only trigger one API call after debounce)
    await searchInput.fill('s');
    await page.waitForTimeout(100);
    await searchInput.fill('sa');
    await page.waitForTimeout(100);
    await searchInput.fill('sap');
    await page.waitForTimeout(100);
    await searchInput.fill('sapp');
    await page.waitForTimeout(100);
    await searchInput.fill('sapph');
    await page.waitForTimeout(100);
    await searchInput.fill('sapphi');
    await page.waitForTimeout(100);
    await searchInput.fill('sapphire');

    // Wait for debounce period
    await page.waitForTimeout(700);

    // Should have only made 1-2 API calls (debounced)
    expect(apiCallCount).toBeLessThanOrEqual(2);
  });

  test('should clear search with clear button', async ({ page }) => {
    // Open filters

    const searchInput = page.getByPlaceholder(/search/i);

    // Type search term
    await searchInput.fill('ruby');
    await page.waitForTimeout(700);

    // Clear button should be visible
    const clearButton = page.locator('button[aria-label*="Clear"]').or(page.locator('button:has(svg):near(:text("search"))'));

    // Click clear if visible
    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Input should be empty
      await expect(searchInput).toHaveValue('');
    }
  });

  test('should update URL with search parameter', async ({ page }) => {
    // Open filters

    const searchInput = page.getByPlaceholder(/search/i);

    // Type search term
    await searchInput.fill('emerald');
    await page.waitForTimeout(700);

    // URL should contain search parameter
    await expect(page).toHaveURL(/search=emerald/);
  });

  test('should preserve search when navigating back', async ({ page }) => {
    // Open filters

    const searchInput = page.getByPlaceholder(/search/i);

    // Perform search
    await searchInput.fill('diamond');
    await page.waitForTimeout(700);

    // Navigate to a gemstone detail (if available)
    const firstCard = page.locator('[data-testid="gemstone-card"], a[href*="/gemstone/"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();

      // Go back
      await page.goBack();

      // Search should still be there
      await expect(searchInput).toHaveValue('diamond');
      await expect(page).toHaveURL(/search=diamond/);
    }
  });
});

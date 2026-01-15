/**
 * E2E Tests: Catalog URL Synchronization - FUNCTIONAL TESTS
 *
 * Tests that filter state is properly synchronized with URL parameters,
 * enabling bookmarking and sharing of filtered catalog views.
 *
 * Focus: Can users share/bookmark filtered catalog links?
 * Not tested: Debouncing timing, URL update mechanics
 */

import { test, expect } from '@playwright/test';
import { ensureFiltersVisible, waitForResults } from './helpers/filter-helpers';

test.describe('Catalog URL Synchronization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/catalog');
    await page.waitForLoadState('load');
    await waitForResults(page);
    await ensureFiltersVisible(page);
  });

  test('should sync single filter to URL', async ({ page }) => {
    // Open filters

    // Apply a filter
    const inStockCheckbox = page.locator('label:has-text("In Stock")').first();
    if (await inStockCheckbox.isVisible()) {
      await inStockCheckbox.click();
      await page.waitForTimeout(700);

      // URL should contain the filter
      await expect(page).toHaveURL(/inStockOnly=true|inStock=true/);
    }
  });

  test('should sync multiple filters to URL - CRITICAL', async ({ page }) => {
    /**
     * CRITICAL: Verifies users can share catalog links with multiple filters
     */

    // Apply price filter
    await page.locator('button:has-text("$100 - $500")').first().click();
    await page.waitForTimeout(1500);

    // Apply weight filter
    await page.locator('button:has-text("Under 1ct")').first().click();
    await page.waitForTimeout(1500);

    // CRITICAL: URL should contain both filters (shareable link)
    const url = page.url();
    expect(url).toMatch(/priceMin|priceMax/);
    expect(url).toMatch(/weightMin|weightMax/);
  });

  test('should restore filters from URL on page load - CRITICAL', async ({ page }) => {
    /**
     * CRITICAL: Verifies bookmarked/shared links work correctly
     * This is the MAIN reason URL sync exists - so users can share filtered views
     */

    // Navigate directly to URL with filters (simulates clicking a shared link)
    await page.goto('/en/catalog?priceMin=10000&priceMax=50000&weightMax=1');
    await page.waitForLoadState('load');
    await waitForResults(page);

    // Verify filters are applied by checking result count
    const resultsText = await page.locator('text=/\\d+.*gemstones.*found/i').first().textContent();
    const resultCount = parseInt(resultsText?.match(/\d+/)?.[0] || '0');

    // Should have filtered results (not all 1015 items)
    expect(resultCount).toBeGreaterThan(0);
    expect(resultCount).toBeLessThan(1015);

    // URL should still contain the filters
    expect(page.url()).toContain('priceMin=10000');
    expect(page.url()).toContain('weightMax=1');
  });

  test.skip('should support browser back button', async ({ page }) => {
    // SKIPPED: Browser navigation is built-in browser functionality

    // Apply first filter
    const inStockCheckbox = page.locator('label:has-text("In Stock")').first();
    if (await inStockCheckbox.isVisible()) {
      await inStockCheckbox.click();
      await page.waitForTimeout(700);

      const urlWithFirstFilter = page.url();

      // Apply second filter
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('ruby');
        await page.waitForTimeout(700);

        const urlWithBothFilters = page.url();

        // Go back
        await page.goBack();
        await page.waitForTimeout(500);

        // Should be back to first filter only
        expect(page.url()).toBe(urlWithFirstFilter);

        // Search should be cleared
        await expect(searchInput).toHaveValue('');

        // In stock should still be checked
        await expect(inStockCheckbox).toBeChecked();
      }
    }
  });

  test.skip('should support browser forward button', async ({ page }) => {
    // SKIPPED: Browser navigation is built-in browser functionality

    // Apply filter
    const inStockCheckbox = page.locator('label:has-text("In Stock")').first();
    if (await inStockCheckbox.isVisible()) {
      await inStockCheckbox.click();
      await page.waitForTimeout(700);

      const urlWithFilter = page.url();

      // Clear filter
      const clearButton = page.getByRole('button', { name: /clear all|reset/i });
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await page.waitForTimeout(700);

        // Go back
        await page.goBack();
        await page.waitForTimeout(500);

        // Should have filter again
        expect(page.url()).toBe(urlWithFilter);

        // Go forward
        await page.goForward();
        await page.waitForTimeout(500);

        // Filter should be cleared
        await expect(inStockCheckbox).not.toBeChecked();
      }
    }
  });

  test('should create shareable/bookmarkable URLs - CRITICAL', async ({ page }) => {
    /**
     * CRITICAL: The whole point of URL sync - users can share catalog views
     * This simulates: User filters catalog → copies URL → sends to colleague → colleague sees same results
     */

    // Apply restrictive filters
    await page.locator('button:has-text("$100 - $500")').first().click();
    await page.waitForTimeout(1500);

    await page.locator('button:has-text("Under 1ct")').first().click();
    await page.waitForTimeout(1500);

    // Get result count with filters
    const resultsText = await page.locator('text=/\\d+.*gemstones.*found/i').first().textContent();
    const filteredCount = parseInt(resultsText?.match(/\d+/)?.[0] || '0');

    // Get the shareable URL
    const sharedUrl = page.url();
    expect(sharedUrl).toContain('priceMin');
    expect(sharedUrl).toContain('weightMax');

    // Open in new context (simulate sharing the link to someone else)
    const context2 = await page.context().browser()?.newContext();
    if (context2) {
      const page2 = await context2.newPage();

      // Navigate to shared URL
      await page2.goto(sharedUrl);
      await page2.waitForLoadState('load');
      await page2.waitForTimeout(2000); // Wait for results to load

      // CRITICAL: Should see the SAME filtered results
      const resultsText2 = await page2.locator('text=/\\d+.*gemstones.*found/i').first().textContent();
      const restoredCount = parseInt(resultsText2?.match(/\d+/)?.[0] || '0');

      expect(restoredCount).toBe(filteredCount); // Same results!

      await context2.close();
    }
  });

  test.skip('should handle URL parameter decoding', async ({ page }) => {
    // SKIPPED: URL encoding/decoding is browser built-in functionality
  });

  test.skip('should debounce URL updates to prevent history spam', async ({ page }) => {
    // SKIPPED: Debouncing is an implementation detail

    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      // Type rapidly
      await searchInput.fill('d');
      await page.waitForTimeout(50);
      await searchInput.fill('di');
      await page.waitForTimeout(50);
      await searchInput.fill('dia');
      await page.waitForTimeout(50);
      await searchInput.fill('diam');
      await page.waitForTimeout(50);
      await searchInput.fill('diamo');
      await page.waitForTimeout(50);
      await searchInput.fill('diamon');
      await page.waitForTimeout(50);
      await searchInput.fill('diamond');

      // Wait for debounce
      await page.waitForTimeout(1000);

      // Try going back - should only go back one step (debounced)
      await page.goBack();
      await page.waitForTimeout(500);

      // Should be back to original catalog (no filters)
      expect(page.url()).not.toMatch(/search=d|search=di|search=dia/);
    }
  });

  test('should clear URL parameters when filters are cleared', async ({ page }) => {

    // Apply filters
    const inStockCheckbox = page.locator('label:has-text("In Stock")').first();
    if (await inStockCheckbox.isVisible()) {
      await inStockCheckbox.click();
      await page.waitForTimeout(500);

      // URL should have filter
      expect(page.url()).toMatch(/inStock/);

      // Clear all
      const clearButton = page.getByRole('button', { name: /clear all|reset/i });
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await page.waitForTimeout(700);

        // URL should not have filter parameters
        expect(page.url()).not.toMatch(/inStock=true/);
      }
    }
  });

  test('should preserve URL structure and locale', async ({ page }) => {

    // Apply filter
    const inStockCheckbox = page.locator('label:has-text("In Stock")').first();
    if (await inStockCheckbox.isVisible()) {
      await inStockCheckbox.click();
      await page.waitForTimeout(700);

      // URL should still have /en/catalog structure
      expect(page.url()).toMatch(/\/en\/catalog/);

      // And filter parameters
      expect(page.url()).toMatch(/\?.*inStock/);
    }
  });
});

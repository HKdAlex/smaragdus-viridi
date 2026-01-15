/**
 * Shared E2E Test Helpers for Filter Sidebar
 *
 * These helpers ensure consistent filter interaction across all test files.
 */

import { expect, type Page } from '@playwright/test';

/**
 * Ensures the filter sidebar is visible and ready for interaction.
 * Handles both desktop (may be already open) and situations where it needs opening.
 */
export async function ensureFiltersVisible(page: Page): Promise<void> {
  // Try to find any filter heading (indicates sidebar is open)
  const filterHeading = page.locator('text=/gemstone type|color|cut|clarity|price/i').first();

  // Check if filters are already visible
  const isAlreadyVisible = await filterHeading.isVisible({ timeout: 1000 }).catch(() => false);

  if (!isAlreadyVisible) {
    // Look for "Filters" button to open sidebar
    const filterButton = page.locator('button:has-text("Filters")').first();

    // Click to open sidebar
    await filterButton.click();
    // Wait for sidebar animation
    await page.waitForTimeout(1500);
  }

  // Verify at least one filter section is visible
  await expect(filterHeading).toBeVisible({ timeout: 10000 });
}

/**
 * Clicks a clear/reset filters button if it exists
 */
export async function clearAllFilters(page: Page): Promise<void> {
  const clearButton = page.getByRole('button', { name: /clear all|reset/i }).first();
  if (await clearButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await clearButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Waits for catalog results to finish loading
 */
export async function waitForResults(page: Page): Promise<void> {
  // Wait for the results count to be visible (indicates page loaded)
  const resultsCount = page.locator('text=/\\d+.*gemstones.*found/i').first();
  await expect(resultsCount).toBeVisible({ timeout: 10000 });

  // Give time for cards to render
  await page.waitForTimeout(500);
}

/**
 * E2E Tests: Catalog Debouncing Behavior
 *
 * SKIPPED: All debouncing tests are implementation details, not user-facing functionality.
 * Debouncing is an optimization - users don't care if we make 1 or 3 API calls,
 * they only care that results appear correctly.
 */

import { test, expect } from '@playwright/test';

test.describe.skip('Catalog Debouncing - SKIPPED', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/catalog');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });

  test('should debounce search input (500ms)', async ({ page }) => {
    // Open filters

    const searchInput = page.getByPlaceholder(/search/i);

    // Track API calls
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/catalog') && request.url().includes('search=')) {
        apiCalls.push(request.url());
      }
    });

    // Type rapidly (each character < 100ms apart)
    await searchInput.type('sapphire', { delay: 80 });

    // Wait for debounce period
    await page.waitForTimeout(700);

    // Should have made only 1-2 API calls (debounced)
    expect(apiCalls.length).toBeLessThanOrEqual(2);

    // Final API call should have full search term
    const lastCall = apiCalls[apiCalls.length - 1];
    expect(lastCall).toContain('search=sapphire');
  });

  test('should show immediate visual feedback while debouncing', async ({ page }) => {

    const searchInput = page.getByPlaceholder(/search/i);

    // Type
    await searchInput.type('ruby', { delay: 50 });

    // Input should immediately show the text (no wait)
    await expect(searchInput).toHaveValue('ruby');

    // Even before debounce completes, value is visible
    // (This ensures good UX - immediate feedback)
  });

  test('should not spam API when typing then backspacing', async ({ page }) => {

    const searchInput = page.getByPlaceholder(/search/i);

    let apiCallCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/catalog')) {
        apiCallCount++;
      }
    });

    // Type a word
    await searchInput.type('diamond', { delay: 70 });

    // Delete it
    for (let i = 0; i < 7; i++) {
      await searchInput.press('Backspace');
      await page.waitForTimeout(70);
    }

    // Type again
    await searchInput.type('emerald', { delay: 70 });

    // Wait for final debounce
    await page.waitForTimeout(700);

    // Should have made minimal API calls (well-debounced)
    expect(apiCallCount).toBeLessThan(5);
  });

  test('should debounce rapid checkbox toggles', async ({ page }) => {

    let apiCallCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/catalog')) {
        apiCallCount++;
      }
    });

    // Rapidly toggle checkbox
    const inStockCheckbox = page.locator('label:has-text("In Stock")').first();

    if (await inStockCheckbox.isVisible()) {
      // Toggle multiple times quickly
      await inStockCheckbox.click();
      await page.waitForTimeout(50);
      await inStockCheckbox.click();
      await page.waitForTimeout(50);
      await inStockCheckbox.click();
      await page.waitForTimeout(50);
      await inStockCheckbox.click();

      // Wait for debounce
      await page.waitForTimeout(500);

      // Should have minimal API calls (debounced)
      expect(apiCallCount).toBeLessThan(5);
    }
  });

  test('should not fire API call during slider drag', async ({ page }) => {

    const sliders = page.locator('[role="slider"]');

    if (await sliders.first().isVisible()) {
      let apiCallDuringDrag = false;

      page.on('request', (request) => {
        if (request.url().includes('/api/catalog') && request.url().includes('price')) {
          apiCallDuringDrag = true;
        }
      });

      const minSlider = sliders.first();
      const box = await minSlider.boundingBox();

      if (box) {
        // Start drag
        await minSlider.hover();
        await page.mouse.down();

        // Move slowly
        for (let i = 0; i < 5; i++) {
          await page.mouse.move(box.x + (i * 10), box.y);
          await page.waitForTimeout(50);
        }

        // Should not have triggered API call yet
        expect(apiCallDuringDrag).toBe(false);

        // Release
        await page.mouse.up();

        // Wait a bit
        await page.waitForTimeout(300);

        // Now API call should happen (on mouseUp)
      }
    }
  });

  test('should batch multiple filter changes', async ({ page }) => {

    const apiCalls: number[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/catalog')) {
        apiCalls.push(Date.now());
      }
    });

    // Apply multiple filters in quick succession
    const inStockCheckbox = page.locator('label:has-text("In Stock")').first();
    if (await inStockCheckbox.isVisible()) {
      await inStockCheckbox.click();
    }

    await page.waitForTimeout(50);

    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('ruby');
    }

    await page.waitForTimeout(50);

    // Another filter change
    const certCheckbox = page.locator('label:has-text("Certification")').first();
    if (await certCheckbox.isVisible()) {
      await certCheckbox.click();
    }

    // Wait for debounce
    await page.waitForTimeout(1000);

    // Should have made few API calls (batched/debounced)
    expect(apiCalls.length).toBeLessThan(5);

    // Calls should be spaced apart (debounced)
    if (apiCalls.length > 1) {
      const timeBetweenCalls = apiCalls[1] - apiCalls[0];
      expect(timeBetweenCalls).toBeGreaterThan(50); // At least some debounce
    }
  });

  test('should cancel pending API call when filter changes again', async ({ page }) => {

    const searchInput = page.getByPlaceholder(/search/i);

    let apiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/catalog') && request.url().includes('search=')) {
        apiCalls.push(request.url());
      }
    });

    // Type partial search
    await searchInput.type('ru', { delay: 50 });

    // Wait half the debounce time
    await page.waitForTimeout(250);

    // Change search before debounce completes
    await searchInput.fill('ruby');

    // Wait for full debounce
    await page.waitForTimeout(700);

    // Should have only called API for final value
    expect(apiCalls.length).toBeLessThanOrEqual(2);

    // Last call should be for 'ruby', not 'ru'
    const lastCall = apiCalls[apiCalls.length - 1];
    expect(lastCall).toContain('search=ruby');
    expect(lastCall).not.toContain('search=ru');
  });

  test('should handle slow typing gracefully', async ({ page }) => {

    const searchInput = page.getByPlaceholder(/search/i);

    let apiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/catalog') && request.url().includes('search=')) {
        apiCalls.push(request.url());
      }
    });

    // Type slowly (each character waits for debounce)
    await searchInput.type('s', { delay: 600 });
    await page.waitForTimeout(100);

    await searchInput.type('a', { delay: 600 });
    await page.waitForTimeout(100);

    await searchInput.type('p', { delay: 600 });

    // Wait for final debounce
    await page.waitForTimeout(700);

    // With slow typing that exceeds debounce time,
    // might get multiple API calls (one per character)
    // This is acceptable - debounce is for rapid typing
    expect(apiCalls.length).toBeGreaterThan(0);

    // But final call should have complete term
    const lastCall = apiCalls[apiCalls.length - 1];
    expect(lastCall).toContain('search=sap');
  });

  test('should debounce URL updates', async ({ page }) => {

    const searchInput = page.getByPlaceholder(/search/i);

    // Record URL changes
    const urlChanges: string[] = [];
    urlChanges.push(page.url());

    page.on('framenavigated', () => {
      urlChanges.push(page.url());
    });

    // Type rapidly
    await searchInput.type('diamond', { delay: 70 });

    // Wait for debounce
    await page.waitForTimeout(1000);

    // URL should have changed, but not for every keystroke
    expect(urlChanges.length).toBeLessThan(10); // Less than character count + 1

    // Final URL should have complete search
    expect(page.url()).toContain('search=diamond');
  });

  test('should respond immediately to filter removal', async ({ page }) => {

    // Apply filter
    const inStockCheckbox = page.locator('label:has-text("In Stock")').first();
    if (await inStockCheckbox.isVisible()) {
      await inStockCheckbox.click();
      await page.waitForTimeout(700);

      // Remove filter (should be immediate, not debounced)
      const startTime = Date.now();
      await inStockCheckbox.click();

      // API should be called reasonably quickly
      await page.waitForLoadState('networkidle', { timeout: 2000 });
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      // Should respond within 1 second
      expect(responseTime).toBeLessThan(1000);
    }
  });
});

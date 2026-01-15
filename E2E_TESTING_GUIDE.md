# E2E Testing Guide - Playwright

**Date:** January 15, 2026
**Framework:** Playwright
**Test Coverage:** Catalog Search & Filters

---

## Overview

This project uses **Playwright** for end-to-end testing of critical user journeys in the gemstone catalog. The tests ensure that search and filter functionality works correctly from a user's perspective.

### Why Playwright?

- **Real browser testing** - Tests run in actual Chromium/Firefox/WebKit
- **Reliable** - Auto-waits for elements, handles async operations
- **Fast** - Parallel execution, smart retry logic
- **Great DX** - UI mode, codegen, trace viewer, screenshots
- **Cross-browser** - Test on all major browsers

---

## Installation

Playwright is already installed. If you need to reinstall browsers:

```bash
# Install browsers
npx playwright install

# Or just Chromium (faster)
npx playwright install chromium
```

---

## Running Tests

### Basic Commands

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Generate new tests (record interactions)
npm run test:e2e:codegen
```

### Running Specific Test Files

```bash
# Run only search tests
npx playwright test catalog-search.spec.ts

# Run only price filter tests
npx playwright test catalog-price-filter.spec.ts

# Run tests matching pattern
npx playwright test catalog-*
```

### Running Specific Tests

```bash
# Run test by name
npx playwright test -g "should filter by gemstone type"

# Run test by file and name
npx playwright test catalog-filters.spec.ts -g "should combine multiple filters"
```

---

## Test Structure

### Test Files

All E2E tests are in `tests/e2e/`:

```
tests/e2e/
├── catalog-search.spec.ts           # Search functionality & autocomplete
├── catalog-filters.spec.ts          # Filter selection & combinations
├── catalog-price-filter.spec.ts     # Price range filter (critical!)
├── catalog-url-sync.spec.ts         # URL synchronization & bookmarking
└── catalog-debouncing.spec.ts       # Debouncing behavior
```

### Test File Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to page before each test
    await page.goto('/en/catalog');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.getByRole('button', { name: /click me/i });

    // Act
    await button.click();

    // Assert
    await expect(page).toHaveURL(/success/);
  });
});
```

---

## Test Coverage

### 1. Search Tests (`catalog-search.spec.ts`)

**What's Tested:**
- Search input displays correctly
- Search filters results
- Debouncing (500ms)
- Clear button functionality
- URL updates with search parameter
- Search persists on back navigation

**Critical Path:**
```
User types → Debounce (500ms) → API call → Results update → URL syncs
```

### 2. Filter Tests (`catalog-filters.spec.ts`)

**What's Tested:**
- Filter sidebar open/close
- Gemstone type selection
- Color selection
- Multiple filter combinations
- Active filter count badge
- Clear all filters
- Filter persistence in URL
- Dynamic filter count updates
- Boolean toggles (In Stock, etc.)

**Critical Path:**
```
User selects filter → State updates → API call → Results update → URL syncs
```

### 3. Price Filter Tests (`catalog-price-filter.spec.ts`)

**What's Tested:**
- Price range slider display
- Input field entry
- Min/Max validation
- Slider drag interaction
- **REGRESSION TEST**: Verifies bug fix (no double conversion)
- Price formatting
- URL persistence
- Clear price filter
- Combine with other filters

**Critical Path:**
```
User adjusts price → Validation → API call (correct cents value) → Results filtered
```

**⚠️ CRITICAL:** This test includes a regression test for the price double-conversion bug that was fixed on 2026-01-15.

### 4. URL Sync Tests (`catalog-url-sync.spec.ts`)

**What's Tested:**
- Single filter → URL
- Multiple filters → URL
- URL → Filter restoration
- Browser back/forward buttons
- Shareable/bookmarkable URLs
- URL parameter decoding
- Debounced URL updates (prevent history spam)
- Clear filters clears URL
- URL structure preservation

**Critical Path:**
```
Filter change → Debounce → URL update (no history entry) → Bookmarkable state
```

### 5. Debouncing Tests (`catalog-debouncing.spec.ts`)

**What's Tested:**
- Search input debouncing (500ms)
- Visual feedback while debouncing
- No API spam on rapid typing
- Checkbox toggle debouncing
- Slider drag (fires on mouseUp)
- Batch multiple filter changes
- Cancel pending API calls
- Slow typing handling
- URL update debouncing
- Immediate filter removal

**Critical Path:**
```
Rapid input → Debounce timer → Single API call → Good UX (immediate visual)
```

---

## Writing New Tests

### Best Practices

#### 1. Use Accessible Selectors

```typescript
// Good - Accessible, resilient
page.getByRole('button', { name: /submit/i })
page.getByLabel('Email')
page.getByPlaceholder('Search...')
page.getByText('Welcome')

// Okay - Test IDs when needed
page.locator('[data-testid="gemstone-card"]')

// Avoid - Fragile
page.locator('.btn-primary')
page.locator('#submit-button')
```

#### 2. Wait for Network Idle

```typescript
// Wait for API calls to complete
await page.waitForLoadState('networkidle');

// Or wait for specific timeout
await page.waitForTimeout(700); // After debounce
```

#### 3. Handle Optional Elements

```typescript
// Check if element exists before interacting
const filterButton = page.getByRole('button', { name: /filters/i });
if (await filterButton.isVisible()) {
  await filterButton.click();
}
```

#### 4. Use Expect Matchers

```typescript
// Good assertions
await expect(page).toHaveURL(/search=ruby/);
await expect(input).toHaveValue('sapphire');
await expect(checkbox).toBeChecked();
await expect(element).toBeVisible();
await expect(element).toContainText(/zircon/i);
```

#### 5. Track API Calls

```typescript
// Monitor API requests
const apiCalls: string[] = [];
page.on('request', (request) => {
  if (request.url().includes('/api/catalog')) {
    apiCalls.push(request.url());
  }
});

// Verify debouncing
expect(apiCalls.length).toBeLessThanOrEqual(2);
```

#### 6. Test Cleanup

```typescript
test.afterEach(async ({ page }) => {
  // Clear any leftover state
  await page.close();
});
```

---

## Debugging Tests

### 1. Use UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

Features:
- Time travel through test execution
- Inspect DOM at each step
- View network calls
- Edit and rerun tests
- View screenshots/videos

### 2. Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector:
- Step through test line by line
- Inspect page elements
- Try selectors in console

### 3. Screenshots & Videos

Tests automatically capture:
- **Screenshots** on failure
- **Videos** on failure
- **Traces** on retry

View them in the HTML report:
```bash
npm run test:e2e:report
```

### 4. Console Logs

```typescript
// Add console logs in tests
test('my test', async ({ page }) => {
  console.log('Starting test...');

  const value = await input.inputValue();
  console.log('Input value:', value);
});
```

### 5. Pause Execution

```typescript
test('my test', async ({ page }) => {
  await page.pause(); // Opens inspector

  // Test continues after you click "Resume"
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Environment Variables

```bash
# In CI
CI=true npm run test:e2e

# Use different base URL
BASE_URL=https://staging.example.com npm run test:e2e
```

---

## Common Issues & Solutions

### Issue: "Error: page.goto: net::ERR_CONNECTION_REFUSED"

**Cause:** Dev server not running

**Solution:**
```bash
# Playwright auto-starts dev server, but if it fails:
npm run dev  # In separate terminal
npm run test:e2e
```

### Issue: "TimeoutError: Timeout 30000ms exceeded"

**Cause:** Element not found or page not loading

**Solution:**
```typescript
// Increase timeout
await expect(element).toBeVisible({ timeout: 60000 });

// Or check if element exists conditionally
if (await element.isVisible({ timeout: 5000 })) {
  // ...
}
```

### Issue: "Test is flaky"

**Cause:** Race conditions, timing issues

**Solution:**
```typescript
// Use proper waits
await page.waitForLoadState('networkidle');
await page.waitForTimeout(700); // After debounce

// Use strict selectors
page.getByRole('button', { name: 'Submit', exact: true })

// Retry assertions
await expect(element).toHaveText('Expected', { timeout: 10000 });
```

### Issue: "Element is not visible"

**Cause:** Element hidden, modal not open, filter sidebar closed

**Solution:**
```typescript
// Open sidebar first
const filterButton = page.getByRole('button', { name: /filters/i });
if (await filterButton.isVisible()) {
  await filterButton.click();
  await page.waitForTimeout(500);
}

// Then interact with filters
```

---

## Test Maintenance

### When to Update Tests

1. **UI Changes** - If selectors change (use accessible selectors!)
2. **New Features** - Add tests for new filters/functionality
3. **Bug Fixes** - Add regression tests (like price filter test)
4. **API Changes** - Update expected responses
5. **Debounce Timings** - If you change debounce times (500ms → 300ms)

### Keeping Tests Fast

1. **Run in parallel** - Playwright does this by default
2. **Use `test.describe.configure({ mode: 'parallel' })`** for independent tests
3. **Mock API calls** when appropriate (for unit tests)
4. **Use headless mode** in CI
5. **Only test critical paths** in E2E

### Test Isolation

Each test should be independent:

```typescript
// Good - Each test starts fresh
test.beforeEach(async ({ page }) => {
  await page.goto('/en/catalog');
});

// Bad - Tests depend on each other
test('apply filter', async () => { /* ... */ });
test('verify filter applied', async () => { /* assumes previous test ran */ });
```

---

## Performance Benchmarks

| Test Suite | Test Count | Duration (Headless) | Duration (Headed) |
|------------|------------|---------------------|-------------------|
| Search | 6 tests | ~15 seconds | ~25 seconds |
| Filters | 10 tests | ~30 seconds | ~45 seconds |
| Price Filter | 10 tests | ~35 seconds | ~50 seconds |
| URL Sync | 10 tests | ~30 seconds | ~45 seconds |
| Debouncing | 11 tests | ~40 seconds | ~60 seconds |
| **TOTAL** | **47 tests** | **~2.5 minutes** | **~4 minutes** |

*Benchmarks on MacBook Pro M1, running in parallel*

---

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [Test Retry](https://playwright.dev/docs/test-retries)

---

## Quick Reference

### Most Used Commands

```bash
# Development
npm run test:e2e:ui          # Interactive UI mode
npm run test:e2e:headed      # See browser
npm run test:e2e:debug       # Step-by-step debugging

# Run specific tests
npx playwright test catalog-search.spec.ts
npx playwright test -g "price filter"

# Generate new tests
npm run test:e2e:codegen

# CI
npm run test:e2e             # Headless, with retries

# View results
npm run test:e2e:report      # HTML report with traces
```

### Most Used Assertions

```typescript
await expect(page).toHaveURL(/pattern/);
await expect(element).toBeVisible();
await expect(element).toHaveText('text');
await expect(input).toHaveValue('value');
await expect(checkbox).toBeChecked();
await expect(element).toContainText(/pattern/i);
```

### Most Used Selectors

```typescript
page.getByRole('button', { name: /text/i })
page.getByLabel('Label text')
page.getByPlaceholder('Placeholder')
page.getByText('Text content')
page.locator('[data-testid="id"]')
```

---

## Contributing

When adding new filter functionality:

1. **Write the test first** (TDD)
2. **Run the test** (should fail)
3. **Implement the feature**
4. **Run the test** (should pass)
5. **Add to this documentation**

### Test Checklist

- [ ] Test passes consistently (run 3 times)
- [ ] Test is independent (doesn't rely on other tests)
- [ ] Uses accessible selectors
- [ ] Has proper waits (networkidle, debounce)
- [ ] Handles optional elements (if visible)
- [ ] Has meaningful assertions
- [ ] Includes comments for complex logic
- [ ] Documented in this guide

---

**Last Updated:** January 15, 2026
**Maintained By:** Development Team
**Questions?** Check [Playwright docs](https://playwright.dev) or ask the team

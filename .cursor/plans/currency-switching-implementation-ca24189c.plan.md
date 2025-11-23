<!-- ca24189c-ef21-45fa-8b21-76f14e035bd7 9d5ffa60-454e-4fc9-bdc2-c98500d11e41 -->
# Currency System Refactoring Plan: SRP, SSOT, and Database-First Compliance

## Summary

Refactor the currency system to eliminate violations of Single Responsibility Principle (SRP), Single Source of Truth (SSOT), and database-first architecture. Currently, there are 16+ duplicate `formatPrice` implementations across the codebase, components implement conversion logic (violating SRP), and server components cannot use React context for currency conversion (violating database-first).

## Evidence-Based Inventory

### SSOT Violations (16 duplicate implementations)

**Duplicate formatPrice functions found:**

1. `src/lib/utils.ts:14` - Basic formatting, no currency conversion
2. `src/shared/utils/formatters.ts:5` - Basic formatting, hardcoded en-US locale
3. `src/features/currency/context/currency-context.tsx:173` - Currency-aware (CORRECT SOURCE)
4. `src/shared/utils/currency-utils.ts:11` - `formatPriceWithLocale()` (unused)
5. `src/features/cart/services/cart-service.ts:593` - Private method, hardcoded en-US
6. `src/features/admin/services/statistics-service.ts:269` - Static method, hardcoded USD
7. `src/app/[locale]/catalog/[id]/page.tsx:277` - Server component metadata (no conversion)

**Component-level wrappers (SRP violations):**

8. `src/features/cart/components/cart-page.tsx:123` - Wraps useCurrency()
9. `src/features/cart/components/cart-drawer.tsx:47` - Wraps useCurrency()
10. `src/features/orders/components/order-details-page.tsx:96` - Wraps useCurrency()
11. `src/features/orders/components/order-details-page-v2.tsx:107` - Wraps useCurrency()
12. `src/features/orders/components/order-details-page-v3.tsx:107` - Wraps useCurrency()
13. `src/features/orders/components/order-confirmation-modal.tsx:79` - Wraps useCurrency()
14. `src/features/admin/components/gemstone-detail-page.tsx:64` - Wraps useCurrency()
15. `src/features/admin/components/gemstone-list-optimized.tsx:468` - Wraps useCurrency()
16. `src/features/admin/components/bulk-edit-modal.tsx:292` - Wraps useCurrency()

**Additional violations:**

- `src/features/admin/components/inventory-management-dashboard.tsx:133` - Local formatPrice
- `src/features/gemstones/components/filters/advanced-filters.tsx:213` - Local formatPrice
- `src/features/admin/components/price-analytics-dashboard.tsx:104` - Local formatPrice

### SRP Violations

**Components doing conversion (should only display):**

- 15+ components implement local `formatPrice` functions that wrap `useCurrency()`
- Components mix display logic with conversion logic
- Each component reimplements the same conversion pattern

**Services mixing concerns:**

- `CartService.formatPrice()` - Should use currency context
- `StatisticsService.formatCurrency()` - Should use database function for server-side

### Database-First Gaps

**Missing database functions:**

- No `convert_currency()` function for server-side conversion
- No `format_price()` function for server-side formatting
- Server components cannot use React context (client-only)
- Metadata generation (`generateMetadata`) uses hardcoded USD formatting

**Existing database structure:**

- `currency_rates` table exists with `base_currency`, `target_currency`, `rate`
- `currency_code` enum includes USD, EUR, RUB, KZT, GBP, CHF, JPY
- `user_preferences.preferred_currency` column exists

## Implementation Phases

### Phase 0: Inventory & Analysis (Complete)

- [x] Document all formatPrice implementations
- [x] Identify SRP violations
- [x] Identify SSOT violations
- [x] Document database-first gaps

### Phase 1: Database-First Implementation

**Goal:** Enable server-side currency conversion and formatting via database functions.

**Files to create:**

- `supabase/migrations/[timestamp]_create_currency_functions.sql`

**Database functions to create:**

```sql
-- Convert amount from one currency to another using currency_rates table
CREATE OR REPLACE FUNCTION convert_currency(
  amount_cents BIGINT,
  from_currency currency_code DEFAULT 'USD',
  to_currency currency_code DEFAULT 'USD'
) RETURNS BIGINT AS $$
DECLARE
  conversion_rate DECIMAL(15,8);
BEGIN
  IF from_currency = to_currency THEN
    RETURN amount_cents;
  END IF;
  
  -- Get rate from currency_rates table
  SELECT rate INTO conversion_rate
  FROM currency_rates
  WHERE base_currency = from_currency
    AND target_currency = to_currency
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- If rate not found, return original amount
  IF conversion_rate IS NULL THEN
    RETURN amount_cents;
  END IF;
  
  RETURN ROUND(amount_cents * conversion_rate);
END;
$$ LANGUAGE plpgsql STABLE;

-- Format price with proper locale based on currency
CREATE OR REPLACE FUNCTION format_price(
  amount_cents BIGINT,
  currency currency_code DEFAULT 'USD',
  locale TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  target_locale TEXT;
BEGIN
  -- Determine locale based on currency if not provided
  IF locale IS NULL THEN
    CASE currency
      WHEN 'KZT' THEN target_locale := 'kk-KZ';
      WHEN 'RUB' THEN target_locale := 'ru-RU';
      WHEN 'EUR' THEN target_locale := 'en-US';
      ELSE target_locale := 'en-US';
    END CASE;
  ELSE
    target_locale := locale;
  END IF;
  
  -- Note: PostgreSQL doesn't have Intl.NumberFormat, so we format as string
  -- Format: "CURRENCY_SYMBOL AMOUNT" (e.g., "$1,234" or "₽92,700")
  RETURN format('%s%s', 
    CASE currency
      WHEN 'USD' THEN '$'
      WHEN 'EUR' THEN '€'
      WHEN 'GBP' THEN '£'
      WHEN 'RUB' THEN '₽'
      WHEN 'CHF' THEN 'CHF '
      WHEN 'JPY' THEN '¥'
      WHEN 'KZT' THEN '₸'
      ELSE currency::TEXT || ' '
    END,
    TO_CHAR(amount_cents / 100.0, 'FM999,999,999')
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

**Files to update:**

- `src/app/[locale]/catalog/[id]/page.tsx `- Use database function in `generateMetadata`
- `src/features/admin/services/statistics-service.ts` - Use database function for server-side formatting

**Test strategy:**

- Unit test database functions with various currency pairs
- Test server component metadata generation
- Verify fallback behavior when rates are missing

### Phase 2: SSOT Consolidation

**Goal:** Establish `currency-context.tsx` as the single source of truth for client-side formatting.

**Files to deprecate/remove:**

- `src/lib/utils.ts:14` - Remove `formatPrice()` function (keep other utilities)
- `src/shared/utils/formatters.ts:5` - Remove `formatPrice()` function (keep other formatters)
- `src/shared/utils/currency-utils.ts:11` - Remove `formatPriceWithLocale()` (unused, redundant)

**Files to update:**

- `src/features/cart/services/cart-service.ts:593` - Remove private `formatPrice()`, use currency context
- `src/features/admin/services/statistics-service.ts:269` - Keep for server-side, but add comment referencing database function

**Migration strategy:**

1. Add deprecation comments to old functions
2. Update all imports to use `useCurrency()` hook
3. Remove deprecated functions after migration complete

**Test strategy:**

- Verify no imports of deprecated functions remain
- Test that all components use currency context
- Verify formatting consistency across components

### Phase 3: SRP Refactoring

**Goal:** Remove component-level conversion logic. Components should only call `useCurrency()` methods directly.

**Components to refactor (15 files):**

1. `src/features/cart/components/cart-page.tsx` - Remove local `formatPrice`, use `formatPrice(convertPrice(...))` directly
2. `src/features/cart/components/cart-drawer.tsx` - Remove local `formatPrice`
3. `src/features/cart/components/cart-item.tsx` - Already correct (uses hook directly)
4. `src/features/orders/components/order-details-page.tsx` - Remove local `formatPrice`
5. `src/features/orders/components/order-details-page-v2.tsx` - Remove local `formatPrice`
6. `src/features/orders/components/order-details-page-v3.tsx` - Remove local `formatPrice`
7. `src/features/orders/components/order-confirmation-modal.tsx` - Remove local `formatPrice`
8. `src/features/admin/components/gemstone-detail-page.tsx` - Remove local `formatPrice`
9. `src/features/admin/components/gemstone-list-optimized.tsx` - Remove local `formatPrice` callback
10. `src/features/admin/components/bulk-edit-modal.tsx` - Remove local `formatCurrency`
11. `src/features/admin/components/order-list.tsx` - Remove local `formatCurrency`
12. `src/features/admin/components/order-detail.tsx` - Remove local `formatCurrency`
13. `src/features/user/components/order-history.tsx` - Remove local `formatCurrency`
14. `src/features/orders/components/orders-dashboard.tsx` - Remove local `formatCurrency`
15. `src/features/orders/components/orders-analytics.tsx` - Remove local `formatCurrency`

**Refactoring pattern:**

```typescript
// BEFORE (SRP violation - component does conversion)
const { formatPrice: formatPriceWithCurrency, convertPrice } = useCurrency();
const formatPrice = (amount: number) => {
  const convertedAmount = convertPrice(amount, "USD");
  return formatPriceWithCurrency(convertedAmount);
};

// AFTER (SRP compliant - component only displays)
const { formatPrice, convertPrice } = useCurrency();
// Use directly: formatPrice(convertPrice(amount, "USD"))
```

**Test strategy:**

- Verify components render prices correctly
- Test currency switching updates all prices
- Verify no performance regressions

### Phase 4: Component Cleanup

**Goal:** Remove remaining local formatPrice implementations in non-core components.

**Files to update:**

- `src/features/admin/components/inventory-management-dashboard.tsx:133` - Use currency context
- `src/features/gemstones/components/filters/advanced-filters.tsx:213` - Use currency context
- `src/features/admin/components/price-analytics-dashboard.tsx:104` - Use currency context

**Files to verify:**

- `src/features/gemstones/components/gemstone-detail.tsx` - Already correct
- `src/features/gemstones/components/gemstone-card.tsx` - Already correct
- `src/features/gemstones/components/related-gemstones.tsx` - Already correct

**Test strategy:**

- Visual regression testing for price displays
- Verify all prices update on currency switch

### Phase 5: Testing & Validation

**Goal:** Comprehensive testing to ensure refactoring maintains functionality.

**Unit tests to create:**

- `src/features/currency/__tests__/currency-context.test.tsx` - Test conversion and formatting
- `src/shared/utils/__tests__/currency-utils.test.ts` - Test remaining utilities (symbols, names)
- Database function tests (via Supabase test suite)

**Integration tests:**

- Test currency switching updates all components
- Test server-side metadata generation
- Test cart price calculations
- Test order price displays

**E2E tests (Playwright):**

- User switches currency, verifies prices update
- User adds item to cart, verifies correct currency
- User views order history, verifies correct currency
- Admin views gemstone list, verifies correct currency

**Validation checklist:**

- [ ] No duplicate formatPrice functions remain
- [ ] All components use currency context directly
- [ ] Server components use database functions
- [ ] All tests pass
- [ ] No performance regressions
- [ ] Currency switching works across all pages

## Public Interfaces

### Client-Side (React Context)

```typescript
interface CurrencyContextType {
  selectedCurrency: CurrencyCode;
  changeCurrency: (currency: CurrencyCode) => Promise<void>;
  convertPrice: (amount: number, fromCurrency?: CurrencyCode) => number;
  formatPrice: (amount: number, currency?: CurrencyCode) => string;
  isLoading: boolean;
  rates: Record<CurrencyCode, number>;
  refreshRates: () => Promise<void>;
}
```

### Server-Side (Database Functions)

```sql
-- Convert currency
convert_currency(amount_cents BIGINT, from_currency currency_code, to_currency currency_code) RETURNS BIGINT

-- Format price
format_price(amount_cents BIGINT, currency currency_code, locale TEXT) RETURNS TEXT
```

### Component Usage Pattern

```typescript
// Correct usage (SRP compliant)
const { formatPrice, convertPrice } = useCurrency();
const displayPrice = formatPrice(convertPrice(priceAmount, "USD"));

// Incorrect usage (SRP violation)
const formatPrice = (amount: number) => { /* conversion logic */ };
```

## Data Model Impact

**No schema changes required:**

- `currency_rates` table already exists
- `currency_code` enum already includes all needed currencies
- `user_preferences.preferred_currency` column exists

**New database functions:**

- `convert_currency()` - Uses existing `currency_rates` table
- `format_price()` - Pure formatting, no table dependencies

## Risks Assessment

1. **Breaking changes during migration**

   - Risk: Components may break if imports not updated correctly
   - Mitigation: Deprecate old functions first, migrate incrementally, comprehensive testing

2. **Performance impact**

   - Risk: Database function calls may be slower than client-side conversion
   - Mitigation: Database functions are STABLE (can be cached), test performance, use for server-side only

3. **Locale formatting differences**

   - Risk: Database function formatting may differ from Intl.NumberFormat
   - Mitigation: Document differences, consider using database function only for conversion, formatting on client

4. **Missing exchange rates**

   - Risk: Database function may not find rate
   - Mitigation: Function returns original amount if rate missing, log warnings

5. **Component refactoring complexity**

   - Risk: 15+ components need refactoring
   - Mitigation: Use consistent pattern, test incrementally, verify each component

## Open Questions

1. **Database formatting precision:** Should `format_price()` database function match `Intl.NumberFormat` exactly, or is basic formatting acceptable for server-side use?

   - Recommendation: Use database function for conversion only, keep formatting client-side for consistency

2. **Backward compatibility:** Should deprecated functions emit warnings before removal?

   - Recommendation: Yes, add console.warn() in deprecated functions

3. **Server component strategy:** Should all server components use database functions, or only metadata generation?

   - Recommendation: Use database functions for all server-side price operations (metadata, API responses, etc.)

4. **Testing database functions:** Should we use Supabase test suite or create TypeScript test wrappers?

   - Recommendation: Both - Supabase tests for SQL correctness, TypeScript wrappers for integration

### To-dos

- [ ] Add KZT to currency_code enum via database migration
- [ ] Create currency rate service to fetch rates from mig.kz with 3% adjustment
- [ ] Create API endpoint /api/currency/rates to fetch and cache exchange rates
- [ ] Create CurrencyContext and CurrencyProvider for managing currency state
- [ ] Create useCurrency hook for components to access currency functionality
- [ ] Create currency conversion utilities (convertPrice, formatPrice with locale support)
- [ ] Create CurrencySwitcher component similar to LanguageSwitcher
- [ ] Update all formatPrice functions to use currency from context
- [ ] Update gemstone detail, card, and related components to use currency conversion
- [ ] Add CurrencySwitcher to MainNav component next to LanguageSwitcher
- [ ] Wrap app with CurrencyProvider in layout.tsx
- [ ] Ensure user profile service loads and saves currency preference
- [ ] Test currency switching, persistence, and price conversion accuracy
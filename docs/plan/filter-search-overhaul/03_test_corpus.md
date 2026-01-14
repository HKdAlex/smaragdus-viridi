# Golden Test Corpus — Filter & Search System

## Non-Production / No-Backfill Assumption

- This project is **not in production**.
- Corpus changes do not imply production data constraints.
- The corpus exists to prevent **semantic drift** in filter/search behavior; it is not a data preservation system.

---

## Purpose

The golden corpus is a curated set of filter/search test cases used to:

- lock down **deterministic behavior** (same filters → same results),
- validate **filter combination** properties where applicable,
- prevent regressions in **search + filter integration**,
- and ensure UI components remain aligned to API contracts.

This is a **toolchain correctness** asset, not a content archive.

---

## What the Corpus Is

Each corpus entry must minimally include:

- **Input**: Filter parameters or search query
- **Expected behavior**: What should happen
- **Verification method**: How to test

Expected results must be explicitly tied to the contract that introduced or modified them.

---

## Why the Corpus Exists (Drift Prevention)

The master vision (`docs/plan/filter-search-overhaul/00_vision.md`) makes filter/search behavior depend on stable, deterministic APIs.

Without a golden corpus:

- "small" filter changes can silently break search results,
- URL parameter encoding can drift without detection,
- consumers (catalog page, search page) can diverge in behavior,
- and regressions become subjective ("looks okay") rather than testable.

---

## Corpus Categories (Required Taxonomy)

Each entry must be tagged with one or more categories below.

### Category 1: Filter Type Tests

Purpose: Validate each filter type works correctly in isolation.

Examples:
- Single gemstone type filter
- Price range filter
- Treatment status filter
- Mining country filter

### Category 2: Filter Combination Tests

Purpose: Validate multiple filters work together correctly.

Examples:
- Type + Color + Price
- Treatment + Origin + Quality
- All professional filters combined

### Category 3: Search + Filter Tests

Purpose: Validate search query works with filters.

Examples:
- Search "ruby" + color filter
- Search "emerald" + treatment filter
- Empty search + multiple filters

### Category 4: URL Encoding Tests

Purpose: Validate filter state persists in URL correctly.

Examples:
- Single filter URL encoding
- Multiple filter URL encoding
- Special characters in filter values

### Category 5: Edge Case Tests

Purpose: Validate handling of edge cases.

Examples:
- Empty filter values
- No results scenario
- All filters cleared
- Invalid filter values

### Category 6: Localization Tests

Purpose: Validate filter labels in different locales.

Examples:
- EN filter labels
- RU filter labels
- Treatment status translations

### Category 7: UX/UI Visual Tests

Purpose: Validate visual design and interactions meet luxury standards.

Examples:
- Filter sidebar visual hierarchy
- Animation smoothness
- Loading state appearance
- Empty state helpfulness

### Category 8: Accessibility Tests

Purpose: Validate accessibility compliance.

Examples:
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus indicators

---

## Corpus Entries by Contract

### FILTER-C0.1 — Search Page Filter Sidebar

**File**: Manual test cases (no automated corpus yet)

**Purpose**: Validate filter sidebar works on search page.

**Categories**: Filter Type Tests, Search + Filter Tests

**Test Cases**:

| ID | Input | Expected | Status |
|----|-------|----------|--------|
| C0.1-T1 | Navigate to `/search`, open filter sidebar | Sidebar renders with all filters | `[ ]` |
| C0.1-T2 | Search "ruby", select color "red" | Results filtered to red rubies | `[ ]` |
| C0.1-T3 | Apply filter, refresh page | Filters persist in URL | `[ ]` |
| C0.1-T4 | Clear all filters | All results shown | `[ ]` |

---

### FILTER-C0.3 — Filter Types

**File**: `src/features/gemstones/types/__tests__/filter.types.test.ts` (to be created)

**Purpose**: Validate TypeScript types compile and URL encoding works.

**Categories**: URL Encoding Tests

**Test Cases**:

| ID | Input | Expected | Status |
|----|-------|----------|--------|
| C0.3-T1 | `{ treatmentStatus: ['natural', 'heated'] }` | URL: `?treatmentStatus=natural,heated` | `[ ]` |
| C0.3-T2 | `{ miningCountries: ['Russia', 'Colombia'] }` | URL: `?miningCountries=Russia,Colombia` | `[ ]` |
| C0.3-T3 | `{ dimensionRange: { minLength: 5, maxLength: 10 } }` | URL: `?minLength=5&maxLength=10` | `[ ]` |
| C0.3-T4 | Parse URL `?treatmentStatus=natural,heated` | `{ treatmentStatus: ['natural', 'heated'] }` | `[ ]` |

---

### FILTER-C1.1 — Treatment Status Filter

**File**: Manual test cases

**Purpose**: Validate treatment status filter works correctly.

**Categories**: Filter Type Tests, Edge Case Tests

**Test Cases**:

| ID | Input | Expected | Status |
|----|-------|----------|--------|
| C1.1-T1 | Select "Natural" treatment | Only natural stones shown | `[ ]` |
| C1.1-T2 | Select "Heated" treatment | Only heated stones shown | `[ ]` |
| C1.1-T3 | Select multiple treatments | Stones matching any selected | `[ ]` |
| C1.1-T4 | Select "Unknown" | Stones with empty treatment_status | `[ ]` |
| C1.1-T5 | Clear treatment filter | All stones shown | `[ ]` |

---

### FILTER-C1.2 — Mining Country Filter

**File**: Manual test cases

**Purpose**: Validate mining country filter works correctly.

**Categories**: Filter Type Tests

**Test Cases**:

| ID | Input | Expected | Status |
|----|-------|----------|--------|
| C1.2-T1 | Select "Russia" | Only Russian-mined stones | `[ ]` |
| C1.2-T2 | Select multiple countries | Stones from any selected country | `[ ]` |
| C1.2-T3 | Country with special chars | Filter works correctly | `[ ]` |

---

### FILTER-C1.3 — Quality Classification Filter

**File**: Manual test cases

**Purpose**: Validate quality classification filter works correctly.

**Categories**: Filter Type Tests

**Test Cases**:

| ID | Input | Expected | Status |
|----|-------|----------|--------|
| C1.3-T1 | Select "Г1" | Only Г1 quality stones | `[ ]` |
| C1.3-T2 | Select "AAA" | Only AAA quality stones | `[ ]` |
| C1.3-T3 | Select multiple grades | Stones matching any grade | `[ ]` |

---

### FILTER-C2.1 — Dimension Filter

**File**: Manual test cases

**Purpose**: Validate dimension filter works correctly.

**Categories**: Filter Type Tests

**Test Cases**:

| ID | Input | Expected | Status |
|----|-------|----------|--------|
| C2.1-T1 | Length 5-10mm | Stones with length in range | `[ ]` |
| C2.1-T2 | Width 3-8mm | Stones with width in range | `[ ]` |
| C2.1-T3 | Both dimensions | Stones matching both ranges | `[ ]` |
| C2.1-T4 | Only min length | Stones >= min length | `[ ]` |

---

### FILTER-C2.2 — Price Per Carat Filter

**File**: Manual test cases

**Purpose**: Validate price per carat filter works correctly.

**Categories**: Filter Type Tests

**Test Cases**:

| ID | Input | Expected | Status |
|----|-------|----------|--------|
| C2.2-T1 | $100-$500/ct | Stones in price range | `[ ]` |
| C2.2-T2 | Min only ($200/ct) | Stones >= $200/ct | `[ ]` |
| C2.2-T3 | Max only ($1000/ct) | Stones <= $1000/ct | `[ ]` |

---

### FILTER-C3.1 — Catalog API

**File**: API test cases (can use Postman/curl)

**Purpose**: Validate catalog API accepts new parameters.

**Categories**: Filter Type Tests, Filter Combination Tests

**Test Cases**:

| ID | Request | Expected Response | Status |
|----|---------|-------------------|--------|
| C3.1-T1 | `GET /api/catalog?treatmentStatus=natural` | Filtered results | `[ ]` |
| C3.1-T2 | `GET /api/catalog?miningCountries=Russia` | Filtered results | `[ ]` |
| C3.1-T3 | `GET /api/catalog?minLength=5&maxLength=10` | Filtered results | `[ ]` |
| C3.1-T4 | `GET /api/catalog?treatmentStatus=natural&miningCountries=Russia` | Combined filter | `[ ]` |

---

### FILTER-C4.2 — Localization

**File**: Manual test cases

**Purpose**: Validate filter labels are localized.

**Categories**: Localization Tests

**Test Cases**:

| ID | Locale | Filter | Expected Label | Status |
|----|--------|--------|----------------|--------|
| C4.2-T1 | en | Treatment Status | "Treatment Status" | `[ ]` |
| C4.2-T2 | ru | Treatment Status | "Статус обработки" | `[ ]` |
| C4.2-T3 | en | Natural treatment | "Natural" | `[ ]` |
| C4.2-T4 | ru | Natural treatment | "Натуральный" | `[ ]` |
| C4.2-T5 | en | Mining Country | "Mining Country" | `[ ]` |
| C4.2-T6 | ru | Mining Country | "Страна добычи" | `[ ]` |

---

### FILTER-C5.1 — Filter Sidebar Visual Redesign

**File**: Visual inspection test cases

**Purpose**: Validate filter sidebar meets luxury design standards.

**Categories**: UX/UI Visual Tests

**Test Cases**:

| ID | Aspect | Expected | Status |
|----|--------|----------|--------|
| C5.1-T1 | Visual hierarchy | Clear distinction between filter sections | `[ ]` |
| C5.1-T2 | Typography | Premium fonts with proper sizing | `[ ]` |
| C5.1-T3 | Spacing | Generous whitespace, content breathes | `[ ]` |
| C5.1-T4 | Section headers | Elegant headers with icons | `[ ]` |
| C5.1-T5 | Collapsible section | Professional filters collapse smoothly | `[ ]` |
| C5.1-T6 | Inspiring header | Motivating header text present | `[ ]` |

---

### FILTER-C5.3 — Micro-interactions and Animations

**File**: Animation test cases

**Purpose**: Validate animations are smooth and premium.

**Categories**: UX/UI Visual Tests

**Test Cases**:

| ID | Animation | Expected | Status |
|----|-----------|----------|--------|
| C5.3-T1 | Hover effect | Filter options scale/color on hover | `[ ]` |
| C5.3-T2 | Selection | Smooth check/uncheck animation | `[ ]` |
| C5.3-T3 | Count update | Badge numbers animate on change | `[ ]` |
| C5.3-T4 | Panel open/close | Smooth transitions | `[ ]` |
| C5.3-T5 | Card entrance | Staggered animation on load | `[ ]` |
| C5.3-T6 | Results update | Fade transition on filter change | `[ ]` |
| C5.3-T7 | Reduced motion | Animations disabled when preferred | `[ ]` |
| C5.3-T8 | Performance | 60fps, no jank | `[ ]` |

---

### FILTER-C5.4 — Active Filter Chips

**File**: Interaction test cases

**Purpose**: Validate active filter chips work correctly.

**Categories**: UX/UI Visual Tests, Filter Type Tests

**Test Cases**:

| ID | Action | Expected | Status |
|----|--------|----------|--------|
| C5.4-T1 | Display | Active filters shown as pills | `[ ]` |
| C5.4-T2 | Remove | Clicking X removes filter | `[ ]` |
| C5.4-T3 | Animation | Smooth remove animation | `[ ]` |
| C5.4-T4 | Color coding | Different colors per category | `[ ]` |
| C5.4-T5 | Clear all | Button clears all filters | `[ ]` |
| C5.4-T6 | Sync | Chips sync with sidebar state | `[ ]` |

---

### FILTER-C5.5 — Loading and Empty States

**File**: State test cases

**Purpose**: Validate loading and empty states are helpful.

**Categories**: UX/UI Visual Tests, Edge Case Tests

**Test Cases**:

| ID | State | Expected | Status |
|----|-------|----------|--------|
| C5.5-T1 | Filter skeleton | Matches filter layout | `[ ]` |
| C5.5-T2 | Results skeleton | Matches grid layout | `[ ]` |
| C5.5-T3 | Shimmer | Subtle shimmer animation | `[ ]` |
| C5.5-T4 | Empty state | Beautiful, helpful message | `[ ]` |
| C5.5-T5 | Suggestions | Empty state suggests changes | `[ ]` |
| C5.5-T6 | Clear action | Easy way to clear filters | `[ ]` |

---

### FILTER-C5.7 — Accessibility

**File**: Accessibility test cases

**Purpose**: Validate accessibility compliance.

**Categories**: Accessibility Tests

**Test Cases**:

| ID | Aspect | Expected | Status |
|----|--------|----------|--------|
| C5.7-T1 | Keyboard nav | Tab through all filters | `[ ]` |
| C5.7-T2 | Enter/Space | Activate filters with keyboard | `[ ]` |
| C5.7-T3 | ARIA labels | All elements labeled | `[ ]` |
| C5.7-T4 | Color contrast | WCAG AA compliant | `[ ]` |
| C5.7-T5 | Focus visible | Clear focus indicators | `[ ]` |
| C5.7-T6 | Screen reader | VoiceOver announces changes | `[ ]` |
| C5.7-T7 | Skip links | Can skip to main content | `[ ]` |

---

## Rules for Adding New Corpus Entries

- **Must be contract-driven**:
  - every new entry must reference a Contract ID (e.g., `FILTER-C1.1`) that explains why it exists.
- **Must state intent**:
  - what property is being gated (filter correctness, URL encoding, localization, etc.).
- **Must be minimal but sufficient**:
  - prefer the smallest test case that reproduces the targeted behavior.
- **Must avoid speculation**:
  - if the expected behavior is uncertain, the contract must explicitly mark uncertainty and add reality-check steps rather than guessing.

---

## Rules for Updating Expected Outputs

Expected outputs may be updated only when:

- a contract explicitly changes intended behavior, and
- acceptance tests are updated in lockstep with the contract's invariants.

Prohibited:

- "update expected output because tests changed" without a contract explaining the intended new behavior.

Required in the contract:

- **what changed** (observable behavior),
- **why it changed** (intent),
- **how it was validated** (acceptance tests),
- **what was reality-checked** (current state validation).

---

## Automated Test Strategy

### Unit Tests (Vitest)

Location: `src/features/gemstones/**/__tests__/`

Tests to create:
- `filter.types.test.ts` — Type validation
- `filter-url.utils.test.ts` — URL encoding/decoding
- `filter-aggregation.service.test.ts` — Filter count aggregation

### Integration Tests

Location: `tests/`

Tests to create:
- `catalog-api.test.ts` — API parameter handling
- `search-api.test.ts` — Search + filter integration

### E2E Tests (Playwright)

Location: `e2e/` (if exists)

Tests to create:
- `filter-sidebar.spec.ts` — UI filter interactions
- `search-filters.spec.ts` — Search page filter integration

---

## When Documentation or Changelog Updates Are Required

When a contract changes externally visible behavior (e.g., new filter type, changed URL parameter, new API parameter), the contract must require updates to:

- relevant docs under `docs/plan/` (interfaces/boundaries/corpus rules), and/or
- `CUSTOMER_FILTERS_ANALYSIS.md` (filter inventory)

If no changelog mechanism exists:

- the contract must state "no changelog mechanism currently observed" and include only the required doc updates.

---

## Template Usage Notes

This corpus document is for the Crystallique gemstone platform filter/search overhaul. Add entries as contracts require them.

**Remember**: The corpus prevents drift. Add entries when contracts require them, update them only when contracts change behavior.

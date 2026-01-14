# Contracts — Filter & Search System Overhaul

## Non-Production / No-Backfill Assumption (Applies to All Contracts)

- This project is **not in production**.
- Database schemas are **mutable**.
- **No backfilling, migrations, or data preservation guarantees are required** beyond what's specified in each contract.

---

## Contract Prefix

All contracts in this overhaul use the prefix `FILTER-` to distinguish from other feature contracts.

---

## Implementation Order

Contracts must be executed in this order based on dependencies:

### Phase 0: Foundation & Re-enablement
1. **FILTER-C0.1**: Re-enable search page filter sidebar — Prerequisites: none
2. **FILTER-C0.2**: Add missing filters to Visual mode — Prerequisites: none
3. **FILTER-C0.3**: Update filter types for new fields — Prerequisites: none

### Phase 1: Professional Filters
4. **FILTER-C1.1**: Add Treatment Status filter — Prerequisites: FILTER-C0.3
5. **FILTER-C1.2**: Add Mining Country filter — Prerequisites: FILTER-C0.3
6. **FILTER-C1.3**: Add Quality Classification filter — Prerequisites: FILTER-C0.3
7. **FILTER-C1.4**: Add Color Change filter — Prerequisites: FILTER-C0.3

### Phase 2: Technical Filters
8. **FILTER-C2.1**: Add Dimension filter — Prerequisites: FILTER-C0.3
9. **FILTER-C2.2**: Add Price Per Carat filter — Prerequisites: FILTER-C0.3
10. **FILTER-C2.3**: Add Has AI Analysis to visual mode — Prerequisites: FILTER-C0.2

### Phase 3: API & Database Updates
11. **FILTER-C3.1**: Update catalog API for new filters — Prerequisites: FILTER-C1.1 through FILTER-C2.2
12. **FILTER-C3.2**: Update search API for new filters — Prerequisites: FILTER-C3.1
13. **FILTER-C3.3**: Update filter counts function — Prerequisites: FILTER-C3.1
14. **FILTER-C3.4**: Add database indexes for new filters — Prerequisites: FILTER-C3.1

### Phase 4: Integration & Polish
15. **FILTER-C4.1**: Integrate all filters on search page — Prerequisites: FILTER-C0.1, FILTER-C3.2
16. **FILTER-C4.2**: Add localization for new filters — Prerequisites: FILTER-C1.1 through FILTER-C2.2
17. **FILTER-C4.3**: Mobile optimization for new filters — Prerequisites: FILTER-C4.1
18. **FILTER-C4.4**: Final verification and documentation — Prerequisites: All above

### Phase 5: UX/UI Design Excellence
19. **FILTER-C5.1**: Filter sidebar visual redesign — Prerequisites: FILTER-C4.1
20. **FILTER-C5.2**: Search experience enhancement — Prerequisites: FILTER-C4.1
21. **FILTER-C5.3**: Micro-interactions and animations — Prerequisites: FILTER-C5.1, FILTER-C5.2
22. **FILTER-C5.4**: Active filters chips and feedback — Prerequisites: FILTER-C5.1
23. **FILTER-C5.5**: Loading states and empty states — Prerequisites: FILTER-C5.1
24. **FILTER-C5.6**: Results display optimization — Prerequisites: FILTER-C5.2
25. **FILTER-C5.7**: Accessibility audit and fixes — Prerequisites: FILTER-C5.1 through FILTER-C5.6
26. **FILTER-C5.8**: Final UX polish and review — Prerequisites: All Phase 5

---

## Contracts

### FILTER-C0.1 — Re-enable Search Page Filter Sidebar

- **ID**: `FILTER-C0.1`
- **Status**: `ready`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Phase 0: Foundation & Re-enablement"

#### Scope

- **In scope**:
  - Remove the commented-out filter sidebar code in `search-results.tsx`
  - Ensure FilterSidebar component works on search page
  - Verify filter state syncs with search results
  - Test filter + search query combination

- **Out of scope**:
  - Adding new filter types (separate contracts)
  - Modifying FilterSidebar component itself
  - Performance optimization

#### Affected Packages / Systems

- `src/features/search/components/search-results.tsx`

#### Public Artifacts

- **Components**: Modified `SearchResults` with filter sidebar enabled

#### Invariants

1. Filter sidebar renders on search page
2. Selecting filters updates search results
3. Search query + filters work together
4. URL parameters persist filter state

#### Acceptance Tests

1. **Sidebar renders**: Filter sidebar visible on `/search` page - `[ ]`
2. **Filters work**: Selecting a filter updates results - `[ ]`
3. **Combined query**: Search "ruby" + filter "red" returns correct results - `[ ]`
4. **URL params**: Filters persist in URL on search page - `[ ]`
5. **Clear works**: Clearing filters shows all search results - `[ ]`
6. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not add new filter types
- Do not modify filter component internals
- Do not optimize performance

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify filter sidebar is commented out in `search-results.tsx`
  - `[ ]` Verify FilterSidebar component exists and is functional
  - `[ ]` Verify search API supports filter parameters

---

### FILTER-C0.2 — Add Missing Filters to Visual Mode

- **ID**: `FILTER-C0.2`
- **Status**: `ready`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Phase 0: Foundation & Re-enablement"

#### Scope

- **In scope**:
  - Add Gemstone Type selector to visual filter mode
  - Add Origin selector to visual filter mode
  - Ensure visual mode has parity with standard mode

- **Out of scope**:
  - Adding completely new filter types
  - Modifying standard mode filters

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/advanced-filters-v2-controlled.tsx`
- `src/features/gemstones/components/filters/visual/` (may need new components)

#### Public Artifacts

- **Components**: Modified `AdvancedFiltersV2Controlled` with Gemstone Type and Origin

#### Invariants

1. Visual mode shows Gemstone Type filter
2. Visual mode shows Origin filter
3. Both filters work correctly
4. Filter counts display properly

#### Acceptance Tests

1. **Type filter visible**: Gemstone Type selector in visual mode - `[ ]`
2. **Origin filter visible**: Origin selector in visual mode - `[ ]`
3. **Type selection works**: Selecting type filters results - `[ ]`
4. **Origin selection works**: Selecting origin filters results - `[ ]`
5. **Counts accurate**: Filter counts match actual results - `[ ]`
6. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not add new filter types beyond Type and Origin
- Do not modify standard mode

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify visual mode component structure
  - `[ ]` Verify existing visual filter components (CutShapeSelector, ColorPicker, etc.)
  - `[ ]` Verify filter options are available from API

---

### FILTER-C0.3 — Update Filter Types for New Fields

- **ID**: `FILTER-C0.3`
- **Status**: `ready`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Target Architecture"

#### Scope

- **In scope**:
  - Update `AdvancedGemstoneFilters` interface with new fields
  - Add `TreatmentStatus` type
  - Add `DimensionRange` interface
  - Update `FilterUrlParams` for URL encoding
  - Update filter utility functions

- **Out of scope**:
  - UI components (separate contracts)
  - API changes (separate contracts)

#### Affected Packages / Systems

- `src/features/gemstones/types/filter.types.ts`
- `src/features/gemstones/utils/filter-url.utils.ts`

#### Public Artifacts

- **Types**: Extended `AdvancedGemstoneFilters`, new `TreatmentStatus`, `DimensionRange`

#### Invariants

1. New filter fields defined in TypeScript
2. URL encoding/decoding works for new fields
3. Existing filter functionality unchanged
4. Type safety maintained

#### Acceptance Tests

1. **Types compile**: All new types compile without errors - `[ ]`
2. **URL encoding**: New filters encode to URL params correctly - `[ ]`
3. **URL decoding**: URL params decode to filter objects correctly - `[ ]`
4. **Backward compat**: Existing filter URLs still work - `[ ]`
5. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not implement UI components
- Do not modify API

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify current `AdvancedGemstoneFilters` structure
  - `[ ]` Verify `filter-url.utils.ts` encoding/decoding functions
  - `[ ]` Verify database fields exist (treatment_status, mining_country, etc.)

---

### FILTER-C1.1 — Add Treatment Status Filter

- **ID**: `FILTER-C1.1`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Decision 1: Treatment Status Values"

#### Scope

- **In scope**:
  - Create Treatment Status filter component
  - Add to both standard and visual filter modes
  - Support multi-select with predefined options
  - Handle empty/unknown treatment status

- **Out of scope**:
  - API changes (separate contract)
  - Database changes

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/advanced-filters-controlled.tsx`
- `src/features/gemstones/components/filters/advanced-filters-v2-controlled.tsx`
- `src/features/gemstones/components/filters/visual/` (new component)

#### Public Artifacts

- **Components**: `TreatmentStatusSelector` (new), modified filter components

#### Invariants

1. Treatment status filter renders in both modes
2. Multi-select works correctly
3. "Unknown" option handles empty values
4. Filter state syncs with parent

#### Acceptance Tests

1. **Standard mode**: Treatment filter in standard mode - `[ ]`
2. **Visual mode**: Treatment filter in visual mode - `[ ]`
3. **Multi-select**: Can select multiple treatment types - `[ ]`
4. **Unknown option**: "Unknown" option available - `[ ]`
5. **Selection works**: Selecting treatment updates filter state - `[ ]`
6. **Clear works**: Can clear treatment selection - `[ ]`
7. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify API
- Do not add database indexes

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify `treatment_status` field exists in database
  - `[ ]` Check existing treatment values in data
  - `[ ]` Verify filter component patterns

---

### FILTER-C1.2 — Add Mining Country Filter

- **ID**: `FILTER-C1.2`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Decision 3: Mining Country vs Origin"

#### Scope

- **In scope**:
  - Create Mining Country filter component
  - Add to both standard and visual filter modes
  - Support multi-select with country list
  - Handle empty mining country

- **Out of scope**:
  - API changes (separate contract)
  - Modifying Origin filter

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/advanced-filters-controlled.tsx`
- `src/features/gemstones/components/filters/advanced-filters-v2-controlled.tsx`

#### Public Artifacts

- **Components**: Modified filter components with Mining Country

#### Invariants

1. Mining Country filter renders in both modes
2. Multi-select works correctly
3. Country list populated from data
4. Filter state syncs with parent

#### Acceptance Tests

1. **Standard mode**: Mining Country filter in standard mode - `[ ]`
2. **Visual mode**: Mining Country filter in visual mode - `[ ]`
3. **Country list**: Shows available countries - `[ ]`
4. **Multi-select**: Can select multiple countries - `[ ]`
5. **Selection works**: Selecting country updates filter state - `[ ]`
6. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify Origin filter
- Do not modify API

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify `mining_country` field exists in database
  - `[ ]` Check existing mining country values in data
  - `[ ]` Determine distinct country values

---

### FILTER-C1.3 — Add Quality Classification Filter

- **ID**: `FILTER-C1.3`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Decision 2: Quality Classification Approach"

#### Scope

- **In scope**:
  - Create Quality Classification filter component
  - Add to both standard and visual filter modes
  - Support common grades (Г1, Г2, Г3, AAA, AA, A)
  - Handle free-form values

- **Out of scope**:
  - API changes (separate contract)

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/advanced-filters-controlled.tsx`
- `src/features/gemstones/components/filters/advanced-filters-v2-controlled.tsx`

#### Public Artifacts

- **Components**: Modified filter components with Quality Classification

#### Invariants

1. Quality filter renders in both modes
2. Common grades shown as options
3. Custom values supported
4. Filter state syncs with parent

#### Acceptance Tests

1. **Standard mode**: Quality filter in standard mode - `[ ]`
2. **Visual mode**: Quality filter in visual mode - `[ ]`
3. **Common grades**: Shows Г1, Г2, Г3, AAA, AA, A options - `[ ]`
4. **Selection works**: Selecting grade updates filter state - `[ ]`
5. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify API

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify `quality_classification` field exists in database
  - `[ ]` Check existing quality values in data

---

### FILTER-C1.4 — Add Color Change Filter

- **ID**: `FILTER-C1.4`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Phase 1: Professional Filters"

#### Scope

- **In scope**:
  - Create Color Change filter (boolean toggle)
  - Add to both standard and visual filter modes
  - Filter gemstones with color change description

- **Out of scope**:
  - API changes (separate contract)

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/advanced-filters-controlled.tsx`
- `src/features/gemstones/components/filters/advanced-filters-v2-controlled.tsx`

#### Public Artifacts

- **Components**: Modified filter components with Color Change toggle

#### Invariants

1. Color Change toggle renders in both modes
2. Toggle filters gemstones with color_change_description
3. Filter state syncs with parent

#### Acceptance Tests

1. **Standard mode**: Color Change toggle in standard mode - `[ ]`
2. **Visual mode**: Color Change toggle in visual mode - `[ ]`
3. **Toggle works**: Enabling shows only color-change stones - `[ ]`
4. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify API

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify `color_change_description` field exists in database
  - `[ ]` Count gemstones with color change data

---

### FILTER-C2.1 — Add Dimension Filter

- **ID**: `FILTER-C2.1`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Decision 4: Dimension Filter Approach"

#### Scope

- **In scope**:
  - Create Dimension filter component (Length × Width)
  - Add to both standard and visual filter modes
  - Support range selection for both dimensions

- **Out of scope**:
  - Depth dimension (deferred)
  - API changes (separate contract)

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/advanced-filters-controlled.tsx`
- `src/features/gemstones/components/filters/advanced-filters-v2-controlled.tsx`
- `src/features/gemstones/components/filters/visual/` (new component)

#### Public Artifacts

- **Components**: `DimensionRangeSelector` (new), modified filter components

#### Invariants

1. Dimension filter renders in both modes
2. Length and Width ranges work independently
3. Values in millimeters
4. Filter state syncs with parent

#### Acceptance Tests

1. **Standard mode**: Dimension filter in standard mode - `[ ]`
2. **Visual mode**: Dimension filter in visual mode - `[ ]`
3. **Length range**: Can set min/max length - `[ ]`
4. **Width range**: Can set min/max width - `[ ]`
5. **Combined**: Can filter by both dimensions - `[ ]`
6. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not include depth dimension
- Do not modify API

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify `length_mm`, `width_mm` fields exist in database
  - `[ ]` Check min/max dimension values in data

---

### FILTER-C2.2 — Add Price Per Carat Filter

- **ID**: `FILTER-C2.2`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Phase 2: Technical Filters"

#### Scope

- **In scope**:
  - Create Price Per Carat filter component
  - Add to both standard and visual filter modes
  - Support range selection with currency formatting

- **Out of scope**:
  - API changes (separate contract)

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/advanced-filters-controlled.tsx`
- `src/features/gemstones/components/filters/advanced-filters-v2-controlled.tsx`

#### Public Artifacts

- **Components**: Modified filter components with Price Per Carat

#### Invariants

1. Price Per Carat filter renders in both modes
2. Range slider works correctly
3. Currency formatting applied
4. Filter state syncs with parent

#### Acceptance Tests

1. **Standard mode**: Price/carat filter in standard mode - `[ ]`
2. **Visual mode**: Price/carat filter in visual mode - `[ ]`
3. **Range works**: Can set min/max price per carat - `[ ]`
4. **Formatting**: Values show with currency symbol - `[ ]`
5. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify API

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify `price_per_carat` field exists in database
  - `[ ]` Check min/max price per carat values in data

---

### FILTER-C2.3 — Add Has AI Analysis to Visual Mode

- **ID**: `FILTER-C2.3`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Phase 2: Technical Filters"

#### Scope

- **In scope**:
  - Add Has AI Analysis toggle to visual filter mode
  - Already exists in standard mode, just add to visual

- **Out of scope**:
  - Modifying the filter logic

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/advanced-filters-v2-controlled.tsx`

#### Public Artifacts

- **Components**: Modified `AdvancedFiltersV2Controlled`

#### Invariants

1. Has AI Analysis toggle visible in visual mode
2. Toggle works correctly
3. Consistent with standard mode behavior

#### Acceptance Tests

1. **Toggle visible**: Has AI Analysis in visual mode - `[ ]`
2. **Toggle works**: Enabling filters to AI-analyzed stones - `[ ]`
3. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify filter logic

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify hasAIAnalysis filter exists in standard mode
  - `[ ]` Verify ToggleCards component supports additional toggles

---

### FILTER-C3.1 — Update Catalog API for New Filters

- **ID**: `FILTER-C3.1`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Phase 3: API & Database Updates"

#### Scope

- **In scope**:
  - Update `/api/catalog` to accept new filter parameters
  - Add query logic for treatment_status, mining_country, quality_classification
  - Add query logic for color_change, dimensions, price_per_carat
  - Handle empty/null values gracefully

- **Out of scope**:
  - Search API (separate contract)
  - Filter counts (separate contract)

#### Affected Packages / Systems

- `src/app/api/catalog/route.ts`

#### Public Artifacts

- **APIs**: Extended `GET /api/catalog` with new filter params

#### Invariants

1. All new filter parameters accepted
2. Queries return correct filtered results
3. Empty values handled gracefully
4. Performance acceptable

#### Acceptance Tests

1. **Treatment filter**: `?treatmentStatus=natural` returns correct results - `[ ]`
2. **Mining country**: `?miningCountries=Russia` returns correct results - `[ ]`
3. **Quality**: `?qualityClassifications=Г1` returns correct results - `[ ]`
4. **Color change**: `?hasColorChange=true` returns correct results - `[ ]`
5. **Dimensions**: `?minLength=5&maxLength=10` returns correct results - `[ ]`
6. **Price/carat**: `?minPricePerCarat=100&maxPricePerCarat=500` returns correct results - `[ ]`
7. **Combined**: Multiple new filters work together - `[ ]`
8. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify search API
- Do not update filter counts

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify current catalog API structure
  - `[ ]` Verify database fields accessible from API
- **Supabase checks**: `[ ]`
  - `[ ]` Verify gemstones_enriched view includes new fields

---

### FILTER-C3.2 — Update Search API for New Filters

- **ID**: `FILTER-C3.2`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Phase 3: API & Database Updates"

#### Scope

- **In scope**:
  - Update `/api/search` to accept new filter parameters
  - Ensure search + new filters work together
  - Update search service if needed

- **Out of scope**:
  - Catalog API (separate contract)
  - Filter counts (separate contract)

#### Affected Packages / Systems

- `src/app/api/search/route.ts`
- `src/features/search/services/search.service.ts`
- `src/features/search/types/search.types.ts`
- `src/lib/validators/search.validator.ts`

#### Public Artifacts

- **APIs**: Extended `POST /api/search` with new filter params

#### Invariants

1. All new filter parameters accepted
2. Search query + filters work together
3. Results correctly filtered
4. Performance acceptable

#### Acceptance Tests

1. **Search + treatment**: Search "ruby" + treatment=natural works - `[ ]`
2. **Search + country**: Search "emerald" + miningCountry=Colombia works - `[ ]`
3. **All filters**: All new filters work with search - `[ ]`
4. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify catalog API
- Do not update filter counts

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify current search API structure
  - `[ ]` Verify SearchFilters type
  - `[ ]` Verify search service query building

---

### FILTER-C3.3 — Update Filter Counts Function

- **ID**: `FILTER-C3.3`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Phase 3: API & Database Updates"

#### Scope

- **In scope**:
  - Update `get_catalog_filter_counts` RPC function
  - Add counts for new filter fields
  - Ensure performance acceptable

- **Out of scope**:
  - UI changes
  - API route changes

#### Affected Packages / Systems

- `supabase/migrations/` (new migration)
- Database function `get_catalog_filter_counts`

#### Public Artifacts

- **RPCs**: Extended `get_catalog_filter_counts`

#### Invariants

1. Function returns counts for all filter fields
2. New field counts accurate
3. Performance acceptable

#### Acceptance Tests

1. **Treatment counts**: Returns treatment_status counts - `[ ]`
2. **Country counts**: Returns mining_country counts - `[ ]`
3. **Quality counts**: Returns quality_classification counts - `[ ]`
4. **Performance**: Function executes in <500ms - `[ ]`
5. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify UI
- Do not modify API routes

#### Reality-Check Requirements

- **Supabase checks**: `[ ]`
  - `[ ]` Verify current get_catalog_filter_counts function
  - `[ ]` Verify function output structure

---

### FILTER-C3.4 — Add Database Indexes for New Filters

- **ID**: `FILTER-C3.4`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Risk 1: Performance Degradation"

#### Scope

- **In scope**:
  - Add indexes for treatment_status, mining_country, quality_classification
  - Add indexes for length_mm, width_mm, price_per_carat
  - Verify query performance improvement

- **Out of scope**:
  - Application code changes

#### Affected Packages / Systems

- `supabase/migrations/` (new migration)

#### Public Artifacts

- **Indexes**: New indexes on filter columns

#### Invariants

1. Indexes created successfully
2. Query performance improved or unchanged
3. No negative impact on write performance

#### Acceptance Tests

1. **Indexes exist**: All new indexes visible in database - `[ ]`
2. **Query performance**: Filter queries use indexes (EXPLAIN) - `[ ]`
3. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify application code

#### Reality-Check Requirements

- **Supabase checks**: `[ ]`
  - `[ ]` Verify existing indexes on gemstones table
  - `[ ]` Check query plans for filter queries

---

### FILTER-C4.1 — Integrate All Filters on Search Page

- **ID**: `FILTER-C4.1`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Phase 4: Integration & Polish"

#### Scope

- **In scope**:
  - Ensure all new filters work on search page
  - Verify filter + search query combination
  - Test all filter combinations

- **Out of scope**:
  - Adding more filters
  - Performance optimization

#### Affected Packages / Systems

- `src/features/search/components/search-results.tsx`

#### Public Artifacts

- **Components**: Verified `SearchResults` with all filters

#### Invariants

1. All filters available on search page
2. Filters work with search query
3. URL parameters persist all filters

#### Acceptance Tests

1. **All filters visible**: All 17+ filters on search page - `[ ]`
2. **Combined works**: Search + multiple filters works - `[ ]`
3. **URL persistence**: All filters persist in URL - `[ ]`
4. **Clear all**: Can clear all filters at once - `[ ]`
5. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not add new filters
- Do not optimize performance

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify search page uses FilterSidebar
  - `[ ]` Verify all filter types passed to component

---

### FILTER-C4.2 — Add Localization for New Filters

- **ID**: `FILTER-C4.2`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### G6 — Localization Support"

#### Scope

- **In scope**:
  - Add EN translations for new filter labels
  - Add RU translations for new filter labels
  - Add translations for treatment status values
  - Add translations for quality classification values

- **Out of scope**:
  - Component changes
  - API changes

#### Affected Packages / Systems

- `src/messages/en/filters.json`
- `src/messages/ru/filters.json`

#### Public Artifacts

- **Translations**: Extended filter translation files

#### Invariants

1. All new filters have EN translations
2. All new filters have RU translations
3. Treatment values translated
4. Quality values translated

#### Acceptance Tests

1. **EN labels**: All new filters show English labels - `[ ]`
2. **RU labels**: All new filters show Russian labels - `[ ]`
3. **Treatment EN**: Treatment values in English - `[ ]`
4. **Treatment RU**: Treatment values in Russian - `[ ]`
5. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify components
- Do not modify API

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify current filter translation structure
  - `[ ]` Verify translation key patterns

---

### FILTER-C4.3 — Mobile Optimization for New Filters

- **ID**: `FILTER-C4.3`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Risk 4: Mobile UX Complexity"

#### Scope

- **In scope**:
  - Verify new filters work on mobile
  - Group professional filters in collapsible section
  - Test touch interactions
  - Verify bottom sheet behavior

- **Out of scope**:
  - Desktop-only changes
  - Performance optimization

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/filter-sidebar.tsx`
- `src/features/gemstones/components/filters/advanced-filters-v2-controlled.tsx`

#### Public Artifacts

- **Components**: Mobile-optimized filter components

#### Invariants

1. All filters usable on mobile
2. Professional filters grouped
3. Touch interactions work
4. Bottom sheet scrolls properly

#### Acceptance Tests

1. **Mobile render**: All filters render on mobile - `[ ]`
2. **Touch works**: Can tap to select filters - `[ ]`
3. **Scroll works**: Can scroll through all filters - `[ ]`
4. **Collapsible**: Professional section collapses - `[ ]`
5. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not change desktop behavior
- Do not optimize performance

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Verify current mobile filter behavior
  - `[ ]` Verify bottom sheet component

---

### FILTER-C4.4 — Final Verification and Documentation

- **ID**: `FILTER-C4.4`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "## Success Criteria"

#### Scope

- **In scope**:
  - Verify all success criteria met
  - Update CUSTOMER_FILTERS_ANALYSIS.md
  - Create migration summary
  - Update any relevant documentation

- **Out of scope**:
  - Code changes

#### Affected Packages / Systems

- `CUSTOMER_FILTERS_ANALYSIS.md`
- `docs/` (documentation)

#### Public Artifacts

- **Docs**: Updated documentation

#### Invariants

1. All success criteria verified
2. Documentation accurate

#### Acceptance Tests

1. **Filter coverage**: All 17+ filter types available - `[ ]`
2. **Search parity**: Search page has all filters - `[ ]`
3. **Professional filters**: Treatment, country, quality work - `[ ]`
4. **Performance**: Page load within 10% baseline - `[ ]`
5. **Localization**: EN/RU translations complete - `[ ]`
6. **Mobile**: All filters work on mobile - `[ ]`
7. **Data handling**: Empty data handled gracefully - `[ ]`
8. **Docs updated**: CUSTOMER_FILTERS_ANALYSIS.md updated - `[ ]`

#### Explicit Non-Goals

- Do not make code changes

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` All contracts FILTER-C0.1 through FILTER-C4.3 complete

---

### FILTER-C5.1 — Filter Sidebar Visual Redesign

- **ID**: `FILTER-C5.1`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### G7 — Premium UX/UI Design Excellence"

#### Scope

- **In scope**:
  - Redesign filter sidebar with luxury aesthetic
  - Implement elegant section headers with icons
  - Add visual hierarchy between filter groups
  - Improve spacing and typography
  - Add collapsible "Professional Specs" section
  - Implement filter group separators
  - Add inspiring header ("Find Your Perfect Gemstone")

- **Out of scope**:
  - Animations (separate contract)
  - Search input redesign (separate contract)

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/filter-sidebar.tsx`
- `src/features/gemstones/components/filters/advanced-filters-controlled.tsx`
- `src/features/gemstones/components/filters/advanced-filters-v2-controlled.tsx`
- `src/shared/components/ui/` (may need new UI primitives)

#### Public Artifacts

- **Components**: Redesigned filter sidebar with premium styling

#### Invariants

1. All existing filter functionality preserved
2. Visual design matches luxury e-commerce standards
3. Clear visual hierarchy between sections
4. Professional filters grouped and collapsible
5. Responsive design maintained

#### Acceptance Tests

1. **Visual hierarchy**: Clear distinction between filter sections - `[ ]`
2. **Section headers**: Elegant headers with appropriate icons - `[ ]`
3. **Spacing**: Generous whitespace, content breathes - `[ ]`
4. **Typography**: Premium fonts with proper hierarchy - `[ ]`
5. **Collapsible**: Professional section collapses smoothly - `[ ]`
6. **Inspiring header**: "Find Your Perfect Gemstone" or similar - `[ ]`
7. **Functionality**: All filters still work correctly - `[ ]`
8. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not add animations (FILTER-C5.3)
- Do not modify search input (FILTER-C5.2)
- Do not change filter logic

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Review current filter sidebar styling
  - `[ ]` Identify existing UI primitives to leverage
  - `[ ]` Check Tailwind config for design tokens

---

### FILTER-C5.2 — Search Experience Enhancement

- **ID**: `FILTER-C5.2`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "## UX/UI Design Vision"

#### Scope

- **In scope**:
  - Redesign search input with premium styling
  - Large, prominent search field with subtle shadow
  - Animated placeholder text with search suggestions
  - Improve search suggestions dropdown design
  - Add gemstone thumbnails to suggestions
  - Improve search results header
  - Add grid/list view toggle with smooth transition

- **Out of scope**:
  - Search logic changes
  - Filter sidebar (separate contract)

#### Affected Packages / Systems

- `src/features/search/components/search-input.tsx`
- `src/features/search/components/search-results.tsx`
- `src/features/search/components/fuzzy-search-banner.tsx`

#### Public Artifacts

- **Components**: Redesigned search input and results display

#### Invariants

1. Search functionality unchanged
2. Premium visual design
3. Suggestions show relevant thumbnails
4. Grid/list toggle works smoothly
5. Responsive on all devices

#### Acceptance Tests

1. **Search input**: Large, elegant input with shadow - `[ ]`
2. **Placeholder**: Animated placeholder with suggestions - `[ ]`
3. **Suggestions dropdown**: Beautiful dropdown with thumbnails - `[ ]`
4. **Results header**: Clear, informative results summary - `[ ]`
5. **View toggle**: Grid/list toggle with smooth transition - `[ ]`
6. **Functionality**: Search still works correctly - `[ ]`
7. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not change search algorithm
- Do not modify filter sidebar

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Review current search input component
  - `[ ]` Check search suggestions implementation
  - `[ ]` Verify gemstone image availability for suggestions

---

### FILTER-C5.3 — Micro-interactions and Animations

- **ID**: `FILTER-C5.3`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Micro-interactions & Animations"

#### Scope

- **In scope**:
  - Add hover effects to filter options (scale + color)
  - Implement smooth check/uncheck animations
  - Add ripple effect on click (optional)
  - Animate filter count badge updates
  - Add smooth transitions for filter panel open/close
  - Implement staggered card entrance animations
  - Add fade transitions when results update
  - Respect `prefers-reduced-motion`

- **Out of scope**:
  - Major layout changes
  - New functionality

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/` (all filter components)
- `src/features/gemstones/components/gemstone-card.tsx`
- `src/shared/components/ui/` (animation utilities)

#### Public Artifacts

- **Components**: Animated filter and result components
- **Utilities**: Reusable animation hooks/utilities

#### Invariants

1. All animations use GPU-accelerated properties (transform, opacity)
2. Animations respect `prefers-reduced-motion`
3. No performance degradation
4. Animations feel natural and premium
5. All functionality preserved

#### Acceptance Tests

1. **Hover effects**: Filter options respond to hover - `[ ]`
2. **Selection animation**: Smooth check/uncheck - `[ ]`
3. **Count animation**: Badge numbers animate on change - `[ ]`
4. **Panel transitions**: Smooth open/close - `[ ]`
5. **Card entrance**: Staggered animation on load - `[ ]`
6. **Results fade**: Smooth transition on filter change - `[ ]`
7. **Reduced motion**: Animations disabled when preferred - `[ ]`
8. **Performance**: No jank or frame drops - `[ ]`
9. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not add complex physics-based animations
- Do not change layout structure

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Check for existing animation utilities
  - `[ ]` Verify Framer Motion or similar is available
  - `[ ]` Review current transition implementations

---

### FILTER-C5.4 — Active Filters Chips and Feedback

- **ID**: `FILTER-C5.4`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "## UX/UI Design Vision"

#### Scope

- **In scope**:
  - Create active filter chips component
  - Display selected filters as removable pills
  - Color-code chips by filter category
  - Add smooth remove animation
  - Implement "Clear All" action
  - Show chips above results grid
  - Add filter summary count

- **Out of scope**:
  - Filter sidebar changes
  - Filter logic changes

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/` (new component)
- `src/features/gemstones/components/gemstone-catalog-optimized.tsx`
- `src/features/search/components/search-results.tsx`

#### Public Artifacts

- **Components**: `ActiveFilterChips` (new)

#### Invariants

1. Chips accurately reflect active filters
2. Removing chip updates filter state
3. Clear all removes all filters
4. Chips are color-coded by category
5. Works on both catalog and search pages

#### Acceptance Tests

1. **Chips display**: Active filters shown as pills - `[ ]`
2. **Remove works**: Clicking X removes filter - `[ ]`
3. **Animation**: Smooth remove animation - `[ ]`
4. **Color coding**: Different colors per category - `[ ]`
5. **Clear all**: Button clears all filters - `[ ]`
6. **Sync**: Chips sync with sidebar state - `[ ]`
7. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify filter sidebar
- Do not change filter logic

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Check if similar component exists
  - `[ ]` Review filter state management
  - `[ ]` Verify filter categories for color coding

---

### FILTER-C5.5 — Loading States and Empty States

- **ID**: `FILTER-C5.5`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "#### 5. Loading & Empty States"

#### Scope

- **In scope**:
  - Design and implement skeleton loaders for filters
  - Design and implement skeleton loaders for results grid
  - Add shimmer animation to skeletons
  - Create beautiful empty state for no results
  - Add helpful suggestions in empty state
  - Implement progressive loading (filters before results)
  - Add loading indicator for filter count updates

- **Out of scope**:
  - Error states (separate concern)
  - Offline states

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/` (loading states)
- `src/features/gemstones/components/gemstone-catalog-optimized.tsx`
- `src/features/search/components/search-results.tsx`
- `src/shared/components/ui/` (skeleton components)

#### Public Artifacts

- **Components**: `FilterSkeleton`, `ResultsSkeleton`, `EmptyState`

#### Invariants

1. Loading states match final layout
2. Shimmer animation is subtle and premium
3. Empty state is helpful and friendly
4. Progressive loading improves perceived performance
5. All states are accessible

#### Acceptance Tests

1. **Filter skeleton**: Skeleton matches filter layout - `[ ]`
2. **Results skeleton**: Skeleton matches grid layout - `[ ]`
3. **Shimmer**: Subtle shimmer animation - `[ ]`
4. **Empty state**: Beautiful, helpful no-results message - `[ ]`
5. **Suggestions**: Empty state suggests filter changes - `[ ]`
6. **Progressive**: Filters load before results - `[ ]`
7. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not handle error states
- Do not add retry logic

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Check existing skeleton components
  - `[ ]` Review current loading implementations
  - `[ ]` Check empty state patterns in codebase

---

### FILTER-C5.6 — Results Display Optimization

- **ID**: `FILTER-C5.6`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "## UX/UI Design Vision"

#### Scope

- **In scope**:
  - Enhance gemstone card design for premium feel
  - Add hover effects showing key details
  - Implement quick-view modal for gemstone preview
  - Optimize infinite scroll experience
  - Add elegant loading indicator for more results
  - Improve grid spacing and layout
  - Add subtle card shadows and borders

- **Out of scope**:
  - Gemstone detail page changes
  - Cart functionality

#### Affected Packages / Systems

- `src/features/gemstones/components/gemstone-card.tsx`
- `src/features/gemstones/components/gemstone-catalog-optimized.tsx`
- `src/shared/components/ui/` (modal component)

#### Public Artifacts

- **Components**: Enhanced `GemstoneCard`, `QuickViewModal` (new)

#### Invariants

1. Cards display all essential information
2. Hover effects are smooth and informative
3. Quick-view modal loads quickly
4. Infinite scroll is seamless
5. Grid layout is visually balanced

#### Acceptance Tests

1. **Card design**: Premium card styling - `[ ]`
2. **Hover effects**: Details appear on hover - `[ ]`
3. **Quick view**: Modal shows gemstone preview - `[ ]`
4. **Infinite scroll**: Smooth loading of more items - `[ ]`
5. **Loading indicator**: Elegant "loading more" state - `[ ]`
6. **Grid layout**: Balanced, premium spacing - `[ ]`
7. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify detail page
- Do not add cart functionality

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Review current gemstone card component
  - `[ ]` Check existing modal components
  - `[ ]` Review infinite scroll implementation

---

### FILTER-C5.7 — Accessibility Audit and Fixes

- **ID**: `FILTER-C5.7`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "### Accessibility Requirements"

#### Scope

- **In scope**:
  - Audit all filter components for keyboard navigation
  - Add proper ARIA labels and roles
  - Ensure WCAG AA color contrast compliance
  - Add visible focus indicators
  - Implement screen reader announcements for filter changes
  - Test with screen reader (VoiceOver/NVDA)
  - Add skip links for filter sidebar

- **Out of scope**:
  - WCAG AAA compliance
  - Cognitive accessibility beyond basics

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/` (all components)
- `src/features/search/components/` (search components)

#### Public Artifacts

- **Components**: Accessibility-enhanced filter components

#### Invariants

1. Full keyboard navigation support
2. All interactive elements have ARIA labels
3. Color contrast meets WCAG AA
4. Focus states are clearly visible
5. Screen reader announces filter changes

#### Acceptance Tests

1. **Keyboard nav**: All filters accessible via keyboard - `[ ]`
2. **ARIA labels**: All elements properly labeled - `[ ]`
3. **Color contrast**: Passes WCAG AA checker - `[ ]`
4. **Focus visible**: Clear focus indicators - `[ ]`
5. **Screen reader**: Filter changes announced - `[ ]`
6. **Skip links**: Can skip to main content - `[ ]`
7. **VoiceOver test**: Works with VoiceOver - `[ ]`
8. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not pursue WCAG AAA
- Do not add complex cognitive aids

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` Run accessibility audit on current filters
  - `[ ]` Check existing ARIA implementations
  - `[ ]` Review focus state styling

---

### FILTER-C5.8 — Final UX Polish and Review

- **ID**: `FILTER-C5.8`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/filter-search-overhaul/00_vision.md` → "## Success Criteria"

#### Scope

- **In scope**:
  - Comprehensive UX review of all filter/search features
  - Fix any visual inconsistencies
  - Ensure all animations are smooth
  - Verify mobile experience is premium
  - Cross-browser testing (Chrome, Safari, Firefox)
  - Performance audit (no animation jank)
  - Final polish pass on all components
  - Update documentation with UX guidelines

- **Out of scope**:
  - New features
  - Major redesigns

#### Affected Packages / Systems

- All filter and search components
- Documentation

#### Public Artifacts

- **Docs**: UX guidelines documentation

#### Invariants

1. Consistent visual design across all components
2. All animations smooth at 60fps
3. Mobile experience matches desktop quality
4. Cross-browser compatibility verified
5. Documentation complete

#### Acceptance Tests

1. **Visual consistency**: All components match design system - `[ ]`
2. **Animation performance**: 60fps, no jank - `[ ]`
3. **Mobile quality**: Premium feel on mobile - `[ ]`
4. **Chrome**: Works perfectly in Chrome - `[ ]`
5. **Safari**: Works perfectly in Safari - `[ ]`
6. **Firefox**: Works perfectly in Firefox - `[ ]`
7. **Documentation**: UX guidelines documented - `[ ]`
8. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not add new features
- Do not make major changes

#### Reality-Check Requirements

- **Codebase checks**: `[ ]`
  - `[ ]` All Phase 5 contracts complete
  - `[ ]` No outstanding visual bugs

---

## Contract Status Summary

| Contract ID | Status | Dependencies | Notes |
|------------|--------|--------------|-------|
| FILTER-C0.1 | `ready` | None | Re-enable search filters |
| FILTER-C0.2 | `ready` | None | Visual mode parity |
| FILTER-C0.3 | `ready` | None | Type definitions |
| FILTER-C1.1 | `draft` | FILTER-C0.3 | Treatment Status |
| FILTER-C1.2 | `draft` | FILTER-C0.3 | Mining Country |
| FILTER-C1.3 | `draft` | FILTER-C0.3 | Quality Classification |
| FILTER-C1.4 | `draft` | FILTER-C0.3 | Color Change |
| FILTER-C2.1 | `draft` | FILTER-C0.3 | Dimensions |
| FILTER-C2.2 | `draft` | FILTER-C0.3 | Price Per Carat |
| FILTER-C2.3 | `draft` | FILTER-C0.2 | AI Analysis visual |
| FILTER-C3.1 | `draft` | FILTER-C1.x, C2.x | Catalog API |
| FILTER-C3.2 | `draft` | FILTER-C3.1 | Search API |
| FILTER-C3.3 | `draft` | FILTER-C3.1 | Filter counts |
| FILTER-C3.4 | `draft` | FILTER-C3.1 | Database indexes |
| FILTER-C4.1 | `draft` | FILTER-C0.1, C3.2 | Search integration |
| FILTER-C4.2 | `draft` | FILTER-C1.x, C2.x | Localization |
| FILTER-C4.3 | `draft` | FILTER-C4.1 | Mobile optimization |
| FILTER-C4.4 | `draft` | All Phase 0-4 | Phase 4 verification |
| FILTER-C5.1 | `draft` | FILTER-C4.1 | Sidebar visual redesign |
| FILTER-C5.2 | `draft` | FILTER-C4.1 | Search experience |
| FILTER-C5.3 | `draft` | FILTER-C5.1, C5.2 | Micro-interactions |
| FILTER-C5.4 | `draft` | FILTER-C5.1 | Active filter chips |
| FILTER-C5.5 | `draft` | FILTER-C5.1 | Loading/empty states |
| FILTER-C5.6 | `draft` | FILTER-C5.2 | Results display |
| FILTER-C5.7 | `draft` | FILTER-C5.1-C5.6 | Accessibility |
| FILTER-C5.8 | `draft` | All Phase 5 | Final UX polish |

---

## Notes

- This overhaul builds on the FLEX-C0.1 flexible fields migration
- Follows patterns established in CUT-C migration for database changes
- Professional filters address specific customer requirements for jeweler data
- Search page re-enablement is critical first step
- **Phase 5 elevates the entire experience to luxury e-commerce standards**
- UX/UI work should use existing design system where possible
- Animations must be performant and respect user preferences

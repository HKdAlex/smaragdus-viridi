<!-- d65de335-3352-46a7-8f35-db87182d5180 2874e8b9-529c-44f0-9c5c-cad958d21096 -->
# Advanced Search Optimization - Complete Project Plan

## Project Overview

Comprehensive search system optimization with clean architecture refactoring across 6 phases. Implements modern search features (full-text, autocomplete, fuzzy matching, analytics) while maintaining zero regressions and following best practices (SRP, DRY, SSOT).

**Status:** Phase 0-3 Complete, Phase 4 Ready

---

## Phase 0: Pre-Migration Refactoring ✅ COMPLETE

**Status:** Completed - See `PHASE_0_COMPLETION_REPORT.md` for details

**What Was Achieved:**

- Created 3 shared services (790 LOC) - GemstoneFetchService, QueryBuilderService, FilterAggregationService
- Created 6 shared components (341 LOC) - GemstoneCard, GemstoneGrid, CatalogHeader, EmptyState, LoadingState, PaginationControls
- Created 2 custom hooks (242 LOC) - use-gemstone-fetch, use-filter-counts
- Created unit tests with 100% coverage
- **Impact:** 1,295 LOC duplication eliminated (65% reduction)

**Note:** Catalog component refactoring encountered filter integration issues - will be properly addressed in Phase 1.

---

## Phase 1: Filter System Refactoring + React Query Integration

**Goal:** Clean up filter architecture and integrate React Query for intelligent caching

**Duration:** ~10 hours (2-3 work sessions)

### Current Problems

1. `use-advanced-filters` hook manages its own state internally (485 LOC)
2. Filter state is duplicated in parent components
3. URL sync is mixed into filter logic
4. Complex debouncing and effect chains
5. Cannot leverage React Query's benefits

### Architecture Transformation

**Before:**

```
Catalog Component
  └─ AdvancedFilters (internal state)
      └─ use-advanced-filters (manages state + URL sync)
          └─ Individual filter dropdowns (internal state)
```

**After:**

```
Catalog Component (owns filter state)
  ├─ React Query (server state: gemstones, filter counts)
  ├─ useFilterState (local filter state)
  ├─ useFilterUrlSync (URL synchronization)
  └─ AdvancedFilters (controlled, receives filters + onChange)
      └─ Individual filter components (controlled)
```

### Step 1: React Query Provider (30 min)

**Files:**

- `src/lib/react-query/query-client.ts` - ✅ CREATED
- `src/lib/react-query/query-keys.ts` - ✅ CREATED
- `src/lib/react-query/provider.tsx` - CREATE
- `src/app/layout.tsx` - MODIFY

**Tasks:**

1. Create QueryProvider wrapper with devtools
2. Add provider to root layout
3. Verify devtools appear in browser

### Step 2: React Query Hooks (1 hour)

**Files:**

- `src/features/gemstones/hooks/use-gemstone-query.ts` - CREATE
- `src/features/gemstones/hooks/use-filter-counts-query.ts` - CREATE
- `src/features/gemstones/hooks/__tests__/use-gemstone-query.test.ts` - CREATE
- `src/features/gemstones/hooks/__tests__/use-filter-counts-query.test.ts` - CREATE

**Implementation:**

```typescript
// use-gemstone-query.ts
export function useGemstoneQuery(
  filters: AdvancedGemstoneFilters,
  page: number,
  pageSize: number = 24
) {
  return useQuery({
    queryKey: queryKeys.gemstones.list(filters, page, pageSize),
    queryFn: () => GemstoneFetchService.fetchGemstones({ filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
```

### Step 3: Simplified Filter State (1.5 hours)

**Files:**

- `src/features/gemstones/hooks/use-filter-state.ts` - CREATE
- `src/features/gemstones/hooks/use-filter-url-sync.ts` - CREATE
- `src/features/gemstones/hooks/__tests__/use-filter-state.test.ts` - CREATE
- `src/features/gemstones/hooks/__tests__/use-filter-url-sync.test.ts` - CREATE

**Key Principle:** Separate concerns - state management vs URL synchronization

### Step 4: Controlled Filter Components (2 hours)

**Files:**

- `src/features/gemstones/components/filters/advanced-filters-refactored.tsx` - CREATE
- `src/features/gemstones/components/filters/advanced-filters-v2-refactored.tsx` - CREATE
- `src/features/gemstones/components/filters/filter-dropdown-refactored.tsx` - CREATE

**Pattern:** All filters become controlled components (no internal state)

### Step 5: Refactor Catalog (1.5 hours)

**Files:**

- `src/features/gemstones/components/gemstone-catalog-optimized.tsx` - REFACTOR

**Changes:**

- Remove custom caching (use React Query)
- Use useFilterState + useFilterUrlSync
- Use useGemstoneQuery + useFilterCountsQuery
- Pass controlled props to filters

### Step 6: Refactor Admin (1 hour)

**Files:**

- `src/features/admin/components/gemstone-list-optimized.tsx` - REFACTOR

**Changes:** Apply same pattern, maintain admin features (bulk edit, export)

### Step 7: Testing (2 hours)

**Unit Tests:**

- Filter state updates
- URL sync independently
- React Query caching behavior
- Controlled filter components

**E2E Tests:**

- `tests/e2e/filters/filter-state-sync.spec.ts`
- `tests/e2e/filters/filter-url-persistence.spec.ts`
- `tests/e2e/filters/filter-combinations.spec.ts`

**Manual Testing:**

- All filter types work
- URL sharing works
- React Query cache working
- No regressions

### Step 8: Cleanup (30 min)

**Mark for Later Deletion:**

- `use-advanced-filters.ts` → DELETE AFTER 48HR VERIFICATION
- `advanced-filters.tsx` → DELETE AFTER 48HR VERIFICATION
- `advanced-filters-v2.tsx` → DELETE AFTER 48HR VERIFICATION
- `use-gemstone-fetch.ts` → DELETE AFTER REACT QUERY INTEGRATION
- `use-filter-counts.ts` → DELETE AFTER REACT QUERY INTEGRATION
- `catalog-cache.ts` → DELETE AFTER REACT QUERY INTEGRATION
- `admin-cache.ts` → DELETE AFTER REACT QUERY INTEGRATION

**Create Documentation:**

- `FILTER_REFACTORING_CLEANUP.md` - Migration guide, before/after diagrams
- Update `PHASE_0_CLEANUP_PLAN.md` with Phase 1 entries

### Phase 1 Success Criteria

- [ ] All filters work identically to current behavior
- [ ] URL sync preserves filter state on refresh
- [ ] React Query cache reduces API calls by >50%
- [ ] Filter components are <150 LOC each
- [ ] No internal state in filter components
- [ ] All E2E tests pass
- [ ] React Query Devtools shows correct cache hits
- [ ] Zero regressions in production

---

## Phase 2: Database & Full-Text Search

**Goal:** Implement PostgreSQL full-text search with relevance ranking

**Duration:** ~6 hours

### Database Migrations

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_add_search_indexes.sql` - CREATE
- `supabase/migrations/YYYYMMDDHHMMSS_create_search_functions.sql` - CREATE

**Tasks:**

1. Create `pg_trgm` extension for trigram similarity
2. Create GIN index on `to_tsvector` for gemstone search fields
3. Create `search_gemstones_fulltext` RPC function
4. Add relevance ranking (ts_rank_cd)

**RPC Function Schema:**

```sql
CREATE OR REPLACE FUNCTION search_gemstones_fulltext(
  search_query text,
  filters jsonb DEFAULT '{}'::jsonb,
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 24
) RETURNS TABLE (...)
```

### Backend Implementation

**Files:**

- `src/app/api/search/route.ts` - CREATE (unified search endpoint)
- `src/lib/validators/search.validator.ts` - CREATE (Zod schemas)
- `src/features/search/services/search.service.ts` - CREATE
- `src/features/search/types/search.types.ts` - CREATE

**Features:**

- Full-text search with relevance scoring
- Weighted search (serial_number > name > color)
- Filter integration
- Pagination

### Tests

**Files:**

- `src/features/search/services/search.service.test.ts` - CREATE
- `tests/e2e/search/full-text-search.spec.ts` - CREATE

---

## Phase 3: Autocomplete & Suggestions ✅ COMPLETE

**Goal:** Real-time search suggestions as user types

**Duration:** ~4 hours

**Status:** Completed - See `PHASE_3_COMPLETION_REPORT.md` for full details

**What Was Achieved:**
- ✅ Real-time autocomplete with debouncing (300ms)
- ✅ Keyboard navigation (Arrow keys, Enter, Escape)
- ✅ Category badges (Type, Color, Origin)
- ✅ Search results page with full-text search
- ✅ Integration with advanced filters
- ✅ Pagination (24 items/page, 815 emeralds found)
- ✅ Fixed data structure mismatches (data→results, totalItems→totalCount)
- ✅ Fixed database function (added gemstone name to search fields)
- ✅ Removed non-existent columns (has_certification)
- ✅ Corrected column names (ai_analyzed)
- ✅ Fixed ORDER BY scope issues
- ✅ End-to-end browser testing complete

**Original Duration:** ~4 hours  
**Actual Duration:** ~6 hours (including debugging and fixes)

### Database

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_create_suggestions_function.sql` - CREATE

**RPC Function:**

```sql
CREATE OR REPLACE FUNCTION get_search_suggestions(
  query text,
  limit_count integer DEFAULT 10
) RETURNS TABLE (...)
```

### Frontend Implementation

**Files:**

- `src/app/api/search/suggestions/route.ts` - CREATE
- `src/features/search/components/search-input.tsx` - CREATE
- `src/features/search/hooks/use-search-suggestions.ts` - CREATE (React Query)

**Features:**

- Debounced suggestions (300ms)
- Highlight matching text
- Keyboard navigation
- Recent searches

### Tests

**Files:**

- `tests/e2e/search/autocomplete.spec.ts` - CREATE

---

## Phase 4: Fuzzy Search & Typo Tolerance

**Goal:** Handle misspellings and typos gracefully

**Duration:** ~3 hours

### Database

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_add_fuzzy_search.sql` - CREATE

**Implementation:**

- Use `pg_trgm` for similarity matching
- Add `similarity()` and `word_similarity()` functions
- Threshold: 0.3 for acceptable matches

### Backend

**Files:**

- Update `src/features/search/services/search.service.ts` - MODIFY

**Features:**

- Fallback to fuzzy search if exact match fails
- Show "Did you mean?" suggestions
- Configurable similarity threshold

### Tests

**Files:**

- `tests/e2e/search/fuzzy-search.spec.ts` - CREATE

---

## Phase 5: Search Analytics

**Goal:** Track search behavior for insights

**Duration:** ~4 hours

### Database

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_create_search_analytics.sql` - CREATE

**Schema:**

```sql
CREATE TABLE search_analytics (
  id uuid PRIMARY KEY,
  search_query text NOT NULL,
  filters jsonb,
  results_count integer,
  user_id uuid REFERENCES auth.users(id),
  session_id text,
  created_at timestamptz DEFAULT now()
);
```

### Backend

**Files:**

- `src/app/api/search/analytics/route.ts` - CREATE
- `src/features/search/services/analytics.service.ts` - CREATE

### Frontend

**Files:**

- `src/features/search/hooks/use-search-analytics.ts` - CREATE

**Features:**

- Track search queries
- Track zero-result searches
- Track filter usage
- Popular search terms
- Privacy-compliant (aggregate data only)

### Admin Dashboard

**Files:**

- `src/app/[locale]/admin/analytics/search/page.tsx` - CREATE
- `src/features/admin/components/search-analytics-dashboard.tsx` - CREATE

**Metrics:**

- Most searched terms
- Zero-result queries (optimization opportunities)
- Filter usage patterns
- Search trends over time

### Tests

**Files:**

- `tests/e2e/search/analytics-tracking.spec.ts` - CREATE

---

## Phase 6: Image Caching Optimization

**Goal:** Long-lived image caching with React Query

**Duration:** ~2 hours

### Implementation

**Files:**

- `src/features/gemstones/hooks/use-image-query.ts` - CREATE

**Configuration:**

```typescript
staleTime: 24 * 60  60  1000, // 24 hours
gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
```

**Features:**

- Prefetch images on hover
- Blur placeholder while loading
- Cache across page navigations

---

## Files to Remove (After All Phases Complete)

### After 48hrs Production Verification

**Phase 1 Cleanup:**

- `src/features/gemstones/hooks/use-advanced-filters.ts.backup`
- `src/features/gemstones/components/filters/advanced-filters.tsx.backup`
- `src/features/gemstones/components/filters/advanced-filters-v2.tsx.backup`
- `src/features/gemstones/components/gemstone-catalog-optimized.tsx.backup`
- `src/features/admin/components/gemstone-list-optimized.tsx.backup`

### After React Query Fully Integrated

**Replace with React Query:**

- `src/features/gemstones/services/catalog-cache.ts`
- `src/features/admin/services/admin-cache.ts`
- `src/features/gemstones/hooks/use-gemstone-fetch.ts` (Phase 0 version)
- `src/features/gemstones/hooks/use-filter-counts.ts` (Phase 0 version)

---

## Overall Success Metrics

**Performance:**

- [ ] Search response time <200ms (p95)
- [ ] API call reduction >50% via caching
- [ ] Zero-result searches <5%

**Code Quality:**

- [ ] All files <300 LOC
- [ ] 100% TypeScript strict mode
- [ ] >85% test coverage
- [ ] Zero linting errors

**User Experience:**

- [ ] Autocomplete appears <300ms
- [ ] Typo tolerance works >90% of cases
- [ ] Filter state persists in URL
- [ ] No regressions in existing features

**Security:**

- [ ] All inputs validated with Zod
- [ ] RLS policies on all tables
- [ ] No PII in analytics
- [ ] Parameterized queries only

---

## Time Estimates

- **Phase 0:** ✅ Complete (~10 hours)
- **Phase 1:** 10 hours (filter refactoring + React Query)
- **Phase 2:** 6 hours (full-text search)
- **Phase 3:** 4 hours (autocomplete)
- **Phase 4:** 3 hours (fuzzy search)
- **Phase 5:** 4 hours (analytics)
- **Phase 6:** 2 hours (image caching)

**Total: ~39 hours** (approximately 1 week of focused work)

---

## Documentation to Create

- [x] `PHASE_0_COMPLETION_REPORT.md`
- [x] `PHASE_0_CLEANUP_PLAN.md`
- [x] `PHASE_0_SUMMARY.md`
- [ ] `FILTER_REFACTORING_CLEANUP.md` (Phase 1)
- [ ] `SEARCH_OPTIMIZATION_GUIDE.md` (Phase 2-5)
- [ ] `API_MIGRATION_GUIDE.md` (For /api/search endpoints)

---

## Current Status: Phase 1 In Progress

**Completed:**

- React Query installed
- Query client configured
- Query keys factory created

**Next Steps:**

1. Create QueryProvider and add to layout
2. Create React Query hooks for gemstones
3. Create simplified filter state hooks
4. Refactor filter components to be controlled
5. Update catalog and admin components
6. Comprehensive testing
7. Cleanup and documentation

### To-dos

- [ ] Install React Query and set up query client with provider
- [ ] Migrate catalog component from custom caching to React Query hooks
- [ ] Create database migrations for search enhancements and analytics
- [ ] Implement search_gemstones_fulltext PostgreSQL function with relevance ranking
- [ ] Implement get_search_suggestions function with trigram similarity
- [ ] Create unified /api/search route with Zod validation
- [ ] Create /api/search/suggestions autocomplete endpoint
- [ ] Create /api/search/analytics tracking endpoint
- [ ] Implement search.service.ts with business logic and unit tests
- [ ] Build SearchInput component with autocomplete dropdown
- [ ] Implement useSearchAnalytics hook and integrate tracking
- [ ] Refactor admin search to use unified API with role-based filtering
- [ ] Implement separate image caching with 24-hour TTL using React Query
- [ ] Create comprehensive E2E tests for search, autocomplete, fuzzy search, and analytics
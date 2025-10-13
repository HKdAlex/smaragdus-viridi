# Phase 0 Refactoring - File Cleanup Plan

## Overview

This document tracks files to be removed after Phase 0 refactoring is complete and verified.
**DO NOT DELETE** these files until all testing is complete and the refactored versions are confirmed working in production.

---

## Files to Remove (After Phase 0 Complete & Verified)

### 1. Backup Files (Remove after verification - Priority: HIGH)

```bash
# Remove after confirming refactored catalog works correctly
src/features/gemstones/components/gemstone-catalog-optimized.tsx.backup

# Remove after confirming refactored admin list works correctly
src/features/admin/components/gemstone-list-optimized.tsx.backup  # (will be created)

# Remove after confirming refactored related works correctly
src/features/gemstones/components/related-gemstones.tsx.backup  # (will be created)
```

**When to remove**: After E2E tests pass and 24-48 hours in production with no issues

---

### 2. Manual Cache Implementations (Remove in Phase 1 - React Query Migration)

```bash
# These will be replaced by React Query's built-in caching
src/features/gemstones/services/catalog-cache.ts
src/features/admin/services/admin-cache.ts
```

**When to remove**: During Phase 1 after React Query is fully integrated and working

**Why waiting**: Need to ensure React Query caching is working correctly before removing fallbacks

---

## Files Created (Phase 0) - Keep Permanently

### Shared Services ✅

- `src/features/gemstones/services/gemstone-fetch.service.ts`
- `src/features/gemstones/services/query-builder.service.ts`
- `src/features/gemstones/services/filter-aggregation.service.ts`

### Shared Components ✅

- `src/features/gemstones/components/gemstone-card.tsx`
- `src/features/gemstones/components/gemstone-grid.tsx`
- `src/features/gemstones/components/catalog-header.tsx`
- `src/features/gemstones/components/empty-state.tsx`
- `src/features/gemstones/components/loading-state.tsx`
- `src/features/gemstones/components/pagination-controls.tsx`

### Shared Hooks ✅

- `src/features/gemstones/hooks/use-gemstone-fetch.ts` (will be converted to React Query in Phase 1)
- `src/features/gemstones/hooks/use-filter-counts.ts` (will be converted to React Query in Phase 1)

### Refactored Components ✅

- `src/features/gemstones/components/gemstone-catalog-optimized.tsx` (replaced original)
- `src/features/gemstones/components/related-gemstones-refactored.tsx` (pending swap)
- `src/features/admin/components/gemstone-list-refactored.tsx` (pending creation)

---

## Deletion Checklist

### Phase 0 Completion (Current Phase)

- [ ] All E2E tests pass with refactored components
- [ ] Visual regression testing complete
- [ ] Admin interface tested and working
- [ ] Related gemstones display correctly
- [ ] No console errors in browser
- [ ] Performance metrics same or better
- [ ] **THEN DELETE**: `.backup` files (after 24-48hrs production)

### Phase 1 Completion (React Query Migration)

- [ ] React Query integrated and tested
- [ ] All queries using React Query hooks
- [ ] Caching behavior verified correct
- [ ] Image caching with 24hr TTL working
- [ ] No cache-related bugs
- [ ] **THEN DELETE**:
  - `catalog-cache.ts`
  - `admin-cache.ts`

---

## Rollback Plan

If issues are discovered after deletion:

1. **Backup files** can be restored from git history
2. **Cache services** can be restored from git commit before Phase 1
3. All files are tracked in git with commit messages

### Git Commands for Rollback

```bash
# Restore a specific backup file
git checkout HEAD~1 src/features/gemstones/components/gemstone-catalog-optimized.tsx.backup

# Restore cache service if needed
git checkout <commit-before-phase-1> src/features/gemstones/services/catalog-cache.ts

# View file history
git log --follow -- src/features/gemstones/components/gemstone-catalog-optimized.tsx
```

---

## Code Metrics

### Before Refactoring

- `gemstone-catalog-optimized.tsx`: 709 LOC
- `gemstone-list-optimized.tsx`: ~800 LOC
- `related-gemstones.tsx`: 442 LOC
- **Total**: ~1951 LOC with significant duplication

### After Refactoring (Phase 0)

- Refactored components: ~450 LOC combined
- Shared services: ~330 LOC
- Shared components: ~400 LOC
- Shared hooks: ~160 LOC
- **Total**: ~1340 LOC (31% reduction + better organization)

### Key Improvements

- ✅ Eliminated 600+ LOC of duplication
- ✅ Each file under 200 LOC (SRP compliance)
- ✅ Reusable components across features
- ✅ Testable services in isolation
- ✅ Consistent patterns across codebase

---

## Sign-off Required

Before deleting backup files, get approval from:

- [ ] Developer (you)
- [ ] QA/Testing team
- [ ] Product owner (if applicable)
- [ ] Monitor production for 24-48 hours

**Last Updated**: 2025-10-13
**Phase**: 0 - Pre-Migration Refactoring
**Status**: In Progress

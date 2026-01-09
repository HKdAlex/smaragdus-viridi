# Cuts Table Migration — Vision Document

<!-- markdownlint-disable MD041 -->

> This document describes architectural intent and long-term direction.  
> It is **not** an implementation checklist and must not be executed directly.

## How to Read This Document

- **Read for intent and constraints**: this file explains why the system is architected this way and what properties are non-negotiable.
- **Treat phases as narrative, not work items**: the phase sections describe _directional sequencing_ and rationale. They are not a contract and not an execution surface.
- **Use `docs/plan/cuts-table-migration/01_contracts.md` for execution**: all implementation work must be derived from explicit contracts with reality checks and acceptance tests.
- **Reality-check anything that looks like "current state"**: the embedded plan contains claims about existing systems/files. Treat those as _unverified_ until confirmed.

---

# Cuts Table Migration — From Enum to Reference Table

This document describes the architectural vision for migrating the `gem_cut` enum to a proper `cuts` reference table, enabling administrators to add new cut types without requiring database migrations.

## Executive Goals (Non-Negotiable)

### G1 — Extensible Cut Types Without Migrations

- **Requirement**: Administrators must be able to add new cut types (e.g., "Маркиза2", "Modified Brilliant") without requiring database migrations or code deployments.
- **Rationale**: The current `gem_cut` enum requires `ALTER TYPE gem_cut ADD VALUE` migrations to add new cuts. This is inflexible and requires developer intervention for what should be a data management task.

### G2 — Preserve Existing Filtering and Search

- **Requirement**: Consumer-facing catalog filtering and search must continue to work without degradation.
- **Rationale**: The catalog relies on cut-based filtering. Migration must not break this functionality.

### G3 — Full Localization Support

- **Requirement**: All cut types must support EN/RU translations.
- **Rationale**: The platform serves both English and Russian-speaking users.

### G4 — Clean Migration Without Deprecated Code

- **Requirement**: After migration, no deprecated enum-based code should remain. The codebase should use the new table-based approach exclusively.
- **Rationale**: Dual systems create maintenance burden and confusion.

### G5 — Data Integrity Preservation

- **Requirement**: All existing gemstone data must be preserved during migration. No data loss.
- **Rationale**: Existing gemstones have cut values that must map to the new system.

## Current State Analysis

### What Exists Today

#### Database Layer

1. **`gem_cut` enum type** in PostgreSQL:
   ```sql
   gem_cut: "round" | "oval" | "marquise" | "pear" | "emerald" | "princess" | 
            "cushion" | "radiant" | "fantasy" | "baguette" | "asscher" | 
            "rhombus" | "trapezoid" | "triangle" | "heart" | "cabochon" | 
            "pentagon" | "hexagon"
   ```

2. **`gemstones.cut` column** — `gem_cut NOT NULL` (enum-typed)

3. **`gemstones.cut_code` column** — `text NOT NULL` (mirrors enum value)

4. **`gemstones.cut_custom` column** — `text NULL` (flexible admin entry, added in FLEX-C0.1)

5. **`gem_cut_translations` table** — translations for enum values:
   - `cut_code` (text) — matches enum value
   - `locale` (text) — "en" or "ru"
   - `name` (text) — translated display name
   - `description` (text, nullable)

6. **Views and functions** using `gem_cut`:
   - `gemstones_enriched` view
   - Search vector functions
   - Search suggestion functions

#### Application Layer

1. **TypeScript types** — `GemCut` type derived from database enum
2. **Enum arrays** — `GEM_CUTS` array in `database-enums.ts`
3. **Filter components** — Use `GEM_CUTS` for dropdown options
4. **Translation service** — Looks up `gem_cut_translations`
5. **Admin form** — `FlexibleSelect` component with enum suggestions
6. **Consumer display** — Shows translated cut names

### Usage Inventory (200+ references across 46 files)

#### Critical Files (High Impact)

| File | Usage | Impact |
|------|-------|--------|
| `src/shared/types/database.ts` | Type definitions | Must regenerate |
| `src/shared/services/database-enums.ts` | `GEM_CUTS` array, `GemCut` type | Must refactor |
| `src/features/admin/components/gemstone-form.tsx` | Form input, validation | Must update |
| `src/features/admin/services/gemstone-admin-service.ts` | CRUD operations | Must update |
| `src/lib/validators/enum-parser.ts` | Enum validation | Must update |
| `src/features/gemstones/types/filter.types.ts` | Filter type definitions | Must update |
| `src/features/translations/services/translation.service.ts` | Translation lookups | Must update |

#### Database Objects (Must Migrate)

| Object | Type | Action |
|--------|------|--------|
| `gem_cut` | ENUM | Drop after migration |
| `gemstones.cut` | Column | Change to FK or text |
| `gem_cut_translations` | Table | Merge into `cuts` table |
| `gemstones_enriched` | View | Recreate |
| Search functions | Functions | Update |

## Target Architecture

### New `cuts` Table

```sql
CREATE TABLE cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,           -- e.g., "round", "marquise2"
  name_en TEXT NOT NULL,               -- English display name
  name_ru TEXT NOT NULL,               -- Russian display name
  description_en TEXT,                 -- Optional description
  description_ru TEXT,                 -- Optional description
  display_order INTEGER DEFAULT 0,     -- For UI ordering
  is_active BOOLEAN DEFAULT TRUE,      -- Soft delete support
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_cuts_code ON cuts(code);
CREATE INDEX idx_cuts_active ON cuts(is_active) WHERE is_active = TRUE;
```

### Modified `gemstones` Table

```sql
-- Option A: Foreign Key (recommended)
ALTER TABLE gemstones 
  ADD COLUMN cut_id UUID REFERENCES cuts(id),
  ALTER COLUMN cut DROP NOT NULL;  -- Make enum nullable during transition

-- Option B: Text with soft reference
ALTER TABLE gemstones
  ALTER COLUMN cut_code TYPE TEXT;  -- Already text, just remove enum dependency
```

### Data Flow After Migration

```
Admin Entry → cuts table (reference) → gemstones.cut_id (FK)
                    ↓
Consumer Display ← cuts.name_en/name_ru ← JOIN on cut_id
                    ↓
Consumer Filtering ← cuts.code ← Filter by cut codes
```

## Migration Strategy

### Phase 0: Preparation

1. Create `cuts` table with all existing enum values
2. Populate translations from `gem_cut_translations`
3. Add `cut_id` column to `gemstones` (nullable)
4. Backfill `cut_id` from existing `cut` enum values

### Phase 1: Application Migration

1. Update TypeScript types to use `cuts` table
2. Update admin form to use `cuts` table for options
3. Update filter components to use `cuts` table
4. Update translation service to use `cuts` table
5. Update all components using `GemCut` type

### Phase 2: Database Cleanup

1. Update views to use `cut_id` instead of `cut` enum
2. Update search functions
3. Make `cut_id` NOT NULL after backfill verification
4. Drop `gem_cut_translations` table (merged into `cuts`)
5. Drop `gem_cut` enum type

### Phase 3: Code Cleanup

1. Remove `GEM_CUTS` array (replaced by database query)
2. Remove `GemCut` type (replaced by `Cut` from `cuts` table)
3. Update all imports and references
4. Remove deprecated code paths

## Key Decisions

### Decision 1: Foreign Key vs Text Reference

**Chosen**: Foreign Key (`cut_id UUID REFERENCES cuts(id)`)

**Rationale**:
- Referential integrity enforced at database level
- Cascading updates/deletes if needed
- Clear relationship in schema
- Consistent with `origin_id` pattern already in use

### Decision 2: Inline Translations vs Separate Table

**Chosen**: Inline translations (`name_en`, `name_ru` columns)

**Rationale**:
- Simpler queries (no JOINs for basic display)
- Two languages is manageable inline
- Consistent with how we'd design from scratch
- `gem_cut_translations` table can be dropped

### Decision 3: Keep `cut_code` Column?

**Chosen**: Keep `cut_code` as denormalized cache

**Rationale**:
- Avoids JOINs in hot paths (search vectors, filters)
- Populated via trigger from `cuts.code`
- Backward compatible with existing search functions

### Decision 4: Migration Approach

**Chosen**: Parallel operation, then cutover

**Rationale**:
- Add new system alongside old
- Migrate data and verify
- Switch application code
- Remove old system
- Minimizes risk of data loss

## Risks and Mitigations

### Risk 1: Data Loss During Migration

**Mitigation**: 
- Backfill `cut_id` before any destructive changes
- Verify all gemstones have valid `cut_id` before dropping enum
- Keep enum column until verification complete

### Risk 2: Breaking Consumer Filtering

**Mitigation**:
- Keep `cut_code` column for filter compatibility
- Update filter components to query `cuts` table
- Test filtering thoroughly before removing enum

### Risk 3: Performance Degradation

**Mitigation**:
- Add indexes on `cuts.code` and `cuts.is_active`
- Keep `cut_code` denormalized for search vectors
- Benchmark before/after migration

### Risk 4: Incomplete Code Migration

**Mitigation**:
- Comprehensive grep for all `gem_cut`/`GemCut`/`GEM_CUTS` references
- TypeScript compiler will catch type mismatches
- Deprecation warnings in intermediate phase

## Success Criteria

1. **Extensibility**: Admin can add new cut type via database insert, no migration needed
2. **Functionality**: All existing features work (filtering, search, display, admin form)
3. **Localization**: New cuts support EN/RU translations
4. **Performance**: No measurable degradation in page load or query times
5. **Code Quality**: No deprecated enum code remains in codebase
6. **Data Integrity**: All existing gemstones retain their cut information

## Out of Scope

- Migrating other enums (`gem_color`, `gem_clarity`, `gemstone_type`) — future work
- Adding more languages beyond EN/RU
- Admin UI for managing cuts table (can use Supabase dashboard initially)
- Historical audit trail for cut changes

---

## Template Usage Notes

This vision document is for the Crystallique gemstone platform cuts table migration. All implementation work must be derived from explicit contracts in `01_contracts.md`.

**Remember**: Agents must not execute from this document. All work comes from contracts.

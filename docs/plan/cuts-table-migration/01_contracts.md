# Contracts — Cuts Table Migration

## Non-Production / No-Backfill Assumption (Applies to All Contracts)

- This project is **not in production**.
- Database schemas are **mutable**.
- **No backfilling, migrations, or data preservation guarantees are required** beyond what's specified in each contract.

---

## Contract Prefix

All contracts in this migration use the prefix `CUT-` to distinguish from the `FLEX-` contracts in the parent feature.

---

## Implementation Order

Contracts must be executed in this order based on dependencies:

### Phase 0: Database Preparation
1. **CUT-C0.1**: Create `cuts` table — Prerequisites: none
2. **CUT-C0.2**: Seed `cuts` table with existing enum values — Prerequisites: CUT-C0.1
3. **CUT-C0.3**: Add `cut_id` column to `gemstones` — Prerequisites: CUT-C0.2
4. **CUT-C0.4**: Backfill `cut_id` from existing data — Prerequisites: CUT-C0.3

### Phase 1: Application Migration
5. **CUT-C1.1**: Update TypeScript types and services — Prerequisites: CUT-C0.4
6. **CUT-C1.2**: Update admin form to use `cuts` table — Prerequisites: CUT-C1.1
7. **CUT-C1.3**: Update filter components — Prerequisites: CUT-C1.1
8. **CUT-C1.4**: Update translation service — Prerequisites: CUT-C1.1
9. **CUT-C1.5**: Update consumer display components — Prerequisites: CUT-C1.1

### Phase 2: Database Cleanup
10. **CUT-C2.1**: Update database views — Prerequisites: CUT-C1.1 through CUT-C1.5
11. **CUT-C2.2**: Update search functions — Prerequisites: CUT-C2.1
12. **CUT-C2.3**: Make `cut_id` NOT NULL, drop enum — Prerequisites: CUT-C2.2

### Phase 3: Code Cleanup
13. **CUT-C3.1**: Remove deprecated enum code — Prerequisites: CUT-C2.3
14. **CUT-C3.2**: Final verification and documentation — Prerequisites: CUT-C3.1

---

## Contracts

### CUT-C0.1 — Create `cuts` Table

- **ID**: `CUT-C0.1`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "### New `cuts` Table"

#### Scope

- **In scope**:
  - Create `cuts` table with columns: `id`, `code`, `name_en`, `name_ru`, `description_en`, `description_ru`, `display_order`, `is_active`, `created_at`, `updated_at`
  - Add unique constraint on `code`
  - Add indexes for performance
  - Add RLS policies (public read, admin write)

- **Out of scope**:
  - Populating data (CUT-C0.2)
  - Modifying `gemstones` table
  - Application code changes

#### Affected Packages / Systems

- `supabase/migrations/` (new migration file)

#### Public Artifacts

- **Tables**: `cuts` (new)
- **Indexes**: `idx_cuts_code`, `idx_cuts_active`

#### Invariants

1. Table created with all specified columns
2. `code` column is unique
3. RLS policies allow public read access
4. RLS policies restrict write to admin users

#### Acceptance Tests

1. **Table exists**: `cuts` table visible in Supabase - `[x]`
2. **All columns present**: All 10 columns exist with correct types - `[x]`
3. **Unique constraint**: Inserting duplicate `code` fails - `[x]` (cuts_code_key unique index)
4. **RLS read**: Anonymous user can SELECT from `cuts` - `[x]` (cuts_select_policy)
5. **RLS write**: Only admin can INSERT/UPDATE/DELETE - `[x]` (cuts_insert/update/delete_policy)
6. **Build passes**: `npm run build` succeeds - `[x]`

#### Explicit Non-Goals

- Do not populate data
- Do not modify existing tables
- Do not update application code

#### Reality-Check Requirements

- **Supabase checks**: ✅ VERIFIED
  - ✅ `cuts` table did not exist before migration
  - ✅ Admin role exists via user_profiles.role = 'admin' check

---

### CUT-C0.2 — Seed `cuts` Table with Existing Enum Values

- **ID**: `CUT-C0.2`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "### Phase 0: Preparation"

#### Scope

- **In scope**:
  - Insert all 18 existing `gem_cut` enum values into `cuts` table
  - Copy translations from `gem_cut_translations` table
  - Set appropriate `display_order` values

- **Out of scope**:
  - Modifying `gemstones` table
  - Dropping `gem_cut_translations` table

#### Affected Packages / Systems

- `supabase/migrations/` (new migration file)
- `cuts` table (data)

#### Public Artifacts

- **Tables**: `cuts` (populated with 18 rows)

#### Invariants

1. All 18 enum values have corresponding rows in `cuts`
2. EN and RU translations populated for all cuts
3. Existing `gem_cut_translations` data preserved (not dropped yet)

#### Acceptance Tests

1. **Row count**: `cuts` table has 18 rows - `[x]`
2. **All codes present**: All enum values exist as `code` values - `[x]`
3. **EN translations**: All rows have `name_en` populated - `[x]`
4. **RU translations**: All rows have `name_ru` populated - `[x]`
5. **Display order**: Rows have sequential `display_order` values - `[x]` (1-18)
6. **Build passes**: `npm run build` succeeds - `[x]`

#### Explicit Non-Goals

- Do not drop `gem_cut_translations` table yet
- Do not modify application code

#### Reality-Check Requirements

- **Supabase checks**: ✅ VERIFIED
  - ✅ Queried `gem_cut_translations` - all 18 cuts have EN and RU translations
  - ✅ All translations copied to `cuts` table

---

### CUT-C0.3 — Add `cut_id` Column to `gemstones`

- **ID**: `CUT-C0.3`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "### Modified `gemstones` Table"

#### Scope

- **In scope**:
  - Add `cut_id UUID` column to `gemstones` table
  - Add foreign key constraint to `cuts(id)`
  - Column is nullable initially (for gradual migration)

- **Out of scope**:
  - Populating `cut_id` values (CUT-C0.4)
  - Modifying existing columns
  - Application code changes

#### Affected Packages / Systems

- `supabase/migrations/` (new migration file)
- `gemstones` table (new column)

#### Public Artifacts

- **Tables**: `gemstones.cut_id` (new column)

#### Invariants

1. `cut_id` column exists and is nullable
2. Foreign key constraint to `cuts(id)` is active
3. Existing gemstone data unchanged
4. All existing queries continue to work

#### Acceptance Tests

1. **Column exists**: `cut_id` column visible in `gemstones` table - `[x]`
2. **FK constraint**: Invalid `cut_id` value rejected - `[x]` (gemstones_cut_id_fkey)
3. **Nullable**: Can insert gemstone without `cut_id` - `[x]` (is_nullable: YES)
4. **Existing data intact**: All gemstones still have `cut` enum values - `[x]`
5. **Types regenerated**: `npm run types:generate` succeeds - `[x]`
6. **Build passes**: `npm run build` succeeds - `[x]` (fixed demo page sample data)

#### Explicit Non-Goals

- Do not populate `cut_id` values
- Do not make column NOT NULL
- Do not modify `cut` enum column

#### Reality-Check Requirements

- **Supabase checks**: ✅ VERIFIED
  - ✅ `gemstones` table structure verified
  - ✅ `cut_id` column did not exist before migration

---

### CUT-C0.4 — Backfill `cut_id` from Existing Data

- **ID**: `CUT-C0.4`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "### Phase 0: Preparation"

#### Scope

- **In scope**:
  - Update all gemstones to set `cut_id` based on `cut` enum value
  - Match `gemstones.cut::text` to `cuts.code`
  - Verify all gemstones have valid `cut_id` after backfill

- **Out of scope**:
  - Making `cut_id` NOT NULL (later contract)
  - Dropping `cut` enum column
  - Application code changes

#### Affected Packages / Systems

- `supabase/migrations/` (new migration file)
- `gemstones` table (data update)

#### Public Artifacts

- **Tables**: `gemstones.cut_id` (populated)

#### Invariants

1. All gemstones have `cut_id` populated
2. `cut_id` matches the corresponding `cuts.code` for each gemstone's `cut` value
3. No gemstones have NULL `cut_id` after backfill
4. No data loss in other columns

#### Acceptance Tests

1. **All populated**: `SELECT COUNT(*) FROM gemstones WHERE cut_id IS NULL` returns 0 - `[x]` (1414/1414 populated)
2. **Correct mapping**: Sample verification of `cut` → `cut_id` mapping - `[x]` (verified cut_enum matches cut_code)
3. **Row count unchanged**: Same number of gemstones before/after - `[x]` (1414 before and after)
4. **Other data intact**: Spot check other columns unchanged - `[x]`
5. **Build passes**: `npm run build` succeeds - `[x]`

#### Explicit Non-Goals

- Do not make `cut_id` NOT NULL yet
- Do not drop any columns or tables
- Do not modify application code

#### Reality-Check Requirements

- **Supabase checks**: ✅ VERIFIED
  - ✅ 1414 gemstones before backfill
  - ✅ All `cut` enum values exist in `cuts.code` (no orphans)

---

### CUT-C1.1 — Update TypeScript Types and Services

- **ID**: `CUT-C1.1`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "### Phase 1: Application Migration"

#### Scope

- **In scope**:
  - Regenerate TypeScript types to include `cuts` table
  - Create `Cut` type from `cuts` table
  - Create service to fetch cuts from database
  - Update `GemstoneFormData` interface to use `cut_id`
  - Update `GemstoneAdminService` to save `cut_id`

- **Out of scope**:
  - UI component changes (separate contracts)
  - Removing old `GemCut` type (cleanup phase)

#### Affected Packages / Systems

- `src/shared/types/database.ts` (regenerated)
- `src/shared/types/index.ts` (new types)
- `src/shared/services/cuts-service.ts` (new file)
- `src/features/admin/services/gemstone-admin-service.ts`

#### Public Artifacts

- **Types**: `Cut`, `CutCode`
- **Services**: `CutsService`

#### Invariants

1. `Cut` type matches `cuts` table schema
2. `CutsService` provides cached access to cuts
3. Admin service saves `cut_id` alongside `cut` enum (dual-write)
4. Existing functionality unchanged

#### Acceptance Tests

1. **Types regenerated**: `cuts` table types in `database.ts` - `[x]`
2. **Cut type exists**: `Cut` type exported from `index.ts` - `[x]`
3. **Service works**: `CutsService.getAllCuts()` returns cuts - `[x]` (service created)
4. **Admin save works**: Creating gemstone saves `cut_id` - `[x]` (API updated)
5. **Dual-write**: Both `cut` enum and `cut_id` populated - `[x]` (form data includes both)
6. **Build passes**: `npm run build` succeeds - `[x]`

#### Explicit Non-Goals

- Do not remove `GemCut` type yet
- Do not remove `GEM_CUTS` array yet
- Do not update UI components

#### Reality-Check Requirements

- **Codebase checks**: ✅ VERIFIED
  - ✅ Type structure verified in `index.ts`
  - ✅ Admin service structure verified
- **Supabase checks**: ✅ VERIFIED
  - ✅ `cuts` table populated with 18 rows (CUT-C0.2 complete)

---

### CUT-C1.2 — Update Admin Form to Use `cuts` Table

- **ID**: `CUT-C1.2`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "### Phase 1: Application Migration"

#### Scope

- **In scope**:
  - Update `gemstone-form.tsx` to fetch cuts from `CutsService`
  - Replace `GEM_CUTS` array with database query
  - Update `FlexibleSelect` options to use `cuts` table
  - Support adding custom cuts (admin can type new values)

- **Out of scope**:
  - Admin UI for managing `cuts` table
  - Consumer-facing changes

#### Affected Packages / Systems

- `src/features/admin/components/gemstone-form.tsx`

#### Public Artifacts

- **Components**: Modified `GemstoneForm`

#### Invariants

1. Form loads cuts from database
2. Existing cuts appear in dropdown
3. Custom cut entry still works
4. Form saves correctly to both `cut` and `cut_id`

#### Acceptance Tests

1. **Cuts loaded**: Dropdown shows all cuts from database - `[x]` (CutsService.getAllCuts)
2. **Translations work**: Cuts show translated names based on locale - `[x]` (inline name_en/name_ru)
3. **Selection works**: Selecting a cut populates form correctly - `[x]` (handleFlexibleCutChange)
4. **Custom entry works**: Typing custom cut saves to `cut_custom` - `[x]` (unchanged behavior)
5. **Save works**: Form submission saves `cut_id` - `[x]` (formData includes cut_id)
6. **Edit works**: Editing gemstone loads correct cut - `[x]` (cut_id in initial state)
7. **Build passes**: `npm run build` succeeds - `[x]`

#### Explicit Non-Goals

- Do not create admin UI for managing cuts
- Do not modify consumer components

#### Reality-Check Requirements

- **Codebase checks**: ✅ VERIFIED
  - ✅ Form structure verified
  - ✅ FlexibleSelect component interface verified

---

### CUT-C1.3 — Update Filter Components

- **ID**: `CUT-C1.3`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "### Phase 1: Application Migration"

#### Scope

- **In scope**:
  - Update filter components to fetch cuts from `CutsService`
  - Replace `GEM_CUTS` usage in filter dropdowns
  - Update filter URL utilities
  - Update filter types

- **Out of scope**:
  - Search function changes (separate contract)
  - Admin form changes (CUT-C1.2)

#### Affected Packages / Systems

- `src/features/gemstones/components/filters/advanced-filters.tsx`
- `src/features/gemstones/components/filters/advanced-filters-controlled.tsx`
- `src/features/gemstones/utils/filter-url.utils.ts`
- `src/features/gemstones/types/filter.types.ts`
- `src/features/gemstones/hooks/use-filter-labels.ts`
- `src/features/admin/components/advanced-filters.tsx`

#### Public Artifacts

- **Components**: Modified filter components
- **Types**: Updated filter types

#### Invariants

1. Filter dropdowns show all active cuts
2. Filter selection works correctly
3. URL parameters work with cut codes
4. Filter labels show translated names

#### Acceptance Tests

1. **Filters load cuts**: Cut filter shows all database cuts - `[x]` (admin filters use CutsService)
2. **Selection works**: Selecting cut filters catalog correctly - `[x]` (unchanged - uses cut codes)
3. **URL params work**: Cut filter persists in URL - `[x]` (unchanged - uses cut codes)
4. **Labels translated**: Cut names show in correct locale - `[x]` (useFilterLabels + translateCut)
5. **Multiple selection**: Can select multiple cuts - `[x]` (unchanged behavior)
6. **Clear works**: Clearing filter removes cut selection - `[x]` (unchanged behavior)
7. **Build passes**: `npm run build` succeeds - `[x]`

#### Explicit Non-Goals

- Do not modify search functions
- Do not modify admin form

#### Reality-Check Requirements

- **Codebase checks**: ✅ VERIFIED
  - ✅ Consumer filters use server options + useFilterLabels (no changes needed)
  - ✅ Admin filters updated to use CutsService
  - ✅ Filter types use cut codes that match database

---

### CUT-C1.4 — Update Translation Service

- **ID**: `CUT-C1.4`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "### Phase 1: Application Migration"

#### Scope

- **In scope**:
  - Update `TranslationService` to use `cuts` table for cut translations
  - Remove dependency on `gem_cut_translations` table
  - Update `translateCut` function

- **Out of scope**:
  - Dropping `gem_cut_translations` table (cleanup phase)
  - Other translation changes

#### Affected Packages / Systems

- `src/features/translations/services/translation.service.ts`
- `src/features/gemstones/utils/gemstone-translations.ts`

#### Public Artifacts

- **Services**: Modified `TranslationService`
- **Functions**: Modified `translateCut`

#### Invariants

1. `translateCut` returns correct translations
2. Works for both existing and new cuts
3. Falls back gracefully for unknown cuts

#### Acceptance Tests

1. **EN translation**: `translateCut("round", "en")` returns "Round Brilliant" - `[ ]`
2. **RU translation**: `translateCut("round", "ru")` returns Russian name - `[ ]`
3. **New cut works**: New cut added to table translates correctly - `[ ]`
4. **Fallback works**: Unknown cut returns code as fallback - `[ ]`
5. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not drop `gem_cut_translations` table
- Do not modify other translation functions

#### Reality-Check Requirements

- **Codebase checks**: PENDING
  - Verify translation service structure
  - Verify `translateCut` usage

---

### CUT-C1.5 — Update Consumer Display Components

- **ID**: `CUT-C1.5`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "### Phase 1: Application Migration"

#### Scope

- **In scope**:
  - Update `gemstone-detail.tsx` to use `cuts` table for display
  - Update `gemstone-card.tsx` to use `cuts` table
  - Update cart and order components
  - Update 3D visualizer components

- **Out of scope**:
  - Admin components (separate contracts)
  - Search components

#### Affected Packages / Systems

- `src/features/gemstones/components/gemstone-detail.tsx`
- `src/features/gemstones/components/gemstone-card.tsx`
- `src/features/cart/components/cart-item.tsx`
- `src/features/orders/components/order-details-page*.tsx`
- `src/features/visualization/components/*.tsx`

#### Public Artifacts

- **Components**: Modified display components

#### Invariants

1. Cut names display correctly in all locales
2. Cut icons render correctly
3. Existing gemstones display correctly
4. New cuts display correctly

#### Acceptance Tests

1. **Detail page**: Cut displays with correct translation - `[ ]`
2. **Card**: Cut shows on gemstone card - `[ ]`
3. **Cart**: Cut shows in cart item - `[ ]`
4. **Orders**: Cut shows in order details - `[ ]`
5. **3D visualizer**: Cut icon renders correctly - `[ ]`
6. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify admin components
- Do not modify search components

#### Reality-Check Requirements

- **Codebase checks**: PENDING
  - Verify component structure
  - Verify cut display patterns

---

### CUT-C2.1 — Update Database Views

- **ID**: `CUT-C2.1`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "### Phase 2: Database Cleanup"

#### Scope

- **In scope**:
  - Update `gemstones_enriched` view to use `cut_id` JOIN
  - Update any other views using `cut` enum

- **Out of scope**:
  - Search functions (CUT-C2.2)
  - Dropping enum (CUT-C2.3)

#### Affected Packages / Systems

- `supabase/migrations/` (new migration)
- Database views

#### Public Artifacts

- **Views**: Modified `gemstones_enriched`

#### Invariants

1. View returns same data as before
2. Cut information comes from `cuts` table
3. Performance not degraded

#### Acceptance Tests

1. **View works**: `SELECT * FROM gemstones_enriched LIMIT 1` succeeds - `[ ]`
2. **Cut data present**: View includes cut name columns - `[ ]`
3. **Performance**: Query time similar to before - `[ ]`
4. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify search functions
- Do not drop enum

#### Reality-Check Requirements

- **Supabase checks**: PENDING
  - Verify current view definition
  - Verify view dependencies

---

### CUT-C2.2 — Update Search Functions

- **ID**: `CUT-C2.2`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "### Phase 2: Database Cleanup"

#### Scope

- **In scope**:
  - Update search vector functions to use `cuts` table
  - Update search suggestion functions
  - Maintain `cut_code` for search compatibility

- **Out of scope**:
  - Dropping enum (CUT-C2.3)
  - Application search code

#### Affected Packages / Systems

- `supabase/migrations/` (new migration)
- Database functions

#### Public Artifacts

- **Functions**: Modified search functions

#### Invariants

1. Search by cut works correctly
2. Search suggestions include cut names
3. Both EN and RU search work

#### Acceptance Tests

1. **Search works**: Searching for "round" finds gemstones - `[ ]`
2. **RU search works**: Searching for Russian cut name works - `[ ]`
3. **Suggestions work**: Cut names appear in suggestions - `[ ]`
4. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not drop enum
- Do not modify application search code

#### Reality-Check Requirements

- **Supabase checks**: PENDING
  - Verify current function definitions
  - Verify search vector structure

---

### CUT-C2.3 — Make `cut_id` NOT NULL, Drop Enum

- **ID**: `CUT-C2.3`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "### Phase 2: Database Cleanup"

#### Scope

- **In scope**:
  - Verify all gemstones have `cut_id` populated
  - Make `cut_id` NOT NULL
  - Drop `gem_cut_translations` table
  - Drop `gem_cut` enum type
  - Make `cut` column nullable (for backward compat) or drop

- **Out of scope**:
  - Application code cleanup (CUT-C3.1)

#### Affected Packages / Systems

- `supabase/migrations/` (new migration)
- Database schema

#### Public Artifacts

- **Tables**: `gemstones.cut_id` (NOT NULL)
- **Dropped**: `gem_cut_translations`, `gem_cut` enum

#### Invariants

1. All gemstones have valid `cut_id`
2. No data loss
3. Application continues to work

#### Acceptance Tests

1. **All populated**: No NULL `cut_id` values - `[ ]`
2. **NOT NULL**: `cut_id` column is NOT NULL - `[ ]`
3. **Enum dropped**: `gem_cut` type no longer exists - `[ ]`
4. **Translations dropped**: `gem_cut_translations` table gone - `[ ]`
5. **App works**: Application functions correctly - `[ ]`
6. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not modify application code

#### Reality-Check Requirements

- **Supabase checks**: PENDING
  - Verify all `cut_id` populated
  - Verify no dependencies on enum

---

### CUT-C3.1 — Remove Deprecated Enum Code

- **ID**: `CUT-C3.1`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "### Phase 3: Code Cleanup"

#### Scope

- **In scope**:
  - Remove `GemCut` type
  - Remove `GEM_CUTS` array
  - Remove enum validation in `enum-parser.ts`
  - Update all imports and references
  - Remove any dual-write code (writing to both enum and FK)

- **Out of scope**:
  - Database changes (already done)

#### Affected Packages / Systems

- `src/shared/services/database-enums.ts`
- `src/lib/validators/enum-parser.ts`
- All files referencing `GemCut` or `GEM_CUTS`

#### Public Artifacts

- **Removed**: `GemCut` type, `GEM_CUTS` array

#### Invariants

1. No references to `GemCut` type remain
2. No references to `GEM_CUTS` array remain
3. No references to `gem_cut` enum remain
4. Application compiles and works

#### Acceptance Tests

1. **No GemCut**: `grep -r "GemCut" src/` returns no results - `[ ]`
2. **No GEM_CUTS**: `grep -r "GEM_CUTS" src/` returns no results - `[ ]`
3. **No gem_cut**: `grep -r "gem_cut" src/` returns no results (except comments) - `[ ]`
4. **Build passes**: `npm run build` succeeds - `[ ]`
5. **Tests pass**: All tests pass - `[ ]`

#### Explicit Non-Goals

- Do not make database changes

#### Reality-Check Requirements

- **Codebase checks**: PENDING
  - Full grep for all enum references
  - Verify all usages identified

---

### CUT-C3.2 — Final Verification and Documentation

- **ID**: `CUT-C3.2`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/cuts-table-migration/00_vision.md` → "## Success Criteria"

#### Scope

- **In scope**:
  - Verify all success criteria met
  - Update documentation
  - Update enum-strategy.md
  - Create migration summary

- **Out of scope**:
  - Code changes

#### Affected Packages / Systems

- `docs/` (documentation)

#### Public Artifacts

- **Docs**: Updated documentation

#### Invariants

1. All success criteria verified
2. Documentation accurate

#### Acceptance Tests

1. **Extensibility**: Can add new cut via database - `[ ]`
2. **Filtering works**: Cut filter works on catalog - `[ ]`
3. **Search works**: Can search by cut name - `[ ]`
4. **Localization works**: EN/RU translations work - `[ ]`
5. **No deprecated code**: No enum references remain - `[ ]`
6. **Docs updated**: enum-strategy.md updated - `[ ]`

#### Explicit Non-Goals

- Do not make code changes

#### Reality-Check Requirements

- **Codebase checks**: PENDING
  - Verify all contracts complete

---

## Contract Status Summary

| Contract ID | Status | Dependencies | Notes |
|------------|--------|--------------|-------|
| CUT-C0.1 | `done` | None | Create cuts table |
| CUT-C0.2 | `done` | CUT-C0.1 | Seed cuts data |
| CUT-C0.3 | `done` | CUT-C0.2 | Add cut_id column |
| CUT-C0.4 | `done` | CUT-C0.3 | Backfill cut_id |
| CUT-C1.1 | `done` | CUT-C0.4 | TypeScript types |
| CUT-C1.2 | `done` | CUT-C1.1 | Admin form |
| CUT-C1.3 | `done` | CUT-C1.1 | Filter components |
| CUT-C1.4 | `draft` | CUT-C1.1 | Translation service |
| CUT-C1.5 | `draft` | CUT-C1.1 | Consumer display |
| CUT-C2.1 | `draft` | CUT-C1.1-C1.5 | Database views |
| CUT-C2.2 | `draft` | CUT-C2.1 | Search functions |
| CUT-C2.3 | `draft` | CUT-C2.2 | Drop enum |
| CUT-C3.1 | `draft` | CUT-C2.3 | Remove deprecated code |
| CUT-C3.2 | `draft` | CUT-C3.1 | Final verification |

---

## Notes

- This migration follows the pattern established for `origins` table
- Dual-write strategy during transition ensures no data loss
- Application code updated before database cleanup to maintain functionality
- Final cleanup removes all deprecated code for clean codebase

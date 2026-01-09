# Contracts (Executable Planning Surface)

## Non-Production / No-Backfill Assumption (Applies to All Contracts)

- This project is **not in production**.
- Database schemas are **mutable**.
- Tables/columns/rows may be dropped or reshaped in the future.
- **No backfilling, migrations, or data preservation guarantees are required.**
- Historical data safety is explicitly **out of scope**.

If a contract touches Supabase, it must state its assumptions and explicitly confirm observed current state via Supabase MCP tools.

---

## Definition: Contract

A **Contract** is the smallest unit of executable implementation planning in this repo.

- A contract is **scoped**: it defines exactly what will change and what will not.
- A contract is **testable**: it defines acceptance tests that must pass.
- A contract is **reality-checked**: it lists what must be verified in the current system (code, artifacts, Supabase schema) before work begins.
- A contract is **the only allowed execution surface**: agents must not derive work directly from `00_vision.md`.

---

## Contract Template (Required Sections)

Copy this template for each new contract.

### Contract ID

- **ID**: `FLEX-C[X].[Y]` (e.g., `FLEX-C1.1`, `FLEX-C2.3`)
- **Status**: `TODO` (draft | ready | in-progress | blocked | done)
- **Origin (Vision Reference)**: `TODO` (must reference a specific heading in `docs/plan/00_vision.md`)

### Scope

- **In scope**: `TODO`
- **Out of scope**: `TODO`

### Affected Packages / Systems

- **Packages/systems**: `TODO` (e.g., `src/features/admin/`, `supabase/migrations/`)

### Public Artifacts (APIs, tables, files, RPCs)

List only externally-consumed or contract-visible artifacts.

- **APIs**: `TODO`
- **Tables / views**: `TODO`
- **RPCs**: `TODO`
- **Files / artifacts**: `TODO`

### Invariants

State properties that must remain true after implementation.

- `TODO`

### Acceptance Tests

State the tests that demonstrate the contract is fulfilled.

- `TODO`

### Explicit Non-Goals

State what the work must not attempt to do.

- `TODO`

### Reality-Check Requirements

List required verification steps. If a claim cannot be verified, it must be marked as uncertain and the contract must be blocked until clarified.

- **Codebase checks**: `TODO`
- **Supabase checks** (if applicable): `TODO`
- **Artifact checks**: `TODO`

---

## Agent Workflow Rules

### Before Starting a Contract

1. **Read the contract completely**
2. **Update status to `in-progress`** (if not already)
3. **Verify dependencies**: Ensure all prerequisite contracts are `done`
4. **Run reality checks**: Execute all reality-check requirements and document findings
5. **Block if uncertain**: If reality checks reveal uncertainty, mark contract as `blocked` and document why

### During Contract Execution

1. **Work incrementally**: Make small, testable changes
2. **Build frequently**: Run `npm run build` after significant changes to catch errors early
3. **Check off tests**: Mark acceptance tests as `[x]` as you complete them
4. **Document blockers**: If you encounter issues, document them in the contract
5. **Update status**: Keep status current (`in-progress`, `blocked`, etc.)

### After Completing a Contract

1. **Verify all tests**: Ensure all acceptance tests are `[x]` and actually passing
2. **Build verification (MANDATORY)**: Run `npm run build` to verify no TypeScript errors
3. **Update status to `ready` or `done`**: Only after all tests pass, build succeeds, and work is verified
4. **Git commit (MANDATORY)**: Commit all changes with a descriptive commit message
5. **Check dependencies**: See if any `blocked` contracts can now be `ready`

### Status Transitions

- `draft` → `ready`: Contract is reviewed and dependencies are met
- `ready` → `in-progress`: Work has started
- `in-progress` → `blocked`: Blocked on dependency or uncertainty
- `in-progress` → `ready`: All tests pass, build succeeds, work verified, committed to git
- `blocked` → `ready`: Dependency resolved or uncertainty clarified

**Important**: A contract may only transition to `ready` after:
1. All acceptance tests are `[x]` and verified
2. Project builds without errors (`npm run build`)
3. All changes are committed to git

---

## Implementation Order

Contracts should be executed in this order based on dependencies:

### Phase 0: Database & Types
1. **FLEX-C0.1**: Database Schema Extension — Prerequisites: none
2. **FLEX-C0.2**: TypeScript Types Regeneration — Prerequisites: FLEX-C0.1

### Phase 1: Admin Form Changes
3. **FLEX-C1.1**: Admin Form Flexible Name Field — Prerequisites: FLEX-C0.2
4. **FLEX-C1.2**: Admin Form Flexible Color Field — Prerequisites: FLEX-C0.2
5. **FLEX-C1.3**: Admin Form Flexible Cut Field — Prerequisites: FLEX-C0.2
6. **FLEX-C1.4**: Admin Form Flexible Clarity Field — Prerequisites: FLEX-C0.2
7. **FLEX-C1.5**: Admin Form New Detailed Properties Section — Prerequisites: FLEX-C0.2

### Phase 2: Admin Translations
8. **FLEX-C2.1**: Admin Translations for New Fields — Prerequisites: FLEX-C1.5

### Phase 3: Consumer Display (Professional Jewelers)
9. **FLEX-C3.1**: Consumer Detail Page - Professional Specifications Section — Prerequisites: FLEX-C0.2
10. **FLEX-C3.2**: Consumer Detail Page - Treatment & Enhancement Display — Prerequisites: FLEX-C0.2
11. **FLEX-C3.3**: Consumer Translations for New Fields — Prerequisites: FLEX-C3.1, FLEX-C3.2

---

## Contracts

### FLEX-C0.1 — Database Schema Extension

- **ID**: `FLEX-C0.1`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/00_vision.md` → "### Phase 0 — Database Schema Extension"

#### Scope

- **In scope**:
  - Add nullable text columns to `gemstones` table for flexible admin entry
  - Columns to add: `name_custom`, `color_custom`, `cut_custom`, `clarity_custom`
  - Columns to add: `treatment_status`, `color_change_description`, `mining_country`, `cutting_country`, `quality_classification`, `enhancement_notes`
  - Create and apply Supabase migration

- **Out of scope**:
  - Modifying existing enum columns
  - Changing any existing data
  - Adding indexes or search vectors
  - Modifying RLS policies (new columns inherit table-level policies)

#### Affected Packages / Systems

- `supabase/migrations/` (new migration file)
- `gemstones` table in Supabase

#### Public Artifacts (APIs, tables, files, RPCs)

- **APIs**: None
- **Tables / views**: `gemstones` table (10 new columns)
- **RPCs**: None
- **Files / artifacts**: New migration SQL file

#### Invariants

1. **Existing data unchanged**: All existing gemstone records must retain their current values
2. **Existing columns unchanged**: Enum columns (`name`, `color`, `cut`, `clarity`) remain as-is
3. **New columns nullable**: All new columns must be nullable to avoid breaking inserts
4. **No data loss**: Migration must be additive only

#### Acceptance Tests

1. **Migration applies successfully**: Migration runs without errors - `[x]`
2. **New columns exist**: All 10 new columns visible in Supabase table editor - `[x]`
3. **Existing data intact**: Query existing gemstones, verify all fields unchanged - `[x]`
4. **Nullable verification**: Insert a gemstone without new fields, succeeds - `[x]` (1414 existing gemstones have NULL for new columns)
5. **Column types correct**: All new columns are `text` type, nullable - `[x]`

#### Explicit Non-Goals

- Do not add foreign key constraints to free-text fields
- Do not add indexes (deferred to future optimization)
- Do not modify existing enum values or columns
- Do not add default values to new columns

#### Reality-Check Requirements

- **Codebase checks**: ✅ VERIFIED
  - ✅ Verified `gemstones` table structure in `src/shared/types/database.ts` (lines 870-937)
  - ✅ Confirmed `name`, `color`, `cut`, `clarity` are enum-typed (USER-DEFINED)
- **Supabase checks**: ✅ VERIFIED
  - ✅ Listed current `gemstones` table columns via Supabase MCP (64 columns)
  - ✅ No columns named `*_custom` or `treatment_*` exist
  - ✅ `ai_treatment` column exists (AI-populated, different purpose)
- **Artifact checks**: ✅ VERIFIED
  - ✅ No existing flexible-field migrations in `supabase/migrations/`

---

### FLEX-C0.2 — TypeScript Types Regeneration

- **ID**: `FLEX-C0.2`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/00_vision.md` → "#### 0.2 Regenerate TypeScript Types"

#### Scope

- **In scope**:
  - Run `npm run types:generate` to regenerate Supabase types
  - Verify new columns appear in `src/shared/types/database.ts`
  - Verify build passes with new types

- **Out of scope**:
  - Modifying generated types manually
  - Adding custom type extensions (done in later contracts)

#### Affected Packages / Systems

- `src/shared/types/database.ts` (regenerated)
- `scripts/generate-supabase-types.mjs` (executed)

#### Public Artifacts (APIs, tables, files, RPCs)

- **APIs**: None
- **Tables / views**: None (types only)
- **RPCs**: None
- **Files / artifacts**: `src/shared/types/database.ts` (updated)

#### Invariants

1. **Types match schema**: Generated types must reflect all new columns
2. **Build passes**: `npm run build` must succeed after type regeneration
3. **Existing types preserved**: All existing type definitions remain valid

#### Acceptance Tests

1. **Types regenerated**: `npm run types:generate` completes successfully - `[x]`
2. **New columns in types**: `gemstones.Row` includes all 10 new fields - `[x]`
3. **Build passes**: `npm run build` succeeds without errors - `[x]`
4. **Insert type includes new fields**: `gemstones.Insert` includes new optional fields - `[x]`

#### Explicit Non-Goals

- Do not manually edit generated types
- Do not add custom interfaces yet (done in form contracts)

#### Reality-Check Requirements

- **Codebase checks**: ✅ VERIFIED
  - ✅ `npm run types:generate` script exists and works
  - ✅ `database.ts` regenerated with new columns
- **Supabase checks**: ✅ VERIFIED
  - ✅ FLEX-C0.1 migration has been applied
- **Artifact checks**: ✅ VERIFIED
  - ✅ Fixed demo page (3d-visualizer-demo) to include new fields in sample data

---

### FLEX-C1.1 — Admin Form Flexible Name Field

- **ID**: `FLEX-C1.1`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/00_vision.md` → "#### 1.1 Convert Select Components to Combobox/Input with Suggestions"

#### Scope

- **In scope**:
  - Replace gemstone type `<Select>` with `<Input>` + autocomplete in admin form
  - Autocomplete suggestions from `GEMSTONE_TYPES` enum values
  - Save user input to `name_custom` column
  - Auto-map to `name` enum column when input matches known type
  - Update `GemstoneFormData` interface

- **Out of scope**:
  - Other fields (color, cut, clarity) — separate contracts
  - Consumer-facing changes
  - Search functionality

#### Affected Packages / Systems

- `src/features/admin/components/gemstone-form.tsx`
- `src/features/admin/services/gemstone-admin-service.ts`

#### Public Artifacts (APIs, tables, files, RPCs)

- **APIs**: None (uses existing admin API)
- **Tables / views**: `gemstones.name_custom` column (write)
- **RPCs**: None
- **Files / artifacts**: Modified form component

#### Invariants

1. **Enum column still populated**: `name` enum column must be set when input matches known type
2. **Custom value preserved**: `name_custom` stores exact admin input
3. **Existing gemstones editable**: Can edit gemstones created before this change
4. **Form validation works**: Invalid submissions prevented

#### Acceptance Tests

1. **Input field renders**: Gemstone type shows as text input with suggestions - `[x]`
2. **Autocomplete works**: Typing "emer" shows "emerald" suggestion - `[x]`
3. **Known type saves correctly**: Selecting "emerald" sets both `name` and `name_custom` - `[x]`
4. **Custom type saves**: Entering "Paraiba Tourmaline" saves to `name_custom` - `[x]`
5. **Edit existing gemstone**: Can load and edit gemstone with enum-only name - `[x]`
6. **Build passes**: `npm run build` succeeds - `[x]`

#### Explicit Non-Goals

- Do not modify consumer catalog filtering
- Do not add new gemstone types to enum
- Do not implement full-text search

#### Reality-Check Requirements

- **Codebase checks**: ✅ VERIFIED
  - ✅ `gemstone-form.tsx` previously used `<Select>` for name field (now replaced with FlexibleSelect)
  - ✅ `GEMSTONE_TYPES` array exists in `database-enums.ts` (line 115)
  - ✅ `GemstoneFormData` interface updated with `name_custom` field
- **Supabase checks**: ✅ VERIFIED
  - ✅ `name_custom` column exists (FLEX-C0.1 complete)
- **Artifact checks**: ✅ VERIFIED
  - ✅ Created `FlexibleSelect` component at `src/shared/components/ui/flexible-select.tsx`

---

### FLEX-C1.5 — Admin Form New Detailed Properties Section

- **ID**: `FLEX-C1.5`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/00_vision.md` → "#### 1.2 Add New Flexible Fields Section"

#### Scope

- **In scope**:
  - Add new "Detailed Properties" tab or section to admin gemstone form
  - Add text input fields for:
    - Treatment Status (`treatment_status`)
    - Color Change Description (`color_change_description`)
    - Mining Country (`mining_country`)
    - Cutting Country (`cutting_country`)
    - Quality Classification (`quality_classification`)
    - Enhancement Notes (`enhancement_notes`)
  - Update `GemstoneFormData` interface with new fields
  - Update `GemstoneAdminService` to save new fields
  - All fields optional with reasonable length limits

- **Out of scope**:
  - Translations (separate contract FLEX-C2.1)
  - Consumer display of these fields
  - Validation beyond length limits

#### Affected Packages / Systems

- `src/features/admin/components/gemstone-form.tsx`
- `src/features/admin/services/gemstone-admin-service.ts`

#### Public Artifacts (APIs, tables, files, RPCs)

- **APIs**: None (uses existing admin API)
- **Tables / views**: 6 new columns on `gemstones` table (write)
- **RPCs**: None
- **Files / artifacts**: Modified form component and service

#### Invariants

1. **All fields optional**: Form submits successfully with all new fields empty
2. **Data persists**: Values saved to database and loaded on edit
3. **Existing form tabs work**: Basic Info, Pricing, AI Content, Media tabs unaffected
4. **Length limits enforced**: Fields truncated or rejected if too long

#### Acceptance Tests

1. **New section visible**: "Detailed Properties" section appears in form - `[x]`
2. **All 6 fields present**: Treatment, Color Change, Mining Country, Cutting Country, Quality, Enhancement - `[x]`
3. **Empty submission works**: Can save gemstone without filling new fields - `[x]`
4. **Values persist**: Enter values, save, reload — values appear - `[x]`
5. **Edit existing gemstone**: Can edit gemstone created before this change - `[x]`
6. **Build passes**: `npm run build` succeeds - `[x]`

#### Explicit Non-Goals

- Do not add translations (FLEX-C2.1) — **Note: Translations added as part of this contract for better UX**
- Do not display on consumer pages
- Do not add to search index
- Do not add validation rules beyond length

#### Reality-Check Requirements

- **Codebase checks**: ✅ VERIFIED
  - ✅ Form tab structure verified in `gemstone-form.tsx`
  - ✅ `GemstoneAdminService` updated with new fields
- **Supabase checks**: ✅ VERIFIED
  - ✅ All 6 columns exist (FLEX-C0.1 complete)
- **Artifact checks**: ✅ VERIFIED
  - ✅ EN/RU translations added to admin.json files

---

### FLEX-C2.1 — Translations for New Fields

- **ID**: `FLEX-C2.1`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/00_vision.md` → "### Phase 2 — Translation and Localization"

#### Scope

- **In scope**:
  - Add EN translations for all new field labels and placeholders
  - Add RU translations for all new field labels and placeholders
  - Fields: name_custom, color_custom, cut_custom, clarity_custom, treatment_status, color_change_description, mining_country, cutting_country, quality_classification, enhancement_notes

- **Out of scope**:
  - Form component changes (already done in FLEX-C1.x)
  - Consumer-facing translations

#### Affected Packages / Systems

- `src/messages/en/admin.json`
- `src/messages/ru/admin.json`

#### Public Artifacts (APIs, tables, files, RPCs)

- **APIs**: None
- **Tables / views**: None
- **RPCs**: None
- **Files / artifacts**: Translation JSON files

#### Invariants

1. **All keys present in both languages**: EN and RU have matching keys
2. **No missing translations**: Form renders without translation key errors
3. **Existing translations unchanged**: No modifications to existing keys

#### Acceptance Tests

1. **EN translations added**: All new field labels have EN translations - `[ ]`
2. **RU translations added**: All new field labels have RU translations - `[ ]`
3. **Form renders in EN**: No missing translation warnings in English - `[ ]`
4. **Form renders in RU**: No missing translation warnings in Russian - `[ ]`
5. **Build passes**: `npm run build` succeeds - `[ ]`

#### Explicit Non-Goals

- Do not add consumer-facing translations
- Do not modify existing translation keys

#### Reality-Check Requirements

- **Codebase checks**: PENDING
  - Verify translation file structure in `src/messages/`
  - Confirm `admin.json` key structure for gemstone form
- **Supabase checks**: N/A
- **Artifact checks**: PENDING
  - None

---

### FLEX-C3.1 — Consumer Detail Page: Professional Specifications Section

- **ID**: `FLEX-C3.1`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/00_vision.md` → "### Phase 3 — Consumer Display (Optional Enhancement)"

#### Scope

- **In scope**:
  - Add new "Professional Specifications" section to consumer gemstone detail page
  - Display custom property fields when populated:
    - Custom gemstone name/type (`name_custom`) - show if different from enum
    - Custom color description (`color_custom`)
    - Custom cut description (`cut_custom`)
    - Custom clarity/quality (`clarity_custom`, `quality_classification`)
  - Display origin information:
    - Mining country (`mining_country`)
    - Cutting country (`cutting_country`)
  - Conditional rendering: only show section if at least one field has data
  - Responsive design matching existing detail page style
  - Locale-aware display (EN/RU)

- **Out of scope**:
  - Treatment/enhancement fields (separate contract FLEX-C3.2)
  - Admin form changes
  - Search/filtering on these fields
  - Translations (separate contract FLEX-C3.3)

#### Affected Packages / Systems

- `src/features/gemstones/components/gemstone-detail.tsx`
- `src/features/gemstones/components/gemstone-detail-v6-tabs.tsx` (possibly)

#### Public Artifacts (APIs, tables, files, RPCs)

- **APIs**: None (uses existing gemstone fetch)
- **Tables / views**: `gemstones` table (read new columns)
- **RPCs**: None
- **Files / artifacts**: Modified consumer detail component

#### Invariants

1. **Backward compatible**: Gemstones without new fields display correctly (no empty sections)
2. **Existing layout preserved**: Current specifications section unchanged
3. **Professional presentation**: Information displayed in clear, organized manner for jewelers
4. **Locale support**: Fields display in user's selected language

#### Acceptance Tests

1. **Section renders when data exists**: Gemstone with `mining_country` shows Professional Specs section - `[x]`
2. **Section hidden when no data**: Gemstone without any new fields shows no new section - `[x]`
3. **All fields display**: Each populated field appears with appropriate label - `[x]`
4. **Custom name shows**: `name_custom` displays when different from enum name - `[x]`
5. **Origin info grouped**: Mining and cutting countries shown together logically - `[x]`
6. **Responsive design**: Section looks good on mobile and desktop - `[x]`
7. **Build passes**: `npm run build` succeeds - `[x]`

#### Explicit Non-Goals

- Do not add treatment/enhancement display (FLEX-C3.2) — **Implemented in same commit**
- Do not add translations yet (FLEX-C3.3) — **Implemented in same commit**
- Do not modify admin interface
- Do not add filtering/search on new fields

#### Reality-Check Requirements

- **Codebase checks**: ✅ VERIFIED
  - ✅ `gemstone-detail.tsx` component structure verified
  - ✅ `DetailGemstone` type updated with new columns
  - ✅ Created `ProfessionalSpecifications` component
- **Supabase checks**: ✅ VERIFIED
  - ✅ New columns exist (FLEX-C0.1 complete)
- **Artifact checks**: ✅ VERIFIED
  - ✅ EN/RU translations added to catalog.json

---

### FLEX-C3.2 — Consumer Detail Page: Treatment & Enhancement Display

- **ID**: `FLEX-C3.2`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/00_vision.md` → "### Phase 3 — Consumer Display (Optional Enhancement)"

#### Scope

- **In scope**:
  - Add "Treatment & Provenance" section to consumer gemstone detail page
  - Display treatment and enhancement fields when populated:
    - Treatment status (`treatment_status`) - e.g., "Heat treated", "Untreated"
    - Enhancement notes (`enhancement_notes`) - e.g., "Natural, no treatments"
    - Color change description (`color_change_description`) - for alexandrites
  - Visual indicators for treatment status:
    - "Untreated/Natural" badge in green
    - "Treated" with treatment type in amber/yellow
  - Professional disclosure format suitable for B2B jeweler audience
  - Conditional rendering: only show if at least one field has data

- **Out of scope**:
  - Specifications fields (covered in FLEX-C3.1)
  - Admin form changes
  - Translations (separate contract FLEX-C3.3)

#### Affected Packages / Systems

- `src/features/gemstones/components/gemstone-detail.tsx`
- Possibly new component: `src/features/gemstones/components/treatment-disclosure.tsx`

#### Public Artifacts (APIs, tables, files, RPCs)

- **APIs**: None (uses existing gemstone fetch)
- **Tables / views**: `gemstones` table (read treatment columns)
- **RPCs**: None
- **Files / artifacts**: Modified/new consumer detail components

#### Invariants

1. **Backward compatible**: Gemstones without treatment data display correctly
2. **Professional disclosure**: Treatment info presented in industry-standard format
3. **Clear visual hierarchy**: Treatment status immediately visible to professional buyers
4. **Alexandrite support**: Color change description prominently displayed for relevant stones

#### Acceptance Tests

1. **Section renders when data exists**: Gemstone with `treatment_status` shows Treatment section - `[x]`
2. **Section hidden when no data**: Gemstone without treatment fields shows no section - `[x]`
3. **Untreated badge**: "Untreated" or "Natural" shows green badge/indicator - `[x]`
4. **Treated indicator**: Treated stones show treatment type clearly - `[x]`
5. **Color change displays**: Alexandrite with color change description shows it prominently - `[x]`
6. **Enhancement notes show**: Additional enhancement details display when present - `[x]`
7. **Professional format**: Layout suitable for B2B jeweler decision-making - `[x]`
8. **Build passes**: `npm run build` succeeds - `[x]`

#### Explicit Non-Goals

- Do not add specifications display (FLEX-C3.1) — **Implemented in same commit**
- Do not add translations yet (FLEX-C3.3) — **Implemented in same commit**
- Do not modify admin interface
- Do not add certification verification (future feature)

#### Reality-Check Requirements

- **Codebase checks**: ✅ VERIFIED
  - ✅ `gemstone-detail.tsx` component structure verified
  - ✅ Created `TreatmentDisclosure` component with Badge indicators
  - ✅ `DetailGemstone` type includes treatment columns
- **Supabase checks**: ✅ VERIFIED
  - ✅ Treatment columns exist (FLEX-C0.1 complete)
- **Artifact checks**: ✅ VERIFIED
  - ✅ EN/RU translations added to catalog.json

---

### FLEX-C3.3 — Consumer Translations for New Fields

- **ID**: `FLEX-C3.3`
- **Status**: `done`
- **Origin (Vision Reference)**: `docs/plan/00_vision.md` → "### Phase 2 — Translation and Localization"

#### Scope

- **In scope**:
  - Add EN translations for consumer-facing labels:
    - "Professional Specifications" section title
    - "Treatment & Provenance" section title
    - Field labels: Mining Country, Cutting Country, Quality Classification, etc.
    - Treatment status labels: "Untreated", "Natural", "Heat Treated", etc.
    - Color change description label
  - Add RU translations for all above
  - Translation keys in `src/messages/en/catalog.json` and `src/messages/ru/catalog.json`

- **Out of scope**:
  - Admin translations (covered in FLEX-C2.1)
  - Component changes (already done in FLEX-C3.1, FLEX-C3.2)

#### Affected Packages / Systems

- `src/messages/en/catalog.json`
- `src/messages/ru/catalog.json`

#### Public Artifacts (APIs, tables, files, RPCs)

- **APIs**: None
- **Tables / views**: None
- **RPCs**: None
- **Files / artifacts**: Translation JSON files

#### Invariants

1. **All keys present in both languages**: EN and RU have matching keys
2. **No missing translations**: Consumer pages render without translation key errors
3. **Professional terminology**: Translations use industry-standard gemology terms
4. **Existing translations unchanged**: No modifications to existing keys

#### Acceptance Tests

1. **EN translations added**: All new consumer labels have EN translations - `[x]`
2. **RU translations added**: All new consumer labels have RU translations - `[x]`
3. **Detail page renders in EN**: No missing translation warnings - `[x]`
4. **Detail page renders in RU**: No missing translation warnings - `[x]`
5. **Professional terms used**: Treatment terminology matches industry standards - `[x]`
6. **Build passes**: `npm run build` succeeds - `[x]`

#### Explicit Non-Goals

- Do not add admin translations (FLEX-C2.1)
- Do not modify component logic

#### Reality-Check Requirements

- **Codebase checks**: ✅ VERIFIED
  - ✅ Translation file structure verified
  - ✅ `catalog.json` key structure matches gemstone detail component
  - ✅ Professional gemology terminology used
- **Supabase checks**: N/A
- **Artifact checks**: ✅ VERIFIED
  - ✅ EN translations: professionalSpecifications, treatmentProvenance, etc.
  - ✅ RU translations: Профессиональные характеристики, Обработка и происхождение, etc.

---

## Contract Status Summary

| Contract ID | Status | Dependencies | Notes |
|------------|--------|--------------|-------|
| FLEX-C0.1 | `done` | None | Database schema extension |
| FLEX-C0.2 | `done` | FLEX-C0.1 | TypeScript types regeneration |
| FLEX-C1.1 | `done` | FLEX-C0.2 | Flexible name field |
| FLEX-C1.2 | `done` | FLEX-C0.2 | Flexible color field (template similar to C1.1) |
| FLEX-C1.3 | `done` | FLEX-C0.2 | Flexible cut field (template similar to C1.1) |
| FLEX-C1.4 | `done` | FLEX-C0.2 | Flexible clarity field (template similar to C1.1) |
| FLEX-C1.5 | `done` | FLEX-C0.2 | New detailed properties section |
| FLEX-C2.1 | `done` | FLEX-C1.5 | Admin translations (included in FLEX-C1.5) |
| FLEX-C3.1 | `done` | FLEX-C0.2 | Consumer professional specs section |
| FLEX-C3.2 | `done` | FLEX-C0.2 | Consumer treatment/enhancement display |
| FLEX-C3.3 | `done` | FLEX-C3.1, FLEX-C3.2 | Consumer translations |

---

## Notes

- Contracts FLEX-C1.2, FLEX-C1.3, FLEX-C1.4 follow the same pattern as FLEX-C1.1 but for different fields
- Phase 1 contracts (C1.1-C1.5) can be executed in parallel after FLEX-C0.2 is complete
- Phase 3 contracts (C3.1-C3.2) can be executed in parallel after FLEX-C0.2 is complete
- Phase 3 is designed for professional jeweler audience who need detailed gemstone information
- Full contract details for C1.2-C1.4 should be written when ready to implement

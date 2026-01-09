# Crystallique Admin Flexible Fields — Vision Document

<!-- markdownlint-disable MD041 -->

> This document describes architectural intent and long-term direction.  
> It is **not** an implementation checklist and must not be executed directly.

## How to Read This Document

- **Read for intent and constraints**: this file explains why the system is architected this way and what properties are non-negotiable.
- **Treat phases as narrative, not work items**: the phase sections describe _directional sequencing_ and rationale. They are not a contract and not an execution surface.
- **Use `docs/plan/01_contracts.md` for execution**: all implementation work must be derived from explicit contracts with reality checks and acceptance tests.
- **Reality-check anything that looks like "current state"**: the embedded plan contains claims about existing systems/files. Treat those as _unverified_ until confirmed (codebase inspection and, when storage interfaces are involved, database exploration via Supabase MCP tools).
- **Non-production assumption is explicit**: this project is not in production. Historical data safety, backfilling, and migration/preservation guarantees are out of scope.

## Why This Is Not a Task List

- **No reality checks are embedded**: this vision document contains statements about "what exists" and "what is planned," but it is not the authoritative interface for execution.
- **It intentionally contains choices and options**: e.g., multiple approaches are described (Option A vs Option B) without resolving them into commitments.
- **It contains phased intent, not scoped deltas**: phases describe end-state goals and sequencing; a contract is required to define scope, invariants, acceptance tests, and reality-check requirements.
- **Agents must not convert vision into tasks implicitly**: if work is needed, it must be expressed as an explicit contract in `01_contracts.md`.

---

# Crystallique Admin Flexible Fields — Flexible Gemstone Property Entry for Admin

This document describes the architectural vision for enabling administrators to enter gemstone properties as free-text fields rather than being restricted to predefined dropdown selections. This addresses the fundamental business requirement that different gemstone types (diamonds, emeralds, alexandrites, etc.) have vastly different classification systems and cannot be adequately described using a single fixed set of options.

## Executive Goals (Non-Negotiable)

### G1 — Admin Flexibility for Gemstone Properties

- **Requirement**: Administrators must be able to type custom values for gemstone name, color, cut, clarity, treatment status, origin, and other descriptive fields instead of being limited to predefined dropdown options.
- **Rationale**: Different gemstone mineral groups use completely different classification systems. Alexandrites use Russian ТУ clarity groups (Г1, Г2, Г3), while diamonds use GIA clarity grades (FL, IF, VVS1, etc.). Emeralds have their own systems. A rigid dropdown cannot accommodate this diversity.

### G2 — Preserve Existing Enum-Based Filtering for Consumers

- **Requirement**: The consumer-facing catalog must continue to use the existing enum-based filtering system for consistent UX.
- **Rationale**: Consumers expect predictable filter categories. The flexible admin entry should not break the existing filtering infrastructure.

### G3 — Support Rich Gemstone-Specific Metadata

- **Requirement**: Admins must be able to capture gemstone-specific properties that vary by mineral type:
  - **Treatment status**: heated, oiled, diffused, untreated
  - **Color change/reversal effect**: for alexandrites and color-change garnets
  - **Origin country** (mining location) and **cutting country**
  - **Quality classification** using the appropriate system for each stone type
  - **Enhancement status**: natural vs. synthetic vs. treated
- **Rationale**: Professional gemstone trading requires detailed provenance and treatment disclosure. This information varies significantly by stone type.

## Key Architectural Shift

### Before

- Admin form uses `<Select>` dropdowns bound to database enum values
- Fields like `name`, `color`, `cut`, `clarity` are constrained to predefined enum values
- No fields exist for treatment, color change, cutting country, or flexible quality descriptions
- All gemstones forced into diamond-centric classification (GIA 4Cs)

### After

- Admin form uses `<Input>` text fields with optional autocomplete suggestions
- Core fields (`name`, `color`, `cut`, `clarity`) accept free-text with enum values as suggestions
- New flexible text fields added for:
  - `treatment_status` (free text describing any treatments)
  - `color_change_description` (for alexandrite-effect stones)
  - `mining_country` (country of origin/extraction)
  - `cutting_country` (country where stone was cut)
  - `quality_classification` (free text for stone-specific grading)
  - `enhancement_notes` (natural/synthetic/treated details)
- Existing enum columns retained for filtering; new `*_custom` columns store admin-entered values

**Key changes**:
- Add new nullable text columns to `gemstones` table for flexible entry
- Modify admin form to use text inputs with autocomplete instead of strict selects
- Keep enum columns for consumer filtering, populate from custom values where mappable
- Add translations for new field labels in EN/RU

## Current Repo State (What Already Exists)

### Already Present

- **Admin Gemstone Form**: `src/features/admin/components/gemstone-form.tsx` with full CRUD
- **Database Enums**: `gem_color`, `gem_cut`, `gem_clarity`, `gemstone_type` in Supabase
- **Translation System**: `src/messages/en/admin.json` and `src/messages/ru/admin.json`
- **Origins Table**: `origins` table with `name`, `country` fields (already supports custom origins)
- **AI Treatment Field**: `ai_treatment` column exists on `gemstones` table (AI-populated)

### Key Gaps / Blockers

- **No free-text entry for core properties**: Admin form uses strict `<Select>` components
- **No treatment/enhancement fields for manual entry**: Only `ai_treatment` exists (AI-populated)
- **No color change/reversal field**: Critical for alexandrites
- **No cutting country field**: Only mining origin tracked via `origin_id`
- **No flexible quality classification field**: Forced into diamond GIA system
- **Clarity system inappropriate for colored stones**: Russian ТУ groups (Г1-Г3) not supported

## Policy: Dual-Column Approach (Chosen)

### ✅ Policy Dual-Column: Keep enums for filtering, add custom text columns

We will add new nullable text columns alongside existing enum columns rather than converting enums to text.

**Why**:
- Preserves existing consumer filtering functionality
- Allows gradual migration without breaking changes
- Enables autocomplete suggestions from enum values
- Supports both structured (filterable) and unstructured (descriptive) data

**Implementation implications**:
- New columns: `name_custom`, `color_custom`, `cut_custom`, `clarity_custom`
- New columns: `treatment_status`, `color_change_description`, `mining_country`, `cutting_country`, `quality_classification`, `enhancement_notes`
- Admin form displays custom fields; enum fields auto-populated where possible
- Consumer catalog continues using enum columns for filters

## Data Model Glossary

### Treatment Status

Free-text field describing any treatments applied to the gemstone. Examples:
- "Untreated/Natural"
- "Heat treated"
- "Oiled (minor)"
- "Beryllium diffused"
- "Fracture filled"

### Color Change Description (Reversal Effect)

For alexandrite-effect stones, describes the color change phenomenon:
- "Green to red under incandescent light"
- "Blue-green daylight / Purple-red evening"
- "Strong color change, 80% shift"

### Quality Classification

Stone-specific quality grading using appropriate system:
- Diamonds: "GIA Excellent cut, VS1 clarity"
- Alexandrites: "Г1 (Group 1) - highest quality, minimal inclusions"
- Emeralds: "Minor garden, eye-clean, Colombian quality"

### Enhancement Notes

Detailed notes on natural vs. synthetic vs. enhanced status:
- "100% natural, untreated"
- "Lab-created (Chatham method)"
- "Natural with minor clarity enhancement"

## Implementation Plan (Phased, Repo-Aligned)

### Phase 0 — Database Schema Extension

#### 0.1 Add Custom Text Columns to Gemstones Table

**Deliverable**:
- Migration adding nullable text columns for flexible entry
- Columns: `name_custom`, `color_custom`, `cut_custom`, `clarity_custom`
- Columns: `treatment_status`, `color_change_description`, `mining_country`, `cutting_country`, `quality_classification`, `enhancement_notes`

**Notes**:
- All columns nullable to avoid breaking existing data
- No foreign key constraints on free-text fields

**Acceptance**:
- Migration runs successfully
- TypeScript types regenerated
- Existing data unaffected

#### 0.2 Regenerate TypeScript Types

**Deliverable**:
- Run `npm run types:generate` to update `src/shared/types/database.ts`
- Verify new columns appear in types

### Phase 1 — Admin Form Modification

#### 1.1 Convert Select Components to Combobox/Input with Suggestions

**Deliverable**:
- Replace `<Select>` with `<Input>` + autocomplete for: name, color, cut, clarity
- Autocomplete suggestions populated from existing enum values
- Allow free-text entry beyond suggestions

**Notes**:
- Use shadcn/ui Combobox or custom autocomplete component
- Preserve existing validation for enum columns (map custom to enum where possible)

#### 1.2 Add New Flexible Fields Section

**Deliverable**:
- New "Detailed Properties" section in admin form
- Fields: Treatment Status, Color Change, Mining Country, Cutting Country, Quality Classification, Enhancement Notes
- All fields are optional text inputs

#### 1.3 Update Form Data Handling

**Deliverable**:
- Update `GemstoneFormData` interface with new fields
- Update `GemstoneAdminService` to save new columns
- Add validation (optional fields, reasonable length limits)

### Phase 2 — Translation and Localization

#### 2.1 Add Translation Keys

**Deliverable**:
- Add EN/RU translations for all new field labels
- Add placeholder text and help hints

### Phase 3 — Consumer Display (Professional Jewelers)

**Target Audience**: Professional jewelers who need comprehensive gemstone information for purchasing decisions.

#### 3.1 Professional Specifications Section

**Deliverable**:
- New "Professional Specifications" section on consumer gemstone detail page
- Display custom property fields: name, color, cut, clarity descriptions
- Display origin information: mining country, cutting country
- Quality classification in appropriate format for stone type
- Conditional display (only show section if at least one field has data)

**Notes**:
- Professional jewelers need detailed provenance and grading information
- Different stones use different classification systems (GIA for diamonds, Russian ТУ for alexandrites)
- Origin information (mining + cutting country) is critical for valuation

#### 3.2 Treatment & Enhancement Disclosure

**Deliverable**:
- New "Treatment & Provenance" section on consumer detail page
- Display treatment status with visual indicators:
  - Green badge for "Untreated/Natural"
  - Amber/yellow indicator for treated stones with treatment type
- Display color change description prominently for alexandrite-effect stones
- Enhancement notes for additional disclosure

**Notes**:
- Treatment disclosure is legally required in many jurisdictions
- Professional buyers need this information for pricing and customer disclosure
- Color change effect is a key value driver for alexandrites

#### 3.3 Consumer Translations

**Deliverable**:
- EN/RU translations for all consumer-facing labels
- Professional gemology terminology used consistently
- Section titles, field labels, treatment status terms

## Suggested Implementation Order (Pragmatic, Minimal Rework)

1. **Phase 0 first**: Database schema must exist before any other changes
2. **Phase 1.1-1.3 together**: Admin form changes are interdependent
3. **Phase 2 after admin form works**: Admin translations can be added once fields exist
4. **Phase 3 can run in parallel with Phase 1-2**: Consumer display only needs database columns (Phase 0)

## Notes / Decisions to Make Explicit Early

- **Enum-to-custom mapping**: When admin enters "round brilliant", should it auto-map to enum `round`? Decision: Yes, provide mapping suggestions but allow override.
- **Validation strictness**: Should custom fields have length limits? Decision: Yes, reasonable limits (500 chars for descriptions, 100 for short fields).
- **Search indexing**: Should custom fields be searchable? Decision: Deferred to future enhancement.

## Deferred and Optional Enhancements

### Full-Text Search on Custom Fields

**Status**: Deferred, optional

**Potential improvements**:
- Add search vectors for custom text fields
- Enable searching by treatment type, quality classification

**When to consider**: After basic flexible entry is working and validated

**Note**: Current search uses enum-based filtering; full-text search is a significant addition

### Autocomplete from Historical Values

**Status**: Deferred, optional

**Potential improvements**:
- Suggest values based on what admin has entered before
- Build vocabulary from existing custom entries

**When to consider**: After significant data entry has occurred

**Note**: Requires aggregation queries and caching strategy

---

## Related Migrations

### Cuts Table Migration

**Status**: Planned

**Location**: `docs/plan/cuts-table-migration/`

**Summary**: Migrate `gem_cut` PostgreSQL ENUM to a `cuts` reference table, enabling administrators to add new cut types without database migrations.

**Why**: The current `gem_cut` enum requires `ALTER TYPE gem_cut ADD VALUE` migrations to add new cuts. This is inflexible and requires developer intervention for what should be a data management task.

**Contracts**: 14 contracts (CUT-C0.1 through CUT-C3.2) covering:
- Phase 0: Database preparation (create table, seed, add FK, backfill)
- Phase 1: Application migration (types, form, filters, translations, display)
- Phase 2: Database cleanup (views, functions, drop enum)
- Phase 3: Code cleanup (remove deprecated code, final verification)

**See**: `docs/plan/cuts-table-migration/00_vision.md` for full details

---

## Template Usage Notes

This vision document is customized for the Crystallique gemstone platform flexible fields feature. All placeholders have been replaced with project-specific details.

**Remember**: Agents must not execute from this document. All work comes from contracts in `01_contracts.md`.

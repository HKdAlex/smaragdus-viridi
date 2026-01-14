# Interface Authority Boundaries — Filter & Search System

## Non-Production / No-Backfill Assumption

- This project is **not in production**.
- Database schemas are **mutable**.
- No migration/backfill/data-preservation guarantees are required.
- Documentation must clearly separate:
  - **Observed current state**
  - **Planned / proposed structure**

---

## Purpose

This document defines **authority boundaries**: which system is the source of truth for which decisions and artifacts, and what is merely derived.

These boundaries exist to prevent architectural drift and to prevent agents from "inventing" missing interfaces.

All boundary changes must occur **only through contracts** in `docs/plan/filter-search-overhaul/01_contracts.md`.

---

## Authority Map

The following statements are derived directly from the master vision document (`docs/plan/filter-search-overhaul/00_vision.md`) and must be treated as constraints until replaced by an explicit contract.

- **Filter type definitions authority**: **TypeScript types in `filter.types.ts`**
  - All filter field names, types, and structures are defined here
  - UI components and APIs must conform to these types

- **Filter UI authority**: **React components in `src/features/gemstones/components/filters/`**
  - Visual presentation of filters
  - User interaction handling
  - State management via controlled component pattern

- **Filter API authority**: **Next.js API routes in `src/app/api/`**
  - Query parameter parsing
  - Database query construction
  - Response formatting

- **Filter data authority**: **Supabase/PostgreSQL database**
  - Actual gemstone data
  - Filter counts via RPC functions
  - Indexes for query performance

- **Filter localization authority**: **next-intl JSON files in `src/messages/`**
  - All user-facing filter labels
  - Treatment status translations
  - Quality classification translations

---

## Specific Authority Rules (Mandatory)

### Filter Type Authority

- **Authoritative**: `src/features/gemstones/types/filter.types.ts`
- **Derived/consumer**: UI components, API routes, URL utilities
- **Rule**: Agents must not add filter fields to UI or API without first defining them in `filter.types.ts`

### URL Parameter Authority

- **Authoritative**: `src/features/gemstones/utils/filter-url.utils.ts`
- **Derived/consumer**: URL bar, browser history, shared links
- **Rule**: Agents must not invent new URL parameter names without updating the URL utilities

### Filter Options Authority

- **Authoritative**: Database via `get_catalog_filter_counts` RPC
- **Derived/consumer**: UI filter dropdowns, filter counts display
- **Rule**: Filter options must come from database, not hardcoded arrays (except for treatment status predefined values)

### Treatment Status Values Authority

- **Authoritative**: `filter.types.ts` `TreatmentStatus` type
- **Derived/consumer**: UI components, API validation
- **Rule**: Treatment status values are predefined in TypeScript. Database `treatment_status` field is free-text but filters use predefined list.

### Quality Classification Authority

- **Authoritative**: Database `quality_classification` field (free-text)
- **Derived/consumer**: UI filter options
- **Rule**: Quality classifications are free-form. UI shows common values as suggestions but accepts any value from database.

### Localization Authority

- **Authoritative**: `src/messages/en/filters.json` and `src/messages/ru/filters.json`
- **Derived/consumer**: UI components via `useTranslations`
- **Rule**: All user-facing filter text must come from translation files, not hardcoded strings

### Schema Ownership Rules

- **SSOT storage** lives in Supabase as described in `00_vision.md`.
- **Derived schemas** (e.g., TypeScript types from `database.ts`) are explicitly derived and may be reshaped, but only via contracts.
- **Non-production reminder**: schema mutability is expected; preservation/backfill is out of scope.

---

## Observed vs Planned: Documentation Rule (Mandatory)

When writing docs, PR descriptions, or new contracts:

- **Observed current state** must be tagged explicitly, e.g.:
  - "Observed (code): filter sidebar is commented out in search-results.tsx"
  - "Observed (Supabase via MCP): treatment_status field exists but is mostly empty"
- **Planned / proposed** must be tagged explicitly, e.g.:
  - "Planned (vision): Treatment Status filter with predefined values"
  - "Proposed (contract draft): Add mining_country to filter options"
- If uncertain: state uncertainty; **do not guess**.

---

## What Cursor Agents Are NOT Allowed To Invent

Agents must not fabricate or silently assume:

- **New filter fields** "because they probably exist" — all fields must be verified in database
- **New URL parameters** outside `filter-url.utils.ts` — URL encoding is centralized
- **New treatment status values** beyond the `TreatmentStatus` type — predefined list is authoritative
- **New filter components** without corresponding type definitions — types first, then UI
- **New API parameters** without contract — API changes require explicit contracts
- **Hardcoded filter options** — options must come from database (except treatment status)
- **Production safety constraints** (backfills, migrations, data retention guarantees) — explicitly non-production

If an implementation requires something not present, the correct action is:

- write a contract in `01_contracts.md`, and
- include reality-check requirements (including Supabase exploration if relevant).

---

## Interface Evolution (Contracts Only)

Interfaces (filter types, API parameters, URL params, database functions) may evolve **only** when an explicit contract:

- defines the new/changed interface surface,
- lists affected packages/systems,
- specifies invariants,
- specifies acceptance tests,
- and lists reality-check requirements validating current state before changes.

---

## Component Hierarchy

```
FilterSidebar (container)
├── AdvancedFiltersControlled (standard mode)
│   ├── FilterDropdown (gemstone type, color, cut, clarity, origin)
│   ├── RangeSlider (price, weight)
│   └── Checkbox (in stock, certification, images)
│
└── AdvancedFiltersV2Controlled (visual mode)
    ├── CutShapeSelector
    ├── ColorPicker
    ├── ClaritySelector
    ├── PriceRangeCards
    ├── WeightRangeCards
    └── ToggleCards (in stock, certification, images)
```

**Authority rule**: New filter components must follow this hierarchy. Visual mode components go in `visual/` subdirectory.

---

## API Contract

### Catalog API (`GET /api/catalog`)

**Current parameters** (observed):
- `search`, `gemstoneTypes`, `colors`, `cuts`, `clarities`, `origins`
- `priceMin`, `priceMax`, `weightMin`, `weightMax`
- `inStockOnly`, `hasImages`, `hasCertification`, `hasAIAnalysis`
- `sortBy`, `sortDirection`, `page`, `pageSize`

**Planned parameters** (from contracts):
- `treatmentStatus` — comma-separated treatment values
- `miningCountries` — comma-separated country names
- `qualityClassifications` — comma-separated quality grades
- `hasColorChange` — boolean
- `minLength`, `maxLength`, `minWidth`, `maxWidth` — dimension ranges
- `minPricePerCarat`, `maxPricePerCarat` — price per carat range

### Search API (`POST /api/search`)

**Current body** (observed):
```typescript
{
  query?: string;
  page: number;
  pageSize: number;
  filters: SearchFilters;
  locale: string;
  searchDescriptions?: boolean;
}
```

**Planned**: `SearchFilters` type will be extended to match `AdvancedGemstoneFilters`

---

## Database Function Contract

### `get_catalog_filter_counts` RPC

**Current output** (observed):
```json
{
  "gemstoneTypes": { "ruby": 50, "sapphire": 30, ... },
  "colors": { "red": 40, "blue": 35, ... },
  "cuts": { "round": 60, "oval": 25, ... },
  "clarities": { "VS1": 45, "VS2": 40, ... },
  "origins": { "Myanmar": 20, "Colombia": 15, ... }
}
```

**Planned additions**:
```json
{
  "treatmentStatuses": { "natural": 100, "heated": 50, ... },
  "miningCountries": { "Russia": 30, "Colombia": 25, ... },
  "qualityClassifications": { "Г1": 10, "Г2": 15, ... }
}
```

---

## File Ownership Map

| File/Directory | Owner | Authority |
|----------------|-------|-----------|
| `src/features/gemstones/types/filter.types.ts` | Filter System | Type definitions |
| `src/features/gemstones/utils/filter-url.utils.ts` | Filter System | URL encoding |
| `src/features/gemstones/components/filters/` | Filter System | UI components |
| `src/app/api/catalog/route.ts` | API Layer | Query handling |
| `src/app/api/search/route.ts` | API Layer | Search handling |
| `src/messages/*/filters.json` | Localization | UI labels |
| `supabase/migrations/` | Database | Schema changes |

---

## Template Usage Notes

This interface document is for the Crystallique gemstone platform filter/search overhaul. All boundary changes must occur through contracts.

**Remember**: These boundaries prevent drift. If you need to change them, do it via a contract, not ad-hoc implementation.

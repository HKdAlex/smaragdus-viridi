# Interface Authority Boundaries (Contract-Governed)

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

All boundary changes must occur **only through contracts** in `docs/plan/01_contracts.md`.

---

## Authority Map (as stated in the vision)

The following statements are derived directly from the master vision document (`docs/plan/00_vision.md`) and must be treated as constraints until replaced by an explicit contract.

- **Database Schema authority**: **Supabase PostgreSQL**
  - All table structures, columns, types, and constraints are defined in Supabase
  - TypeScript types are generated from Supabase schema (derived, not authoritative)

- **Enum Values authority**: **Supabase Database Enums**
  - `gemstone_type`, `gem_color`, `gem_cut`, `gem_clarity` enums defined in database
  - Frontend enum arrays (`GEMSTONE_TYPES`, `GEM_COLORS`, etc.) derived from database

- **Translation authority**: **`src/messages/` JSON files**
  - EN translations in `src/messages/en/`
  - RU translations in `src/messages/ru/`
  - Components consume translations via `next-intl`

- **Admin Form authority**: **`src/features/admin/components/gemstone-form.tsx`**
  - Single source of truth for admin gemstone editing UI
  - Service layer in `src/features/admin/services/`

- **Consumer Filtering authority**: **Enum columns on `gemstones` table**
  - Consumer catalog filters use enum columns (`name`, `color`, `cut`, `clarity`)
  - Custom text columns are for admin display/entry, not consumer filtering

---

## Specific Authority Rules (Mandatory)

### Database Schema Authority

- **Authoritative**: Supabase PostgreSQL schema
- **Derived/consumer**: `src/shared/types/database.ts` (generated types)
- **Rule**: Agents must not manually edit `database.ts`. Run `npm run types:generate` after schema changes.

### Enum Values Authority

- **Authoritative**: Supabase database enum types
- **Derived/consumer**: `src/shared/services/database-enums.ts`, frontend components
- **Rule**: Agents must not add new enum values without a database migration. Frontend arrays are read-only reflections of database enums.

### Translation Authority

- **Authoritative**: `src/messages/en/*.json` and `src/messages/ru/*.json`
- **Derived/consumer**: React components via `useTranslations()` hook
- **Rule**: Agents must add translations to BOTH EN and RU files. Missing translations cause runtime warnings.

### Admin Form Authority

- **Authoritative**: `gemstone-form.tsx` component
- **Derived/consumer**: Admin dashboard, gemstone management pages
- **Rule**: All admin gemstone editing flows through this single form component. Do not create parallel editing interfaces.

### Consumer Filtering Authority

- **Authoritative**: Enum columns on `gemstones` table
- **Derived/consumer**: Catalog filter components, search API
- **Rule**: Consumer filtering must use enum columns, not custom text columns. Custom columns are for admin data entry and detail display only.

### Schema Ownership Rules

- **SSOT storage** lives in Supabase as described in `00_vision.md`.
- **Derived schemas** (TypeScript types, frontend interfaces) are explicitly derived and may be reshaped, but only via contracts.
- **Non-production reminder**: schema mutability is expected; preservation/backfill is out of scope. Documentation must not assume production constraints.

---

## Observed vs Planned: Documentation Rule (Mandatory)

When writing docs, PR descriptions, or new contracts:

- **Observed current state** must be tagged explicitly, e.g.:
  - "Observed (code): `gemstone-form.tsx` uses `<Select>` for name field"
  - "Observed (Supabase via MCP): `gemstones` table has 35 columns"
- **Planned / proposed** must be tagged explicitly, e.g.:
  - "Planned (vision): Add `name_custom` column for free-text entry"
  - "Proposed (contract draft): Replace Select with Input+autocomplete"
- If uncertain: state uncertainty; **do not guess**.

---

## What Cursor Agents Are NOT Allowed To Invent

Agents must not fabricate or silently assume:

- **New database columns** "because they probably exist." Verify via Supabase MCP tools.
- **New enum values** outside database enums. The enum arrays in `database-enums.ts` are derived from Supabase; do not add values there without a migration.
- **New translation keys** without adding to both EN and RU files. Missing translations cause runtime issues.
- **New admin form sections** without updating the single authoritative `gemstone-form.tsx` component.
- **Consumer filtering on custom columns**. Custom text columns are for admin entry, not consumer filtering.
- **Production safety constraints** (backfills, migrations, data retention guarantees). This is explicitly non-production; do not import production assumptions into plans or contracts.

If an implementation requires something not present, the correct action is:

- write a contract in `01_contracts.md`, and
- include reality-check requirements (including Supabase exploration if relevant).

---

## Interface Evolution (Contracts Only)

Interfaces (APIs, RPCs, tables, artifacts, JSON projections) may evolve **only** when an explicit contract:

- defines the new/changed interface surface,
- lists affected packages/systems,
- specifies invariants,
- specifies acceptance tests,
- and lists reality-check requirements validating current state before changes.

---

## Crystallique-Specific Boundaries

### Gemstone Data Flow

```
Admin Entry → gemstone-form.tsx → GemstoneAdminService → Supabase gemstones table
                                                              ↓
Consumer Display ← GemstoneDetail component ← API routes ← Supabase queries
                                                              ↓
Consumer Filtering ← Filter components ← Enum columns only (not custom columns)
```

### Column Naming Convention

- **Enum columns**: `name`, `color`, `cut`, `clarity` (constrained to enum values)
- **Custom columns**: `name_custom`, `color_custom`, etc. (free text, admin-entered)
- **AI columns**: `ai_color`, `ai_cut`, `ai_treatment`, etc. (AI-populated)

### Translation Key Convention

- Admin form labels: `admin.gemstoneForm.labels.*`
- Admin form placeholders: `admin.gemstoneForm.*Placeholder`
- Admin form sections: `admin.gemstoneForm.sections.*`

---

---

## Related Migrations

### Cuts Table Migration

The `gem_cut` enum is being migrated to a `cuts` reference table. During and after this migration:

- **Before migration**: `gem_cut` enum is authoritative for cut values
- **During migration**: Both enum and `cuts` table exist; dual-write to both
- **After migration**: `cuts` table is authoritative; enum is dropped

See `docs/plan/cuts-table-migration/02_interfaces.md` for migration-specific boundaries.

---

## Template Usage Notes

This interfaces document is customized for the Crystallique gemstone platform. All placeholders have been replaced with project-specific details.

**Remember**: These boundaries prevent drift. If you need to change them, do it via a contract, not ad-hoc implementation.

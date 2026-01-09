# Interface Authority Boundaries — Cuts Table Migration

## Non-Production / No-Backfill Assumption

- This project is **not in production**.
- Database schemas are **mutable**.
- No migration/backfill/data-preservation guarantees are required.

---

## Purpose

This document defines **authority boundaries** for the cuts table migration: which system is the source of truth for which decisions and artifacts.

All boundary changes must occur **only through contracts** in `docs/plan/cuts-table-migration/01_contracts.md`.

---

## Authority Map

### Before Migration (Current State)

| Artifact | Authority | Location |
|----------|-----------|----------|
| Cut values | `gem_cut` PostgreSQL ENUM | Supabase database |
| Cut translations | `gem_cut_translations` table | Supabase database |
| TypeScript type | `GemCut` derived from enum | `src/shared/types/database.ts` |
| Frontend array | `GEM_CUTS` hardcoded | `src/shared/services/database-enums.ts` |
| Filter options | `GEM_CUTS` array | Filter components |
| Admin form options | `GEM_CUTS` array | `gemstone-form.tsx` |

### After Migration (Target State)

| Artifact | Authority | Location |
|----------|-----------|----------|
| Cut values | `cuts` table | Supabase database |
| Cut translations | `cuts.name_en`, `cuts.name_ru` | Supabase database |
| TypeScript type | `Cut` from table | `src/shared/types/database.ts` |
| Frontend data | `CutsService` query | `src/shared/services/cuts-service.ts` |
| Filter options | `CutsService.getAllCuts()` | Filter components |
| Admin form options | `CutsService.getAllCuts()` | `gemstone-form.tsx` |

---

## Specific Authority Rules

### Database Schema Authority

- **Before**: `gem_cut` ENUM is authoritative for valid cut values
- **After**: `cuts` table is authoritative for valid cut values
- **Transition**: Both exist during migration; `cuts` table becomes authoritative after CUT-C2.3

### Translation Authority

- **Before**: `gem_cut_translations` table
- **After**: `cuts.name_en`, `cuts.name_ru` columns
- **Rule**: After migration, translations are inline in `cuts` table

### TypeScript Type Authority

- **Before**: `GemCut` type derived from enum
- **After**: `Cut` type derived from `cuts` table
- **Rule**: Run `npm run types:generate` after schema changes

### Frontend Data Authority

- **Before**: `GEM_CUTS` hardcoded array
- **After**: `CutsService` fetches from database
- **Rule**: No hardcoded cut values in frontend after migration

### Gemstone-Cut Relationship

- **Before**: `gemstones.cut` (enum column)
- **After**: `gemstones.cut_id` (FK to `cuts.id`)
- **Transition**: Both columns exist during migration; `cut_id` becomes authoritative after CUT-C2.3

---

## Data Flow Diagrams

### Before Migration

```
Admin Form → GEM_CUTS array → gemstones.cut (enum)
                                    ↓
Consumer Display ← gem_cut_translations ← gemstones.cut
                                    ↓
Consumer Filtering ← GEM_CUTS array ← gemstones.cut
```

### After Migration

```
Admin Form → CutsService → cuts table → gemstones.cut_id (FK)
                              ↓
Consumer Display ← cuts.name_en/name_ru ← JOIN on cut_id
                              ↓
Consumer Filtering ← CutsService → cuts.code
```

---

## What Agents Must NOT Do

### During Migration

1. **Do not remove enum before all code migrated**: The enum must remain until all application code uses `cut_id`
2. **Do not skip dual-write phase**: During transition, write to both `cut` enum and `cut_id` FK
3. **Do not hardcode new cuts**: New cuts must be added to `cuts` table, not code
4. **Do not modify `GEM_CUTS` array**: It will be removed, not extended

### After Migration

1. **Do not reference `gem_cut` enum**: It no longer exists
2. **Do not use `GEM_CUTS` array**: It no longer exists
3. **Do not add cuts via code**: Use database inserts
4. **Do not create parallel cut systems**: Single source of truth is `cuts` table

---

## Interface Contracts

### `CutsService` Interface

```typescript
interface CutsService {
  // Get all active cuts, cached
  getAllCuts(): Promise<Cut[]>;
  
  // Get cut by code
  getCutByCode(code: string): Promise<Cut | null>;
  
  // Get cut by ID
  getCutById(id: string): Promise<Cut | null>;
  
  // Invalidate cache (after admin adds new cut)
  invalidateCache(): void;
}
```

### `Cut` Type

```typescript
interface Cut {
  id: string;           // UUID
  code: string;         // e.g., "round", "marquise"
  name_en: string;      // English display name
  name_ru: string;      // Russian display name
  description_en?: string;
  description_ru?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Filter Interface

```typescript
interface CutFilter {
  // Use cut codes for URL params (backward compatible)
  cut: string[];  // e.g., ["round", "oval"]
}
```

---

## Backward Compatibility

### URL Parameters

- Filter URLs use `cut=round,oval` format
- This remains unchanged (uses `cuts.code`)
- No URL migration needed

### API Responses

- Gemstone API returns `cut` field with code value
- Add `cut_name` field with translated name
- Existing clients continue to work

### Database Queries

- `cut_code` column maintained for search vectors
- Populated via trigger from `cuts.code`
- Search functions continue to work

---

## Migration Checkpoints

### Checkpoint 1: Database Ready (after CUT-C0.4)

- [ ] `cuts` table exists with all data
- [ ] `cut_id` column exists on `gemstones`
- [ ] All gemstones have `cut_id` populated

### Checkpoint 2: Application Migrated (after CUT-C1.5)

- [ ] All components use `CutsService`
- [ ] All components use `cut_id` for relationships
- [ ] Dual-write active (both enum and FK)

### Checkpoint 3: Database Cleaned (after CUT-C2.3)

- [ ] `cut_id` is NOT NULL
- [ ] `gem_cut` enum dropped
- [ ] `gem_cut_translations` table dropped

### Checkpoint 4: Code Cleaned (after CUT-C3.1)

- [ ] No `GemCut` type references
- [ ] No `GEM_CUTS` array references
- [ ] No dual-write code

---

## Template Usage Notes

This interfaces document is for the Crystallique cuts table migration. All boundary changes must occur through contracts.

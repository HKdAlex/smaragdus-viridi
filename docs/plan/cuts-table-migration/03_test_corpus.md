# Golden Test Corpus — Cuts Table Migration

## Non-Production / No-Backfill Assumption

- This project is **not in production**.
- Corpus changes do not imply production data constraints.
- The corpus exists to prevent **semantic drift** during migration.

---

## Purpose

The golden corpus validates that the cuts table migration:

1. Preserves existing functionality
2. Maintains data integrity
3. Supports new extensibility requirements
4. Does not break consumer-facing features

---

## Corpus Categories

### Migration Integrity Cases

Purpose: Validate data is correctly migrated from enum to table.

| ID | Input | Expected Result |
|----|-------|-----------------|
| `mig-001` | Gemstone with `cut = 'round'` | `cut_id` points to `cuts` row with `code = 'round'` |
| `mig-002` | Gemstone with `cut = 'marquise'` | `cut_id` points to `cuts` row with `code = 'marquise'` |
| `mig-003` | All 18 enum values | Each has corresponding `cuts` table row |

### Translation Cases

Purpose: Validate translations work correctly from new table.

| ID | Input | Expected Result |
|----|-------|-----------------|
| `trans-001` | `translateCut('round', 'en')` | Returns "Round Brilliant" |
| `trans-002` | `translateCut('round', 'ru')` | Returns "Круглая" |
| `trans-003` | `translateCut('marquise', 'en')` | Returns "Marquise" |
| `trans-004` | `translateCut('marquise', 'ru')` | Returns "Маркиз" |
| `trans-005` | `translateCut('new_custom', 'en')` | Returns custom name from `cuts` table |

### Filter Cases

Purpose: Validate filtering works with new table.

| ID | Input | Expected Result |
|----|-------|-----------------|
| `filter-001` | Filter by `cut=round` | Returns gemstones with round cut |
| `filter-002` | Filter by `cut=round,oval` | Returns gemstones with round OR oval cut |
| `filter-003` | Filter by new custom cut | Returns gemstones with that cut |
| `filter-004` | Clear cut filter | Returns all gemstones |

### Admin Form Cases

Purpose: Validate admin form works with new table.

| ID | Input | Expected Result |
|----|-------|-----------------|
| `admin-001` | Select "Round Brilliant" from dropdown | `cut_id` set to round cut ID |
| `admin-002` | Type custom cut "Маркиза2" | `cut_custom` set, `cut_id` null or default |
| `admin-003` | Edit existing gemstone | Correct cut loaded in form |
| `admin-004` | Save gemstone | `cut_id` persisted correctly |

### Consumer Display Cases

Purpose: Validate consumer pages display cuts correctly.

| ID | Input | Expected Result |
|----|-------|-----------------|
| `display-001` | View gemstone detail (EN) | Cut shows English name |
| `display-002` | View gemstone detail (RU) | Cut shows Russian name |
| `display-003` | View gemstone card | Cut icon and name display |
| `display-004` | View cart item | Cut name displays |

### Extensibility Cases

Purpose: Validate new cuts can be added without code changes.

| ID | Input | Expected Result |
|----|-------|-----------------|
| `ext-001` | Insert new cut into `cuts` table | Cut appears in admin dropdown |
| `ext-002` | Insert new cut into `cuts` table | Cut appears in filter options |
| `ext-003` | Create gemstone with new cut | Gemstone saves correctly |
| `ext-004` | Search for new cut name | Gemstone found |

### Backward Compatibility Cases

Purpose: Validate existing functionality not broken.

| ID | Input | Expected Result |
|----|-------|-----------------|
| `compat-001` | Existing gemstone created before migration | Displays correctly |
| `compat-002` | URL with `?cut=round` | Filter works |
| `compat-003` | API response | Contains cut information |
| `compat-004` | Search by cut name | Works for all cuts |

---

## Corpus Entries by Contract

### CUT-C0.4 — Backfill Verification

**File**: `tests/corpus/cut-c0.4-backfill.json`

**Purpose**: Validate all gemstones have correct `cut_id` after backfill.

**Entries**:
1. Sample gemstone with each of 18 enum values
2. Verify `cut_id` matches `cuts.code`

---

### CUT-C1.1 — TypeScript Types

**File**: `tests/corpus/cut-c1.1-types.json`

**Purpose**: Validate types compile and work correctly.

**Entries**:
1. `Cut` type matches table schema
2. `CutsService` returns correct data

---

### CUT-C1.2 — Admin Form

**File**: `tests/corpus/cut-c1.2-admin-form.json`

**Purpose**: Validate admin form works with new table.

**Entries**:
1. Dropdown shows all cuts
2. Selection saves correctly
3. Edit loads correctly

---

### CUT-C1.3 — Filters

**File**: `tests/corpus/cut-c1.3-filters.json`

**Purpose**: Validate filter components work with new table.

**Entries**:
1. Filter dropdown shows all cuts
2. Selection filters correctly
3. URL params work

---

### CUT-C3.1 — Code Cleanup

**File**: `tests/corpus/cut-c3.1-cleanup.json`

**Purpose**: Validate no deprecated code remains.

**Entries**:
1. No `GemCut` references
2. No `GEM_CUTS` references
3. No `gem_cut` enum references

---

## Verification Queries

### Migration Integrity

```sql
-- All gemstones have cut_id
SELECT COUNT(*) FROM gemstones WHERE cut_id IS NULL;
-- Expected: 0

-- All cut_id values are valid
SELECT COUNT(*) FROM gemstones g
LEFT JOIN cuts c ON g.cut_id = c.id
WHERE c.id IS NULL AND g.cut_id IS NOT NULL;
-- Expected: 0

-- All enum values have cuts rows
SELECT DISTINCT cut::text FROM gemstones
EXCEPT
SELECT code FROM cuts;
-- Expected: empty result
```

### Translation Integrity

```sql
-- All cuts have EN translations
SELECT COUNT(*) FROM cuts WHERE name_en IS NULL OR name_en = '';
-- Expected: 0

-- All cuts have RU translations
SELECT COUNT(*) FROM cuts WHERE name_ru IS NULL OR name_ru = '';
-- Expected: 0
```

### Extensibility Test

```sql
-- Add new cut
INSERT INTO cuts (code, name_en, name_ru, display_order)
VALUES ('test_cut', 'Test Cut', 'Тестовая огранка', 99);

-- Verify appears in queries
SELECT * FROM cuts WHERE code = 'test_cut';
-- Expected: 1 row

-- Clean up
DELETE FROM cuts WHERE code = 'test_cut';
```

---

## Rules for Corpus Updates

1. **Contract-driven**: Every entry must reference a contract ID
2. **Minimal but sufficient**: Smallest sample that validates behavior
3. **No speculation**: If behavior uncertain, add reality-check to contract
4. **Update in lockstep**: When contract changes behavior, update corpus

---

## Template Usage Notes

This test corpus is for the Crystallique cuts table migration. Add entries when contracts require them, update them only when contracts change behavior.

# Phase 2 Migration Notes

## Issue: Enum Columns in Full-Text Search

**Problem:** The `gemstones` table uses PostgreSQL ENUMs for several columns:

- `name` → `gemstone_type` enum (diamond, ruby, etc.)
- `color` → `gem_color` enum
- `cut` → `gem_cut` enum
- `clarity` → `gem_clarity` enum

**Challenge:** GIN indexes require IMMUTABLE functions, but enum-to-text casts are not immutable.

## Solution

### Approach 1: Use Text Columns Only (CURRENT)

Only index truly text columns in full-text search:

- `serial_number` (text) ✅
- `description` (text) ✅

For enum columns, we'll handle search differently:

- Use exact match filters in WHERE clause
- Use separate trigram indexes on text-cast enums (not in main GIN index)

### Approach 2: Create Materialized View (FUTURE)

If needed, create a materialized view with text-cast columns for full-text search.

---

**Decision:** Using Approach 1 for Phase 2.

**Status:** Applying simplified migration now...

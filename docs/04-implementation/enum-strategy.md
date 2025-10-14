# Enum Strategy

## Current Approach: Hybrid System

We use a **hybrid approach** combining enums with flexible code columns and translation tables.

### Architecture

```sql
-- Gemstones table has BOTH:
name gemstone_type NOT NULL  -- Enum for type safety & constraints
type_code text NOT NULL       -- Flexible string for translations

color gem_color NOT NULL      -- Enum for type safety & constraints
color_code text NOT NULL      -- Flexible string for translations

-- Similar for cut and clarity
```

### Components

1. **Database Enums** (`gemstone_type`, `gem_color`, `gem_cut`, `gem_clarity`)

   - Provide database-level constraints
   - Ensure data integrity
   - Fast comparisons and indexing

2. **Code Columns** (`type_code`, `color_code`, `cut_code`, `clarity_code`)

   - Flexible text fields
   - Act as keys for translation lookups
   - Allow future extensibility without migrations

3. **Translation Tables**
   - `gemstone_type_translations`
   - `gem_color_translations`
   - `gem_cut_translations`
   - `gem_clarity_translations`
   - Provide multilingual display names

### Benefits

✅ **Type Safety**: TypeScript enums provide compile-time checks
✅ **Database Constraints**: Enums ensure data integrity at DB level
✅ **Backward Compatibility**: Existing queries and APIs continue to work
✅ **Performance**: Enum comparisons are fast
✅ **Flexibility**: Can add translations without schema changes
✅ **Internationalization**: Full multilingual support via translation tables

### Timeline

**Current (2025)**: Keep hybrid system

- System is working well
- Manageable number of types (~20)
- No performance issues

**Review Period (2026-2027)**: Monitor and evaluate

- Track frequency of new type additions
- Measure maintenance burden
- Assess performance at scale

**Decision Criteria for Deprecation**:

- Adding >5 new types per month, OR
- Enum grows to >50 values, OR
- Enum management becomes significant bottleneck

### Migration Path (If Needed)

If enums become a burden, follow this safe migration:

**Phase 1**: Current (✅ Done)

```sql
name gemstone_type NOT NULL
type_code text NOT NULL
```

**Phase 2**: Make enum nullable

```sql
name gemstone_type NULL      -- Make optional
type_code text NOT NULL       -- Becomes primary
```

**Phase 3**: Drop enum

```sql
ALTER TABLE gemstones DROP COLUMN name;
ALTER TABLE gemstones RENAME COLUMN type_code TO name;
DROP TYPE gemstone_type;
```

### Recommendation

**Keep enums for now.** The hybrid approach provides the best of both worlds:

- Type safety and constraints from enums
- Flexibility and internationalization from code columns
- No urgent need to change

Only revisit if the system's needs change significantly.

## Related Documents

- Database Schema: `docs/03-architecture/database-schema.md`
- Translation System: `docs/04-implementation/multilingual-support.md`
- Migration Files:
  - `migrations/20251015_create_translation_tables.sql`
  - `migrations/20251015_add_multilingual_search.sql`

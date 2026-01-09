# Cuts Table Migration — Agent Session Prompt

> **Copy the content below this line to start a new session on cuts table migration work.**

---

## Role

You are an implementation agent working on the **Cuts Table Migration** for the Crystallique project. Your task is to migrate the `gem_cut` PostgreSQL ENUM to a proper `cuts` reference table, enabling administrators to add new cut types without database migrations.

## Orientation — Read These Files First

Before taking any action, read and understand the current state:

1. **Vision (architectural intent, non-executable)**:
   - `docs/plan/cuts-table-migration/00_vision.md`

2. **Contracts (executable planning surface)**:
   - `docs/plan/cuts-table-migration/01_contracts.md`
   - Find contracts by status: `draft`, `ready`, `in-progress`, `blocked`, `done`
   - Follow the **Agent Workflow Rules** section

3. **Interface boundaries**:
   - `docs/plan/cuts-table-migration/02_interfaces.md`

4. **Test corpus**:
   - `docs/plan/cuts-table-migration/03_test_corpus.md`

5. **Current implementation**:
   - `src/shared/services/database-enums.ts` (current `GEM_CUTS` array)
   - `src/shared/types/database.ts` (current `GemCut` type)
   - `src/features/translations/services/translation.service.ts` (current translation)

## Workflow

### 1. Assess Current State

After reading the contracts file, determine:
- Which contracts are `done`?
- Which contract is `in-progress`? (There should be at most one)
- What is the next `ready` or `draft` contract based on dependencies?

### 2. Select Work

Choose ONE of these modes based on current state:

**Mode A: Continue In-Progress Contract**
- If a contract is `in-progress`, continue working on it
- Check which acceptance tests are already `[x]` vs `[ ]`
- Complete remaining tests

**Mode B: Start Next Contract**
- If no contract is `in-progress`, find the next one that:
  - Has all dependencies `done`
  - Is `ready` or `draft` status
- Update its status to `in-progress`
- Run reality checks first

**Mode C: Verify Completed Work**
- If asked to verify, check all `[x]` acceptance tests are actually passing
- Update status to `done` if verified
- Check what contracts are now unblocked

### 3. Execute Contract

Follow the **Agent Workflow Rules**:

```
BEFORE: Read contract → Update status → Verify deps → Run reality checks
DURING: Work incrementally → Build frequently → Check off tests → Document blockers  
AFTER:  Build without errors → Verify all tests → Update status → Commit to git
```

### 4. Phase-Specific Workflows

#### Phase 0: Database Preparation

```bash
# Create migration file
# Apply via Supabase MCP tools
# Verify via Supabase MCP tools
# Regenerate types: npm run types:generate
# Build: npm run build
```

#### Phase 1: Application Migration

```bash
# Update TypeScript files
# Update components
# Test in browser
# Build: npm run build
# Commit changes
```

#### Phase 2: Database Cleanup

```bash
# Verify all application code migrated
# Create cleanup migration
# Apply migration
# Verify no breakage
# Build: npm run build
```

#### Phase 3: Code Cleanup

```bash
# Remove deprecated code
# Grep to verify no references remain
# Build: npm run build
# Run tests
# Commit changes
```

### 5. Key Commands

```bash
# Type generation
npm run types:generate

# Build verification
npm run build

# Search for enum references
grep -r "GemCut" src/
grep -r "GEM_CUTS" src/
grep -r "gem_cut" src/

# Run tests
npm test
```

### 6. Supabase MCP Tools

```
list_tables          -- List all tables
get_table_schema     -- Get column details
execute_sql          -- Run SQL queries
apply_migration      -- Apply migration file
```

## Contract Phases Overview

| Phase | Contracts | Type |
|-------|-----------|------|
| **Phase 0** | CUT-C0.1 through CUT-C0.4 | Database preparation |
| **Phase 1** | CUT-C1.1 through CUT-C1.5 | Application migration |
| **Phase 2** | CUT-C2.1 through CUT-C2.3 | Database cleanup |
| **Phase 3** | CUT-C3.1, CUT-C3.2 | Code cleanup |

## Key Files to Modify

### Phase 0 (Database)

- `supabase/migrations/` — New migration files

### Phase 1 (Application)

- `src/shared/types/database.ts` — Regenerate
- `src/shared/types/index.ts` — Add `Cut` type
- `src/shared/services/cuts-service.ts` — New service
- `src/features/admin/components/gemstone-form.tsx` — Update form
- `src/features/gemstones/components/filters/*.tsx` — Update filters
- `src/features/translations/services/translation.service.ts` — Update translations
- `src/features/gemstones/components/*.tsx` — Update display

### Phase 2 (Database Cleanup)

- `supabase/migrations/` — Cleanup migrations

### Phase 3 (Code Cleanup)

- `src/shared/services/database-enums.ts` — Remove `GEM_CUTS`
- `src/lib/validators/enum-parser.ts` — Remove enum validation
- All files with `GemCut` or `GEM_CUTS` references

## Important Rules

1. **Never skip dual-write phase** — Write to both enum and FK during transition
2. **Verify before cleanup** — All code must use new system before dropping enum
3. **Test extensively** — Filtering, search, display, admin form
4. **One contract at a time** — Complete before starting another
5. **Update documents** — Keep contracts in sync with reality

## Quick Start

Tell me:
- "Continue where we left off" — I'll check for `in-progress` contracts
- "Start the next contract" — I'll find the next ready contract
- "Verify contract CUT-C[X.Y]" — I'll check if it's complete
- "What's the current status?" — I'll summarize all contract statuses

## Verification Checklist

**After database changes**:
- [ ] Migration applied successfully
- [ ] Types regenerated
- [ ] Build passes

**After application changes**:
- [ ] Admin form works
- [ ] Filters work
- [ ] Consumer display works
- [ ] Translations work
- [ ] Build passes

**After cleanup**:
- [ ] No enum references in code
- [ ] All tests pass
- [ ] Build passes

## Files Inventory (200+ References)

The `gem_cut` enum is referenced in 46 files with 200+ occurrences. Key files:

| File | References | Priority |
|------|------------|----------|
| `database-enums.ts` | 11 | Critical |
| `gemstone-form.tsx` | 25 | Critical |
| `database.ts` | 26 | Critical |
| `enum-parser.ts` | 10 | High |
| `filter.types.ts` | 6 | High |
| `translation.service.ts` | 5 | High |
| Filter components | ~10 | Medium |
| Display components | ~15 | Medium |
| Other | ~90 | Low |

---

## Template Usage Notes

This agent prompt is for the Crystallique cuts table migration. Follow contracts, verify via browser, commit after completion.

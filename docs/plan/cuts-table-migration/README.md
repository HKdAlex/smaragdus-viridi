# Documentation Spine: Cuts Table Migration

## Non-Production / No-Backfill Assumption (Read First)

- This project is **not in production**.
- Database schemas are **mutable**.
- **No backfilling, migrations, or data preservation guarantees are required.**

## Document Map (Authority)

### Executable (the only implementation planning surfaces)

- `01_contracts.md`
  - Defines what a contract is and the required contract template.
  - All implementation work must be driven by explicit contracts.

### Contextual (non-executable constraints and rationale)

- `00_vision.md`
  - Preserves the master architecture plan for cuts table migration.
  - Must not be executed as a checklist.

- `02_interfaces.md`
  - Defines interface authority boundaries during and after migration.
  - Interfaces evolve only through contracts.

- `03_test_corpus.md`
  - Defines the golden corpus strategy to prevent semantic drift during migration.

### Agent Onboarding

- `AGENT_PROMPT.md`
  - Agent onboarding prompt for cuts table migration.
  - Copy this to start a new agent session.

## Migration Summary

### Problem

The `gem_cut` PostgreSQL ENUM type requires database migrations to add new cut types. This is inflexible for a gemstone platform where administrators need to add custom cuts (e.g., "Маркиза2", "Modified Brilliant") without developer intervention.

### Solution

Migrate from `gem_cut` ENUM to a `cuts` reference table:

1. **Create `cuts` table** with inline EN/RU translations
2. **Add `cut_id` FK** to `gemstones` table
3. **Migrate application code** to use new table
4. **Drop enum** after all code migrated
5. **Clean up** deprecated code

### Benefits

- Administrators can add new cuts via database insert
- No code deployment required for new cuts
- Consistent with `origins` table pattern
- Better localization support

## Contract Overview

| Phase | Contracts | Description |
|-------|-----------|-------------|
| **Phase 0** | CUT-C0.1 — CUT-C0.4 | Database preparation (create table, seed, add FK, backfill) |
| **Phase 1** | CUT-C1.1 — CUT-C1.5 | Application migration (types, form, filters, translations, display) |
| **Phase 2** | CUT-C2.1 — CUT-C2.3 | Database cleanup (views, functions, drop enum) |
| **Phase 3** | CUT-C3.1 — CUT-C3.2 | Code cleanup (remove deprecated code, final verification) |

**Total**: 14 contracts

## Quick Start

1. Read `AGENT_PROMPT.md` for session setup
2. Check `01_contracts.md` for current contract statuses
3. Find the next contract to work on (first `draft` or `ready` with dependencies met)
4. Execute the contract following the workflow rules
5. Commit and update status when complete

## Key Metrics

- **Files affected**: 46+ files
- **Code references**: 200+ occurrences of `gem_cut`/`GemCut`/`GEM_CUTS`
- **Enum values**: 18 cut types to migrate
- **Estimated effort**: 14 contracts across 4 phases

## Relationship to Flexible Fields Feature

This migration is part of the larger **Flexible Gemstone Property Entry** feature:

- `docs/plan/` — Parent feature (FLEX-* contracts)
- `docs/plan/cuts-table-migration/` — This migration (CUT-* contracts)

The cuts table migration enables the extensibility goal from the parent feature: administrators can add new cut types without code changes.

## Tools Available

- **Supabase MCP**: Database operations, schema inspection, migrations
- **Browser MCP**: UI verification, form testing
- **Standard tools**: File editing, shell commands, grep/search

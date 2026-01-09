# Documentation Spine: Crystallique Flexible Fields

## Non-Production / No-Backfill Assumption (Read First)

- This project is **not in production**.
- Database schemas are **mutable**.
- Tables/columns/rows may be dropped or reshaped freely in the future.
- **No backfilling, migrations, or data preservation guarantees are required.**
- Historical data safety is explicitly **out of scope**.

## Document Map (Authority)

### Executable (the only implementation planning surfaces)

- `01_contracts.md`
  - Defines what a contract is and the required contract template.
  - All implementation work must be driven by explicit contracts.

### Contextual (non-executable constraints and rationale)

- `00_vision.md`
  - Preserves the master architecture plan.
  - Must not be executed as a checklist.

- `02_interfaces.md`
  - Defines interface authority boundaries and what agents must not invent.
  - Interfaces evolve only through contracts.

- `03_test_corpus.md`
  - Defines the golden corpus strategy and update rules to prevent semantic drift.

### Agent Onboarding

- `AGENT_PROMPT.md`
  - Agent onboarding prompt for this project.
  - Copy this to start a new agent session.

## Agent Operating Rules (Mandatory)

### Contract discipline

- **One contract per PR**: do not mix unrelated work across contracts.
- **No work from `00_vision.md` directly**: agents must not convert vision phases into implicit tasks.
- **Explicit non-goals required**: each contract must say what it will not do.

### Tests before implementation

- **Acceptance tests are mandatory**: every contract must define acceptance tests before any implementation is attempted.
- **Golden corpus first** when behavior is semantic: add or update corpus entries as part of the contract.

### Mandatory reality checks

- Before asserting "X exists," the agent must verify it.
- If uncertainty exists, the agent must state uncertainty explicitly, avoid guessing, add reality-check requirements to the contract, and block execution until verified.

### No production safety assumptions

- Do not assume migrations/backfills, long-lived data preservation, uptime/rollback constraints, or compatibility guarantees.
- If production constraints later become relevant, they must be introduced explicitly via contracts.

## If You Are Implementing Work

1. Start from `01_contracts.md`.
2. Create or update a contract that is scoped, testable, and reality-checked.
3. Use `02_interfaces.md` to avoid inventing interfaces or moving authority boundaries.
4. Use `03_test_corpus.md` to prevent semantic drift.
5. Follow `AGENT_PROMPT.md` for workflow guidance.

## Feature Summary

This planning harness covers the **Flexible Gemstone Property Entry** feature for Crystallique:

**Problem**: Administrators cannot freely describe gemstone properties because the admin form uses strict dropdown selections bound to database enums. Different gemstone types (diamonds, emeralds, alexandrites) use completely different classification systems that cannot be captured by a single set of dropdown options.

**Solution**: Add flexible text input fields alongside existing enum columns, allowing administrators to:
- Enter custom gemstone names, colors, cuts, and clarity descriptions
- Record treatment status, color change effects, and enhancement details
- Specify mining country and cutting country separately
- Use appropriate quality classification systems for each stone type

**Contracts**:
| ID | Description | Status |
|----|-------------|--------|
| FLEX-C0.1 | Database schema extension (10 new columns) | done |
| FLEX-C0.2 | TypeScript types regeneration | done |
| FLEX-C1.1 | Flexible name field in admin form | done |
| FLEX-C1.2 | Flexible color field in admin form | done |
| FLEX-C1.3 | Flexible cut field in admin form | done |
| FLEX-C1.4 | Flexible clarity field in admin form | done |
| FLEX-C1.5 | New detailed properties section | done |
| FLEX-C2.1 | Admin EN/RU translations | done |
| FLEX-C3.1 | Consumer professional specs section | done |
| FLEX-C3.2 | Consumer treatment/enhancement display | done |
| FLEX-C3.3 | Consumer EN/RU translations | done |

---

## Related Migrations

### Cuts Table Migration

**Location**: `docs/plan/cuts-table-migration/`

**Problem**: The `gem_cut` PostgreSQL ENUM requires database migrations to add new cut types. This is inflexible for administrators who need to add custom cuts without developer intervention.

**Solution**: Migrate from `gem_cut` ENUM to a `cuts` reference table with inline translations.

**Contracts**:
| ID | Description | Status |
|----|-------------|--------|
| CUT-C0.1 | Create cuts table | draft |
| CUT-C0.2 | Seed cuts data | draft |
| CUT-C0.3 | Add cut_id column | draft |
| CUT-C0.4 | Backfill cut_id | draft |
| CUT-C1.1 | TypeScript types | draft |
| CUT-C1.2 | Admin form | draft |
| CUT-C1.3 | Filter components | draft |
| CUT-C1.4 | Translation service | draft |
| CUT-C1.5 | Consumer display | draft |
| CUT-C2.1 | Database views | draft |
| CUT-C2.2 | Search functions | draft |
| CUT-C2.3 | Drop enum | draft |
| CUT-C3.1 | Remove deprecated code | draft |
| CUT-C3.2 | Final verification | draft |

**See**: `docs/plan/cuts-table-migration/README.md` for full details

## Quick Start

1. Read `AGENT_PROMPT.md` for session setup
2. Check `01_contracts.md` for current contract statuses
3. Find the next contract to work on (first `draft` or `ready` with dependencies met)
4. Execute the contract following the workflow rules
5. Commit and update status when complete

## Tools Available

- **Supabase MCP**: Database operations, schema inspection, migrations
- **Browser MCP**: UI verification, form testing
- **Standard tools**: File editing, shell commands, grep/search

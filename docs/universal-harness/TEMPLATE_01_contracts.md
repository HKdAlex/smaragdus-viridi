# Contracts (Executable Planning Surface)

## Non-Production / No-Backfill Assumption (Applies to All Contracts)

- This project is **not in production**.
- Database schemas are **mutable**.
- Tables/columns/rows may be dropped or reshaped in the future.
- **No backfilling, migrations, or data preservation guarantees are required.**
- Historical data safety is explicitly **out of scope**.

If a contract touches [STORAGE_SYSTEM], it must state its assumptions and explicitly confirm observed current state via [EXPLORATION_METHOD].

---

## Definition: Contract

A **Contract** is the smallest unit of executable implementation planning in this repo.

- A contract is **scoped**: it defines exactly what will change and what will not.
- A contract is **testable**: it defines acceptance tests that must pass.
- A contract is **reality-checked**: it lists what must be verified in the current system (code, artifacts, [STORAGE_SYSTEM] schema) before work begins.
- A contract is **the only allowed execution surface**: agents must not derive work directly from `00_vision.md`.

---

## Contract Template (Required Sections)

Copy this template for each new contract.

### Contract ID

- **ID**: `[PREFIX]-C[X].[Y]` (e.g., `PROJ-C1.1`, `FEAT-C2.3`)
- **Status**: `TODO` (draft | ready | in-progress | blocked | done)
- **Origin (Vision Reference)**: `TODO` (must reference a specific heading in `docs/plan/00_vision.md`)

### Scope

- **In scope**: `TODO`
- **Out of scope**: `TODO`

### Affected Packages / Systems

- **Packages/systems**: `TODO` (e.g., `packages/core`, `packages/api`, `frontend/`)

### Public Artifacts (APIs, tables, files, RPCs)

List only externally-consumed or contract-visible artifacts.

- **APIs**: `TODO`
- **Tables / views**: `TODO`
- **RPCs**: `TODO`
- **Files / artifacts**: `TODO` (e.g., "generated JSON artifact", "golden corpus entry")

### Invariants

State properties that must remain true after implementation.

- `TODO`

### Acceptance Tests

State the tests that demonstrate the contract is fulfilled.

- `TODO`

### Explicit Non-Goals

State what the work must not attempt to do.

- `TODO`

### Reality-Check Requirements

List required verification steps. If a claim cannot be verified, it must be marked as uncertain and the contract must be blocked until clarified.

- **Codebase checks**: `TODO`
- **[STORAGE_SYSTEM] checks** (if applicable): `TODO`
- **Artifact checks**: `TODO`

---

## Agent Workflow Rules

### Before Starting a Contract

1. **Read the contract completely**
2. **Update status to `in-progress`** (if not already)
3. **Verify dependencies**: Ensure all prerequisite contracts are `done`
4. **Run reality checks**: Execute all reality-check requirements and document findings
5. **Block if uncertain**: If reality checks reveal uncertainty, mark contract as `blocked` and document why

### During Contract Execution

1. **Work incrementally**: Make small, testable changes
2. **Build frequently**: Run build/compile commands after significant changes to catch errors early
3. **Check off tests**: Mark acceptance tests as `[x]` as you complete them
4. **Document blockers**: If you encounter issues, document them in the contract
5. **Update status**: Keep status current (`in-progress`, `blocked`, etc.)

### After Completing a Contract

1. **Verify all tests**: Ensure all acceptance tests are `[x]` and actually passing
2. **Build verification (MANDATORY)**: Run project build/compile to verify no errors
3. **Update status to `ready` or `done`**: Only after all tests pass, build succeeds, and work is verified
4. **Git commit (MANDATORY)**: Commit all changes with a descriptive commit message
5. **Check dependencies**: See if any `blocked` contracts can now be `ready`

### Status Transitions

- `draft` → `ready`: Contract is reviewed and dependencies are met
- `ready` → `in-progress`: Work has started
- `in-progress` → `blocked`: Blocked on dependency or uncertainty
- `in-progress` → `ready`: All tests pass, build succeeds, work verified, committed to git
- `blocked` → `ready`: Dependency resolved or uncertainty clarified

**Important**: A contract may only transition to `ready` after:
1. All acceptance tests are `[x]` and verified
2. Project builds/compiles without errors
3. All changes are committed to git

---

## Implementation Order

Contracts should be listed in dependency order. Use this section to guide execution:

1. **[CONTRACT-ID-1]**: [Brief description] — Prerequisites: [none | CONTRACT-ID-X]
2. **[CONTRACT-ID-2]**: [Brief description] — Prerequisites: [CONTRACT-ID-1]
3. **[CONTRACT-ID-3]**: [Brief description] — Prerequisites: [CONTRACT-ID-1, CONTRACT-ID-2]

---

## Example Contract

### C1.1 — Example Contract Name

- **ID**: `C1.1`
- **Status**: `draft`
- **Origin (Vision Reference)**: `docs/plan/00_vision.md` → "### 1.1 Example task name"

#### Scope

- **In scope**:
  - [What will be implemented]
  - [What will be created]

- **Out of scope**:
  - [What will NOT be done]
  - [What is deferred]

#### Affected Packages / Systems

- `packages/example/` (new functionality)
- `frontend/components/` (UI updates)

#### Public Artifacts (APIs, tables, files, RPCs)

- **APIs**: `POST /api/example` (new endpoint)
- **Tables / views**: `example_table` (new table)
- **RPCs**: None
- **Files / artifacts**: `packages/example/src/example.py` (new file)

#### Invariants

1. **Property 1**: [What must remain true]
2. **Property 2**: [What must remain true]

#### Acceptance Tests

1. **Unit test**: [Test description] - `[ ]` or `[x]`
2. **Integration test**: [Test description] - `[ ]` or `[x]`
3. **Manual test**: [Test description] - `[ ]` or `[x]`

#### Explicit Non-Goals

- Do not implement [feature X] (deferred to C1.2)
- Do not modify [system Y] (out of scope)

#### Reality-Check Requirements

- **Codebase checks**: COMPLETED
  - [Finding 1] - VERIFIED
  - [Finding 2] - VERIFIED
- **[STORAGE_SYSTEM] checks**: COMPLETED
  - [Finding 1] - VERIFIED via [method]
- **Artifact checks**: [Status]

---

## Contract Status Summary

| Contract ID | Status | Dependencies | Notes |
|------------|--------|--------------|-------|
| C1.1 | `draft` | None | Example contract |
| C1.2 | `blocked` | C1.1 | Waiting on C1.1 |

---

## Template Usage Notes

When creating a new contract:

1. **Use the template**: Copy the full template structure
2. **Fill all sections**: Every section is required
3. **Be specific**: Vague contracts lead to confusion
4. **Define tests first**: Acceptance tests should be clear before implementation
5. **Reality check**: Verify current state, don't assume
6. **Update status**: Keep status current as work progresses

**Remember**: Contracts are the ONLY executable planning surface. Vision documents are context, not tasks.

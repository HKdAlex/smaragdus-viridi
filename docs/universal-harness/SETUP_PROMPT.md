# Setup Prompt: Initialize Microcontracts System for New Project

> **Copy this entire prompt to an AI agent along with the project plan/vision to set up the microcontracts harness.**

---

## Your Task

You are setting up a **microcontracts development harness** for a project. This system uses executable contracts (with acceptance tests) to manage AI-powered development.

## Context

The user has provided:
- A project plan/vision (describe what they want to build)
- This setup prompt
- Access to template files in `docs/universal-harness/`

## Setup Steps

### Step 1: Verify Template Files Exist

First, check that these template files exist:
- `docs/universal-harness/TEMPLATE_00_vision.md`
- `docs/universal-harness/TEMPLATE_01_contracts.md`
- `docs/universal-harness/TEMPLATE_02_interfaces.md`
- `docs/universal-harness/TEMPLATE_03_test_corpus.md`
- `docs/universal-harness/TEMPLATE_AGENT_PROMPT.md`

If they don't exist, inform the user that the harness files need to be copied first.

### Step 2: Create Project Structure

Create the planning directory structure:

```bash
mkdir -p docs/plan
```

### Step 3: Read and Customize Vision Template

1. Read `docs/universal-harness/TEMPLATE_00_vision.md`
2. Create `docs/plan/00_vision.md` by customizing the template:
   - Replace `[PROJECT_NAME]` with the actual project name
   - Replace `[High-Level Description]` with what the system does
   - Replace all other placeholders with project-specific details
   - Use the user's project plan/vision to fill in:
     - Executive goals (G1, G2, G3)
     - Architectural shift (Before → After)
     - Current state (what exists, what's missing)
     - Implementation phases

**Important**: The vision document describes architectural intent, NOT a task list. Keep it high-level and directional.

### Step 4: Read and Customize Contracts Template

1. Read `docs/universal-harness/TEMPLATE_01_contracts.md`
2. Create `docs/plan/01_contracts.md` by customizing the template:
   - Replace `[STORAGE_SYSTEM]` with actual storage (e.g., "Supabase", "PostgreSQL")
   - Replace `[EXPLORATION_METHOD]` with actual method (e.g., "MCP tools", "SQL queries")
   - Replace `[PREFIX]` with project prefix (e.g., "PROJ", "FEAT")
   - Keep the contract template structure intact
   - Add an "Implementation Order" section (empty for now)

**Important**: This document will be the SSOT (Single Source of Truth) for all executable work.

### Step 5: Read and Customize Interfaces Template

1. Read `docs/universal-harness/TEMPLATE_02_interfaces.md`
2. Create `docs/plan/02_interfaces.md` by customizing the template:
   - Replace `[AUTHORITY_TYPE]` with actual authority types (e.g., "Parsing", "Diff", "Translation")
   - Replace `[SYSTEM_NAME]` with actual system names (e.g., "Python language core", "Next.js frontend")
   - Replace `[STORAGE_SYSTEM]` with actual storage
   - Define clear authority rules for each system
   - Specify what agents must NOT invent

### Step 6: Read and Customize Test Corpus Template

1. Read `docs/universal-harness/TEMPLATE_03_test_corpus.md`
2. Create `docs/plan/03_test_corpus.md` by customizing the template:
   - Replace `[INPUT_TYPE]` with actual input type (e.g., "BBText samples", "API requests")
   - Replace `[PROPERTY_1]`, `[PROPERTY_2]` with actual properties (e.g., "canonical roundtrip", "lossless serialization")
   - Replace `[Category 1]`, `[Category 2]` with meaningful categories
   - Define corpus strategy (don't add entries yet - wait for contracts)

### Step 7: Read and Customize Agent Prompt Template

1. Read `docs/universal-harness/TEMPLATE_AGENT_PROMPT.md`
2. Create `docs/plan/AGENT_PROMPT.md` by customizing the template:
   - Replace `[PROJECT_NAME]` with actual project name
   - Replace `[FEATURE_NAME]` with main feature/domain
   - Replace `[BRIEF_DESCRIPTION_OF_WORK]` with what agents will do
   - List actual directories in "Key Directories" section
   - Document actual tools and commands
   - Define actual verification workflows
   - Replace `[WORKFLOW_TYPE]` with actual workflows (e.g., "Database changes", "UI changes")
   - Replace `[VERIFICATION_METHOD]` with actual methods (e.g., "browser tool", "unit tests")
   - Replace `[SERVER]`, `[URL]` with actual servers and URLs

### Step 8: Create Initial README

Create `docs/plan/README.md` with:

```markdown
# Documentation Spine: [PROJECT_NAME]

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
```

### Step 9: Verify Setup

After creating all files, verify:

- [ ] `docs/plan/00_vision.md` exists and has project-specific content (no placeholders)
- [ ] `docs/plan/01_contracts.md` exists and has contract template
- [ ] `docs/plan/02_interfaces.md` exists and defines authority boundaries
- [ ] `docs/plan/03_test_corpus.md` exists and defines corpus strategy
- [ ] `docs/plan/AGENT_PROMPT.md` exists and is customized for the project
- [ ] `docs/plan/README.md` exists and explains the system

### Step 10: Create First Contract (Optional)

If the user's project plan includes specific work items, create the first contract:

1. Pick a small, well-defined piece of work from the vision
2. Use the contract template from `01_contracts.md`
3. Fill in ALL sections:
   - ID, Status (start as `draft`), Origin
   - Scope (in/out)
   - Affected packages/systems
   - Public artifacts
   - Invariants
   - Acceptance tests (at least 2-3)
   - Explicit non-goals
   - Reality-check requirements
4. Add it to the "Implementation Order" section in `01_contracts.md`

## Important Notes

1. **Don't skip placeholders**: Every `[PLACEHOLDER]` must be replaced with actual project details
2. **Vision is non-executable**: The vision document describes intent, not tasks
3. **Contracts are executable**: All work comes from contracts, not vision
4. **Reality checks first**: Before creating contracts, verify what actually exists
5. **Start small**: The first contract should be small and well-defined

## What to Report

After completing setup, report:

1. ✅ All files created successfully
2. ✅ All placeholders replaced
3. ✅ Vision document describes architectural intent
4. ✅ Contracts document has template ready
5. ✅ Interface boundaries defined
6. ✅ Test corpus strategy defined
7. ✅ Agent prompt customized
8. ✅ (Optional) First contract created

## Next Steps for User

After setup is complete, the user should:

1. Review `docs/plan/00_vision.md` to ensure it matches their intent
2. Review `docs/plan/AGENT_PROMPT.md` to ensure it's customized correctly
3. Create their first contract (or review the one you created)
4. Start using the system by executing contracts

---

## Template File Locations

The template files should be in:
- `docs/universal-harness/TEMPLATE_00_vision.md`
- `docs/universal-harness/TEMPLATE_01_contracts.md`
- `docs/universal-harness/TEMPLATE_02_interfaces.md`
- `docs/universal-harness/TEMPLATE_03_test_corpus.md`
- `docs/universal-harness/TEMPLATE_AGENT_PROMPT.md`

If these don't exist, inform the user that the harness needs to be copied first.

---

**Remember**: You are setting up a methodology, not implementing features. Focus on creating the planning infrastructure correctly.

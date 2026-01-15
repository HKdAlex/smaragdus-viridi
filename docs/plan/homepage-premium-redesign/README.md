# Homepage Premium Redesign — Harness

This directory contains the universal harness adapted for the **Homepage Premium Redesign** initiative.

## What This Is
- A planning and execution system using **vision + contracts**.
- The **vision** describes intent and direction (non-executable).
- **Contracts** are the only executable planning surface.
- **Interfaces** define authority boundaries.
- **Test corpus** locks key UX/behavior invariants.

## Document Map
```
docs/plan/homepage-premium-redesign/
├── README.md                    # This file
├── 00_vision.md                 # Architectural intent (non-executable)
├── 01_contracts.md              # Executable planning surface (SSOT for work)
├── 02_interfaces.md             # Authority boundaries
├── 03_test_corpus.md            # Golden UX/behavior corpus strategy
└── AGENT_PROMPT.md              # Agent onboarding prompt
```

## Core Rules
1. **Never execute from vision** — All work must come from `01_contracts.md`.
2. **One contract at a time** — Finish before starting the next.
3. **Reality checks first** — Verify current state before planning changes.
4. **Rollback-safe by design** — New homepage must ship behind a feature flag or parallel route.

## Quick Start
1. Read `00_vision.md`.
2. Read `01_contracts.md` and find the next `ready` contract.
3. Follow the agent workflow and acceptance tests.

## Notes
- This initiative is scoped to the **homepage only**.
- Any cross-cutting changes (design tokens, animation system) must be explicitly scoped by contract.

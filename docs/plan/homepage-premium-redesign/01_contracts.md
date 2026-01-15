# Contracts (Executable Planning Surface)

## Non-Production / No-Backfill Assumption (Applies to All Contracts)
- This project is **not in production**.
- Database schemas are **mutable**.
- **No backfilling, migrations, or data preservation guarantees are required.**

If a contract touches **Supabase**, it must state assumptions and confirm observed current state via repo inspection and schema artifacts (`supabase/` migrations, SQL, or MCP tools).

---

## Definition: Contract
A **Contract** is the smallest unit of executable implementation planning in this repo.
- A contract is **scoped**: it defines exactly what will change and what will not.
- A contract is **testable**: it defines acceptance tests that must pass.
- A contract is **reality-checked**: it lists what must be verified in the current system before work begins.
- A contract is **the only allowed execution surface**: agents must not derive work directly from `00_vision.md`.

---

## Contract Template (Required Sections)
Copy this template for each new contract.

### Contract ID
- **ID**: `HPR-C[X].[Y]`
- **Status**: `draft` (draft | ready | in-progress | blocked | done)
- **Origin (Vision Reference)**: `docs/plan/homepage-premium-redesign/00_vision.md` → `[Section heading]`

### Scope
- **In scope**: `TODO`
- **Out of scope**: `TODO`

### Affected Packages / Systems
- **Packages/systems**: `TODO`

### Public Artifacts (APIs, tables, files, RPCs)
- **APIs**: `TODO`
- **Tables / views**: `TODO`
- **RPCs**: `TODO`
- **Files / artifacts**: `TODO`

### Invariants
- `TODO`

### Acceptance Tests
- `TODO`

### Explicit Non-Goals
- `TODO`

### Reality-Check Requirements
- **Codebase checks**: `TODO`
- **Supabase checks** (if applicable): `TODO`
- **Artifact checks**: `TODO`

---

## Contracts

### HPR-C0.1 — Homepage Audit & Reality Checks
- **ID**: `HPR-C0.1`
- **Status**: `draft`
- **Origin (Vision Reference)**: `00_vision.md` → "Phase 0 — Discovery & Foundation"

#### Scope
- **In scope**:
  - Identify current homepage route, entry component, and data sources.
  - Document observed layout/sections and any existing motion usage.
- **Out of scope**:
  - Any UI changes or refactors.

#### Affected Packages / Systems
- `src/` (homepage entry and related components)

#### Public Artifacts (APIs, tables, files, RPCs)
- **Files / artifacts**: `docs/plan/homepage-premium-redesign/01_contracts.md` (updated observations)

#### Invariants
1. Current homepage behavior remains unchanged.

#### Acceptance Tests
1. **Documented reality checks**: Observed route and components recorded - `[ ]`

#### Explicit Non-Goals
- Do not implement premium UI in this contract.

#### Reality-Check Requirements
- **Codebase checks**:
  - Locate homepage route and entry component.
  - Identify data fetching logic and dependencies.
- **Artifact checks**:
  - Note existing design tokens or motion utilities, if any.

---

### HPR-C0.2 — Premium Design System & Motion Spec
- **ID**: `HPR-C0.2`
- **Status**: `draft`
- **Origin (Vision Reference)**: `00_vision.md` → "Phase 0 — Discovery & Foundation"

#### Scope
- **In scope**:
  - Define typography scale, spacing, color palette, and UI kit.
  - Define motion primitives (scroll reveal, hover, transition rules).
- **Out of scope**:
  - Production UI implementation.

#### Affected Packages / Systems
- `docs/plan/homepage-premium-redesign/` (spec documentation)

#### Public Artifacts (APIs, tables, files, RPCs)
- **Files / artifacts**: `docs/plan/homepage-premium-redesign/00_vision.md` updates, supporting spec docs if created.

#### Invariants
1. Design system is scoped to the homepage unless explicitly elevated by contract.

#### Acceptance Tests
1. **Design spec documented** with clear tokens and motion rules - `[ ]`

#### Explicit Non-Goals
- Do not modify shared global tokens without a contract.

#### Reality-Check Requirements
- **Codebase checks**:
  - Identify existing token systems to avoid collisions.

---

### HPR-C1.1 — Premium Homepage Structure & Sections
- **ID**: `HPR-C1.1`
- **Status**: `draft`
- **Origin (Vision Reference)**: `00_vision.md` → "Phase 1 — Premium UI Implementation"

#### Scope
- **In scope**:
  - Build premium homepage sections (hero, trust, collections, pillars, editorial, education, personalization, CTA).
  - Create section component structure and layout.
- **Out of scope**:
  - Motion/animation beyond basic layout transitions.

#### Affected Packages / Systems
- `src/` (homepage components)

#### Public Artifacts (APIs, tables, files, RPCs)
- **Files / artifacts**: new components under `src/` for premium homepage.

#### Invariants
1. Current homepage remains intact and renderable.
2. Premium homepage can be toggled off without code removal.

#### Acceptance Tests
1. **Premium homepage renders** behind flag/route - `[ ]`
2. **No regression** to existing homepage - `[ ]`

#### Explicit Non-Goals
- Do not replace existing homepage route without a toggle.

#### Reality-Check Requirements
- **Codebase checks**:
  - Identify current homepage route and feature flag pattern (if any).

---

### HPR-C1.2 — Motion & Interaction Layer
- **ID**: `HPR-C1.2`
- **Status**: `draft`
- **Origin (Vision Reference)**: `00_vision.md` → "Phase 1 — Premium UI Implementation"

#### Scope
- **In scope**:
  - Scroll reveal patterns, hover states, and subtle parallax depth.
  - Reduced-motion support and performance guardrails.
- **Out of scope**:
  - Heavy cinematic effects (WebGL, video-heavy backgrounds).

#### Affected Packages / Systems
- `src/` (motion utilities and premium homepage)

#### Public Artifacts (APIs, tables, files, RPCs)
- **Files / artifacts**: motion utilities, motion tokens if introduced.

#### Invariants
1. Animations must be optional under reduced-motion preference.

#### Acceptance Tests
1. **Reduced motion** disables non-essential animations - `[ ]`
2. **Scroll reveal** applies consistently across sections - `[ ]`

#### Explicit Non-Goals
- Do not introduce global animation dependencies without contract.

#### Reality-Check Requirements
- **Codebase checks**:
  - Confirm current animation libraries and constraints.

---

### HPR-C2.1 — QA, Accessibility, Rollout
- **ID**: `HPR-C2.1`
- **Status**: `draft`
- **Origin (Vision Reference)**: `00_vision.md` → "Phase 2 — QA & Rollout"

#### Scope
- **In scope**:
  - Accessibility validation and visual regression checks.
  - Feature flag/route toggle verification and rollback plan.
- **Out of scope**:
  - Performance optimizations unrelated to homepage.

#### Affected Packages / Systems
- `src/`, test tooling, docs.

#### Public Artifacts (APIs, tables, files, RPCs)
- **Files / artifacts**: test plans, rollout notes.

#### Invariants
1. Rollback is a single toggle (flag or route).
2. Existing homepage remains available.

#### Acceptance Tests
1. **a11y checks** pass for premium homepage - `[ ]`
2. **Rollback toggle** verified in staging - `[ ]`

#### Explicit Non-Goals
- Do not deprecate current homepage yet.

#### Reality-Check Requirements
- **Codebase checks**:
  - Identify testing strategy and accessibility tooling.

---

## Implementation Order
1. **HPR-C0.1**: Homepage audit — Prerequisites: none
2. **HPR-C0.2**: Design system & motion spec — Prerequisites: HPR-C0.1
3. **HPR-C1.1**: Premium homepage structure — Prerequisites: HPR-C0.2
4. **HPR-C1.2**: Motion layer — Prerequisites: HPR-C1.1
5. **HPR-C2.1**: QA & rollout — Prerequisites: HPR-C1.2

---

## Contract Status Summary
| Contract ID | Status | Dependencies | Notes |
|------------|--------|--------------|-------|
| HPR-C0.1 | `draft` | None | Homepage audit and reality checks |
| HPR-C0.2 | `draft` | HPR-C0.1 | Design system and motion spec |
| HPR-C1.1 | `draft` | HPR-C0.2 | Premium homepage sections |
| HPR-C1.2 | `draft` | HPR-C1.1 | Motion and interactions |
| HPR-C2.1 | `draft` | HPR-C1.2 | QA and rollout verification |

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

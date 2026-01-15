# Interface Authority Boundaries (Contract-Governed)

## Non-Production / No-Backfill Assumption
- This project is **not in production**.
- Database schemas are **mutable**.
- No migration/backfill/data-preservation guarantees are required.
- Documentation must clearly separate:
  - **Observed current state**
  - **Planned / proposed structure**

---

## Purpose
This document defines **authority boundaries**: which system is the source of truth for which decisions and artifacts, and what is derived.

All boundary changes must occur **only through contracts** in `docs/plan/homepage-premium-redesign/01_contracts.md`.

---

## Authority Map (as stated in the vision)
The following statements are derived from `docs/plan/homepage-premium-redesign/00_vision.md` and must be treated as constraints until replaced by an explicit contract.

- **Design token authority**: **Homepage Premium Design Spec**
  - Tokens for this initiative must be defined in the premium design system spec.
- **Content authority**: **Homepage content source** (CMS or static content layer)
  - Copy decisions are owned by the content source, not by UI layout code.
- **Motion authority**: **Frontend motion system**
  - Motion primitives must be centralized and reused across sections.
- **Data authority**: **Supabase / backend APIs**
  - Data schema definitions live in storage/API layers, not UI.

---

## Specific Authority Rules (Mandatory)

### Design Token Authority
- **Authoritative**: Premium design system spec (docs + token implementation)
- **Derived/consumer**: Homepage section components
- **Rule**: Section components must not create ad-hoc token values without updating the spec and a contract.

### Content Copy Authority
- **Authoritative**: Content source (CMS or static content config)
- **Derived/consumer**: Homepage UI
- **Rule**: UI must not hardcode final copy if a content source exists or is planned by contract.

### Motion Authority
- **Authoritative**: Motion utilities defined for this initiative
- **Derived/consumer**: Section components
- **Rule**: Do not embed custom animation logic in individual sections without updating the motion system spec.

### Data Source Authority
- **Authoritative**: Supabase / backend APIs
- **Derived/consumer**: Homepage data fetching layer
- **Rule**: UI must not invent new data fields without a contract and verified schema.

### Schema Ownership Rules
- **SSOT storage** lives in **Supabase** as described in `00_vision.md`.
- **Derived schemas** (e.g., homepage view models) may be reshaped, but only via contracts.
- **Non-production reminder**: schema mutability is expected; preservation/backfill is out of scope.

---

## Observed vs Planned: Documentation Rule (Mandatory)
When writing docs, PR descriptions, or new contracts:
- **Observed current state** must be tagged explicitly:
  - "Observed (code): …"
  - "Observed (Supabase): …"
- **Planned / proposed** must be tagged explicitly:
  - "Planned (vision): …"
  - "Proposed (contract draft): …"
- If uncertain: state uncertainty; **do not guess**.

---

## What Agents Are NOT Allowed To Invent
Agents must not fabricate or silently assume:
- **New tables, RPCs, or backend fields** "because they probably exist."
- **New design tokens** outside the premium spec.
- **New motion rules** outside the motion system.
- **Production safety constraints** (backfills, retention guarantees).

If an implementation requires something not present, the correct action is:
- write a contract in `01_contracts.md`, and
- include reality-check requirements (including Supabase exploration if relevant).

---

## Interface Evolution (Contracts Only)
Interfaces (APIs, tables, artifacts, JSON projections) may evolve **only** when an explicit contract:
- defines the new/changed interface surface,
- lists affected packages/systems,
- specifies invariants,
- specifies acceptance tests,
- and lists reality-check requirements validating current state before changes.

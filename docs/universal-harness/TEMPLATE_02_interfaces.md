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

This document defines **authority boundaries**: which system is the source of truth for which decisions and artifacts, and what is merely derived.

These boundaries exist to prevent architectural drift and to prevent agents from "inventing" missing interfaces.

All boundary changes must occur **only through contracts** in `docs/plan/01_contracts.md`.

---

## Authority Map (as stated in the vision)

The following statements are derived directly from the master vision document (`docs/plan/00_vision.md`) and must be treated as constraints until replaced by an explicit contract.

- **[AUTHORITY_1] authority**: **[SYSTEM_NAME]**
  - [Description of what this system owns]
- **[AUTHORITY_2] authority**: **[SYSTEM_NAME]**
  - [Description of what this system owns]
- **[AUTHORITY_3] authority**: **[SYSTEM_NAME]**
  - [Description of what this system owns]

---

## Specific Authority Rules (Mandatory)

### [Authority Type 1] Authority

- **Authoritative**: [Which system/component]
- **Derived/consumer**: [What consumes this authority]
- **Rule**: [What agents must not do]

### [Authority Type 2] Authority

- **Authoritative**: [Which system/component]
- **Derived/consumer**: [What consumes this authority]
- **Rule**: [What agents must not do]

### [Authority Type 3] Authority

- **Authoritative**: [Which system/component]
- **Derived/consumer**: [What consumes this authority]
- **Rule**: [What agents must not do]

### Schema Ownership Rules

- **SSOT storage** lives in [STORAGE_SYSTEM] as described in `00_vision.md`.
- **Derived schemas** (e.g., [EXAMPLE_PROJECTION]) are explicitly derived and may be reshaped, but only via contracts.
- **Non-production reminder**: schema mutability is expected; preservation/backfill is out of scope. Documentation must not assume production constraints.

---

## Observed vs Planned: Documentation Rule (Mandatory)

When writing docs, PR descriptions, or new contracts:

- **Observed current state** must be tagged explicitly, e.g.:
  - "Observed (code): …"
  - "Observed ([STORAGE_SYSTEM] via MCP): …"
- **Planned / proposed** must be tagged explicitly, e.g.:
  - "Planned (vision): …"
  - "Proposed (contract draft): …"
- If uncertain: state uncertainty; **do not guess**.

---

## What Cursor Agents Are NOT Allowed To Invent

Agents must not fabricate or silently assume:

- **New tables, RPCs, or database entities** "because they probably exist."
- **New [AUTHORITY_TYPE] rules** outside [AUTHORITATIVE_SYSTEM] (including "temporary" workarounds) as a substitute for authority.
- **New [POLICY_TYPE] schemes**: the [POLICY_NAME] is a contract decision; do not mix [SCHEME_A] and [SCHEME_B] without a contract explicitly changing policy.
- **New canonical [RULE_TYPE] rules** not defined by contract.
- **New "[INTERFACE_NAME]" fields** beyond what a contract specifies; do not grow interface surfaces ad hoc.
- **Production safety constraints** (backfills, migrations, data retention guarantees). This is explicitly non-production; do not import production assumptions into plans or contracts.

If an implementation requires something not present, the correct action is:

- write a contract in `01_contracts.md` (or add a new contract file entry, if that workflow is introduced later), and
- include reality-check requirements (including [STORAGE_SYSTEM] exploration if relevant).

---

## Interface Evolution (Contracts Only)

Interfaces (APIs, RPCs, tables, artifacts, JSON projections) may evolve **only** when an explicit contract:

- defines the new/changed interface surface,
- lists affected packages/systems,
- specifies invariants,
- specifies acceptance tests,
- and lists reality-check requirements validating current state before changes.

---

## Template Usage Notes

When adapting this template:

1. **Define your authorities**: Replace `[AUTHORITY_TYPE]` with your actual authority types (e.g., "Parsing", "Diff", "Translation")
2. **Name your systems**: Replace `[SYSTEM_NAME]` with actual system names (e.g., "Python language core", "Next.js frontend")
3. **Specify rules**: Each authority should have clear rules about what agents must not do
4. **Document storage**: Replace `[STORAGE_SYSTEM]` with your actual storage (e.g., "Supabase", "PostgreSQL")
5. **Add project-specific boundaries**: Include any project-specific authority rules

**Example adaptations**:

- **Parsing authority**: "Python language core" is authoritative for parsing. Next.js must not implement parsing logic.
- **Diff authority**: "Language-core-derived identities/spans/tokens" are authoritative. UI renders diff outputs; it does not define the correctness model.
- **Translation authority**: "Language-core-derived units/spans/IDs" are authoritative. Translation workflows consume units and produce results keyed by stable IDs.

**Remember**: These boundaries prevent drift. If you need to change them, do it via a contract, not ad-hoc implementation.

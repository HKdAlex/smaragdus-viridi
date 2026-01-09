# [PROJECT_NAME] — Vision Document

<!-- markdownlint-disable MD041 -->

> This document describes architectural intent and long-term direction.  
> It is **not** an implementation checklist and must not be executed directly.

## How to Read This Document

- **Read for intent and constraints**: this file explains why the system is architected this way and what properties are non-negotiable.
- **Treat phases as narrative, not work items**: the phase sections describe _directional sequencing_ and rationale. They are not a contract and not an execution surface.
- **Use `docs/plan/01_contracts.md` for execution**: all implementation work must be derived from explicit contracts with reality checks and acceptance tests.
- **Reality-check anything that looks like "current state"**: the embedded plan contains claims about existing systems/files. Treat those as _unverified_ until confirmed (codebase inspection and, when storage interfaces are involved, database exploration).
- **Non-production assumption is explicit**: this project is not in production. Historical data safety, backfilling, and migration/preservation guarantees are out of scope.

## Why This Is Not a Task List

- **No reality checks are embedded**: this vision document contains statements about "what exists" and "what is planned," but it is not the authoritative interface for execution.
- **It intentionally contains choices and options**: e.g., multiple approaches are described (Option A vs Option B) without resolving them into commitments.
- **It contains phased intent, not scoped deltas**: phases describe end-state goals and sequencing; a contract is required to define scope, invariants, acceptance tests, and reality-check requirements.
- **Agents must not convert vision into tasks implicitly**: if work is needed, it must be expressed as an explicit contract in `01_contracts.md`.

---

# [PROJECT_NAME] — [High-Level Description]

This document describes the architectural vision for [PROJECT_NAME], which [brief description of what the system does and why].

## Executive Goals (Non-Negotiable)

### G1 — [Core Property 1]

- **Requirement**: [What must be true]
- **Rationale**: [Why this matters]

### G2 — [Core Property 2]

- **Requirement**: [What must be true]
- **Rationale**: [Why this matters]

### G3 — [Core Property 3]

- **Requirement**: [What must be true]
- **Rationale**: [Why this matters]

## Key Architectural Shift

### Before

[Describe the current or previous architecture]

### After

[Describe the target architecture]

**Key changes**:
- [Change 1]
- [Change 2]
- [Change 3]

## Current Repo State (What Already Exists)

### Already Present

- **[System/Component 1]**: [What exists and how it works]
- **[System/Component 2]**: [What exists and how it works]

### Key Gaps / Blockers

- **[Gap 1]**: [What's missing or broken]
- **[Gap 2]**: [What's missing or broken]

## [Policy/Decision Name] (Chosen)

### ✅ Policy [Name]: [Description]

We will [decision/approach].

**Why**:
- [Reason 1]
- [Reason 2]

**Implementation implications**:
- [Implication 1]
- [Implication 2]

## Data Model Glossary

### [Concept 1]

[Definition and purpose]

### [Concept 2]

[Definition and purpose]

### [Concept 3]

[Definition and purpose]

## Implementation Plan (Phased, Repo-Aligned)

### Phase 0 — [Foundation Phase Name]

#### 0.1 [Task Name]

**Deliverable**:
- [What will be created]

**Notes**:
- [Important considerations]

**Acceptance**:
- [How to verify completion]

#### 0.2 [Task Name]

[Similar structure...]

### Phase 1 — [Next Phase Name]

#### 1.1 [Task Name]

[Similar structure...]

### Phase 2 — [Next Phase Name]

[Similar structure...]

## Suggested Implementation Order (Pragmatic, Minimal Rework)

1. **[First priority]**: [Why first]
2. **[Second priority]**: [Why second]
3. **[Third priority]**: [Why third]

## Notes / Decisions to Make Explicit Early

- **[Decision 1]**: [Description and rationale]
- **[Decision 2]**: [Description and rationale]
- **[Decision 3]**: [Description and rationale]

## Deferred and Optional Enhancements

The following enhancements are **not part of the core vision** but represent potential future improvements that may be considered if needed. They are explicitly marked as **deferred and optional** to avoid scope creep in the main implementation plan.

### [Enhancement Name]

**Status**: Deferred, optional

**Potential improvements**:
- [Improvement 1]
- [Improvement 2]

**When to consider**: [Conditions that would make this relevant]

**Note**: [Why it's deferred]

---

## Template Usage Notes

When adapting this template:

1. **Replace placeholders**: `[PROJECT_NAME]`, `[High-Level Description]`, etc.
2. **Define your goals**: G1, G2, G3 should be your non-negotiable properties
3. **Describe current state**: What exists now (verify, don't assume)
4. **Define phases**: Break work into logical phases with clear acceptance criteria
5. **Document decisions**: Make architectural choices explicit
6. **Keep it non-executable**: This is intent, not a task list

**Remember**: Agents must not execute from this document. All work comes from contracts in `01_contracts.md`.

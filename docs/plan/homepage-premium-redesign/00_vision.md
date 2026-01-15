# Crystallique — Homepage Premium Redesign Vision

<!-- markdownlint-disable MD041 -->

> This document describes architectural intent and long-term direction.  
> It is **not** an implementation checklist and must not be executed directly.

## How to Read This Document
- **Read for intent and constraints**: this file explains why the system is architected this way and what properties are non-negotiable.
- **Treat phases as narrative, not work items**: phases describe directional sequencing and rationale.
- **Use `docs/plan/homepage-premium-redesign/01_contracts.md` for execution**.
- **Reality-check anything that looks like "current state"**: treat as unverified until confirmed.
- **Non-production assumption is explicit**: this project is not in production. Backfills and preservation guarantees are out of scope.

---

# Crystallique — Premium Homepage Experience

This document describes the architectural vision for the Crystallique homepage redesign, which aims to deliver a **premium, editorial, and conversion-focused** experience while remaining **rollback-safe** and incrementally implementable.

## Executive Goals (Non-Negotiable)

### G1 — Premium Brand Perception
- **Requirement**: The homepage must read as luxury-grade through typography, layout, imagery, and motion.
- **Rationale**: The homepage sets the tone for trust and perceived value.

### G2 — Conversion Clarity
- **Requirement**: The primary CTA and product discovery path must be clear within the first viewport.
- **Rationale**: Premium aesthetic must not compromise usability or revenue.

### G3 — Rollback-Safe Implementation
- **Requirement**: The premium homepage must ship behind a feature flag or parallel route with a reversible toggle.
- **Rationale**: We must be able to revert instantly without deleting existing code.

## Key Architectural Shift

### Before
- The homepage experience is assumed to be a **single, shared route** with fixed sections and limited motion.

### After
- The homepage is **modular** and **variant-driven** (current vs premium), with shared data access and a feature-flagged presentation layer.

**Key changes**:
- Introduce a **premium variant** route or feature flag.
- Decompose the homepage into **section components** with clear boundaries.
- Establish a **motion system** and **design token** source of truth.

## Current Repo State (What Already Exists)

### Already Present
- **Observed (repo)**: `src/` exists with React/TypeScript code.
- **Observed (repo)**: `supabase/` exists (storage system likely Supabase).
- **Observed (docs)**: `docs/plan/` contains other harnesses (used as reference).

### Key Gaps / Blockers
- **Unknown**: Current homepage structure and routing are not yet verified.
- **Unknown**: Existing motion or design token system is not yet verified.

## Feature Rollout Policy (Chosen)

### ✅ Policy: Parallel Variant with Feature Flag
We will implement the premium homepage behind a **feature flag** and/or **parallel route**.

**Why**:
- Enables safe rollout and rollback.
- Allows A/B testing and phased migration.

**Implementation implications**:
- Premium components must be isolated from current homepage components.
- Shared data and utilities must remain backward compatible.

## Data Model Glossary

### Homepage Section
A self-contained UI block (hero, trust, collection highlights) with its own layout and content contract.

### Premium Variant
A premium-only version of the homepage rendered when feature flag or route is enabled.

### Feature Flag
A runtime toggle that controls whether the premium homepage renders.

### Motion System
A set of shared animation patterns for scroll, hover, and transitions.

## Implementation Plan (Phased, Repo-Aligned)

### Phase 0 — Discovery & Foundation
#### 0.1 Homepage Audit
**Deliverable**:
- Verified current homepage structure, route, and data sources.
**Notes**:
- Document observed state with evidence.
**Acceptance**:
- Current homepage components mapped in `01_contracts.md` reality checks.

#### 0.2 Design Tokens & Motion Direction
**Deliverable**:
- Initial premium design system guidelines and motion principles.
**Notes**:
- No code changes required.
**Acceptance**:
- Guidelines documented in contracts.

### Phase 1 — Premium UI Implementation
#### 1.1 New Section Architecture
**Deliverable**:
- Component structure for premium homepage sections.
**Acceptance**:
- Sections render in a staging route or flagged mode.

#### 1.2 Visual System & Content Integration
**Deliverable**:
- Typography, spacing, color, and copy structure implemented.
**Acceptance**:
- Visual system applied consistently across all sections.

#### 1.3 Motion & Interaction Layer
**Deliverable**:
- Scroll reveal and hover interactions with reduced-motion support.
**Acceptance**:
- Motion spec meets performance and accessibility goals.

### Phase 2 — QA & Rollout
#### 2.1 Accessibility and Performance
**Deliverable**:
- a11y checks, Lighthouse or equivalent metrics.
**Acceptance**:
- No critical a11y violations; performance within targets.

#### 2.2 Rollout & Rollback Controls
**Deliverable**:
- Feature flag or route toggle with docs.
**Acceptance**:
- Reversible switch verified in staging.

## Suggested Implementation Order (Pragmatic, Minimal Rework)
1. **Audit current homepage** — avoid assumptions.
2. **Define premium design system** — unblocks UI implementation.
3. **Implement premium sections** — build in isolation.
4. **Add motion layer** — once layout is stable.
5. **Ship behind flag** — enable safe rollout.

## Notes / Decisions to Make Explicit Early
- **Feature flag location**: config, environment, or CMS toggle.
- **Route strategy**: same path with flag vs parallel `/premium` route.
- **Design token ownership**: global vs homepage-scoped.

## Deferred and Optional Enhancements
### Immersive 3D/Interactive Effects
**Status**: Deferred, optional  
**Potential improvements**:
- WebGL or cinematic media interactions.
**When to consider**: only after core premium UX is stable.
**Note**: performance risk; keep optional.

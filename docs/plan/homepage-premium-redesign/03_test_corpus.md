# Golden Test Corpus (Semantic Drift Gate)

## Non-Production / No-Backfill Assumption
- This project is **not in production**.
- Corpus changes do not imply production data constraints.
- The corpus exists to prevent **semantic drift** in premium homepage UX behavior.

---

## Purpose
The golden corpus is a curated set of **homepage states and visual/interaction expectations** used to:
- lock down **visual hierarchy** and CTA placement,
- validate **accessibility and reduced motion** behavior,
- prevent regressions in **section ordering and layout**,
- and ensure the premium variant remains aligned to the design system.

This is a **UX correctness** asset, not a content archive.

---

## What the Corpus Is
Each corpus entry must minimally include:
- **Source input**: a specific homepage state (route + data state).
- **Expected results**: visual or behavioral expectations tied to contracts.

Expected results must be explicitly tied to the contract that introduced or modified them.

---

## Corpus Categories (Required Taxonomy)

### Layout Consistency Cases
Purpose:
- validate spacing, section order, and CTA prominence.

### Interaction & Motion Cases
Purpose:
- validate scroll reveal, hover behavior, and transitions.

### Accessibility & Reduced Motion Cases
Purpose:
- validate keyboard navigation, focus order, and reduced-motion handling.

### Visual Regression Cases
Purpose:
- lock the premium styling for key breakpoints (desktop/tablet/mobile).

---

## Corpus Entries by Contract

### HPR-C1.1 — Premium Homepage Structure & Sections
**File**: `docs/plan/homepage-premium-redesign/corpus/premium-homepage-layout.md`  
**Purpose**: Validate section order, CTA prominence, and layout spacing.  
**Categories**: Layout Consistency, Visual Regression  
**Entry count**: TBD

### HPR-C1.2 — Motion & Interaction Layer
**File**: `docs/plan/homepage-premium-redesign/corpus/premium-homepage-motion.md`  
**Purpose**: Validate scroll reveals, hover states, and reduced-motion behaviors.  
**Categories**: Interaction & Motion, Accessibility & Reduced Motion  
**Entry count**: TBD

---

## Rules for Adding New Corpus Entries
- **Must be contract-driven**:
  - every new entry must reference a Contract ID (e.g., `HPR-C1.1`).
- **Must state intent**:
  - what property is being gated (hierarchy, motion, accessibility).
- **Must be minimal but sufficient**:
  - prefer the smallest state that reproduces the targeted behavior.
- **Must avoid speculation**:
  - if expected behavior is uncertain, the contract must add reality-check steps.

---

## Rules for Updating Expected Outputs
Expected outputs may be updated only when:
- a contract explicitly changes intended behavior, and
- acceptance tests are updated in lockstep with the contract's invariants.

Required in the contract:
- **what changed** (observable behavior),
- **why it changed** (intent),
- **how it was validated** (acceptance tests),
- **what was reality-checked** (current state validation).

---

## When Documentation or Changelog Updates Are Required
When a contract changes externally visible behavior (e.g., homepage layout, motion rules, CTA strategy), the contract must require updates to:
- relevant docs under `docs/plan/homepage-premium-redesign/`.

If no changelog mechanism exists:
- the contract must state "no changelog mechanism currently observed" and include only the required doc updates.

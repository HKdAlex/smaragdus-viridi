# Golden Test Corpus (Semantic Drift Gate)

## Non-Production / No-Backfill Assumption

- This project is **not in production**.
- Corpus changes do not imply production data constraints.
- The corpus exists to prevent **semantic drift** in [BEHAVIOR_TYPE] behavior; it is not a data preservation system.

---

## Purpose

The golden corpus is a curated set of [INPUT_TYPE] inputs (and expected outputs) used to:

- lock down **deterministic behavior** ([PROPERTY_1]),
- validate **[PROPERTY_2]** properties where applicable,
- prevent regressions in **[PROPERTY_3]**,
- and ensure [CONSUMER_TYPE] consumers remain aligned to [AUTHORITATIVE_SYSTEM].

This is a **toolchain correctness** asset, not a content archive.

---

## What the Corpus Is

Each corpus entry must minimally include:

- **Source input**: a [INPUT_TYPE] sample (single [UNIT], fragment, or full [ENTITY] as appropriate).
- **Expected results**: outputs that are relevant to the contract(s) being gated.

Expected results must be explicitly tied to the contract that introduced or modified them.

---

## Why the Corpus Exists (Drift Prevention)

The master vision (`docs/plan/00_vision.md`) makes "[CONSUMER_TYPE]-first" consumers (e.g., [EXAMPLE_1], [EXAMPLE_2]) depend on stable, deterministic artifacts.

Without a golden corpus:

- "small" [OPERATION_TYPE] changes can silently break [ALIGNMENT_TYPE] alignment,
- [CANONICAL_PROPERTY] can drift without detection,
- consumers ([CONSUMER_SYSTEMS]) can re-implement logic and diverge,
- and regressions become subjective ("looks okay") rather than testable.

---

## Corpus Categories (Required Taxonomy)

Each entry must be tagged with one or more categories below.

### [Category 1] Stress Cases

Examples (non-exhaustive, do not invent spec):

- [Example 1]
- [Example 2]
- [Example 3]

Purpose:

- validate [PROPERTY] correctness.

### [Category 2] Edge Cases

Purpose:

- validate that [BEHAVIOR] is **localized** and does not cause [NEGATIVE_EFFECT].

Rule:

- [RULE_DESCRIPTION] must remain testable and must produce deterministic [OUTPUT_TYPE].

### [Category 3] Preservation Cases

Purpose:

- validate any "[PRESERVATION_PROPERTY]" artifacts where [DETAIL] must be preserved.

Important:

- [CANONICAL_PROPERTY] may normalize [DETAIL]; [PRESERVATION_PROPERTY] must preserve it when the contract requires it.

### [Category 4] Real-World Samples

Purpose:

- lock behavior against representative inputs, including [COMPLEX_STRUCTURE].

Rule:

- these samples are not "unit tests"; they are regression gates tied to contracts.

---

## Corpus Entries by Contract

### [CONTRACT-ID] — [Contract Name]

**File**: `[PATH_TO_CORPUS_FILE]`

**Purpose**: Validate [PROPERTY]: [DESCRIPTION] for all [ELEMENT_TYPE].

**Categories**: [category1], [category2], [category3]

**Entry count**: [N] test cases covering [COVERAGE_DESCRIPTION].

---

## Rules for Adding New Corpus Entries

- **Must be contract-driven**:
  - every new entry must reference a Contract ID (e.g., `C1.1`) that explains why it exists.
- **Must state intent**:
  - what property is being gated ([PROPERTY_1], [PROPERTY_2], etc.).
- **Must be minimal but sufficient**:
  - prefer the smallest sample that reproduces the targeted behavior.
- **Must avoid speculation**:
  - if the expected behavior is uncertain, the contract must explicitly mark uncertainty and add reality-check steps rather than guessing.

---

## Rules for Updating Expected Outputs

Expected outputs may be updated only when:

- a contract explicitly changes intended behavior, and
- acceptance tests are updated in lockstep with the contract's invariants.

Prohibited:

- "update expected output because tests changed" without a contract explaining the intended new behavior.

Required in the contract:

- **what changed** (observable behavior),
- **why it changed** (intent),
- **how it was validated** (acceptance tests),
- **what was reality-checked** (current state validation).

---

## When Documentation or Changelog Updates Are Required

When a contract changes externally visible behavior (e.g., [BEHAVIOR_TYPE_1], [BEHAVIOR_TYPE_2], [BEHAVIOR_TYPE_3]), the contract must require updates to:

- relevant docs under `docs/plan/` (interfaces/boundaries/corpus rules), and/or
- any repo-level changelog mechanism that exists (if and only if it exists; do not invent one).

If no changelog mechanism exists:

- the contract must state "no changelog mechanism currently observed" and include only the required doc updates.

---

## Template Usage Notes

When adapting this template:

1. **Define your input type**: Replace `[INPUT_TYPE]` with what you're testing (e.g., "BBText samples", "API requests")
2. **Specify your properties**: Replace `[PROPERTY_1]`, `[PROPERTY_2]` with actual properties (e.g., "canonical roundtrip", "lossless serialization")
3. **Name your categories**: Replace `[Category 1]`, `[Category 2]` with meaningful categories (e.g., "Unicode stress cases", "Malformed input cases")
4. **Document your contracts**: Add corpus entries as contracts require them
5. **Update as needed**: Corpus grows with contracts, not independently

**Example adaptations**:

- **Input type**: "BBText samples" (for a text processing system)
- **Properties**: "canonical roundtrip", "lossless capture", "span stability"
- **Categories**: "Unicode stress cases", "Malformed markup", "Trivia preservation", "Real-world BBText samples"
- **Consumers**: "diff/translation/QA layers"

**Remember**: The corpus prevents drift. Add entries when contracts require them, update them only when contracts change behavior.

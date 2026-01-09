# Golden Test Corpus (Semantic Drift Gate)

## Non-Production / No-Backfill Assumption

- This project is **not in production**.
- Corpus changes do not imply production data constraints.
- The corpus exists to prevent **semantic drift** in admin form behavior; it is not a data preservation system.

---

## Purpose

The golden corpus is a curated set of gemstone data inputs (and expected outputs) used to:

- lock down **deterministic behavior** (form submission → database state),
- validate **data integrity** properties where applicable,
- prevent regressions in **admin form functionality**,
- and ensure consumer-facing components remain aligned to database schema.

This is a **toolchain correctness** asset, not a content archive.

---

## What the Corpus Is

Each corpus entry must minimally include:

- **Source input**: a gemstone form submission (field values as admin would enter them).
- **Expected results**: database state after save, form state on reload.

Expected results must be explicitly tied to the contract(s) being gated.

---

## Why the Corpus Exists (Drift Prevention)

The master vision (`docs/plan/00_vision.md`) introduces flexible text entry alongside existing enum columns.

Without a golden corpus:

- "small" form changes can silently break enum-to-custom mapping,
- data integrity can drift without detection,
- consumers (catalog filters, detail pages) can diverge from admin entry,
- and regressions become subjective ("looks okay") rather than testable.

---

## Corpus Categories (Required Taxonomy)

Each entry must be tagged with one or more categories below.

### Enum-Matching Cases

Examples (non-exhaustive, do not invent spec):

- Admin enters "emerald" → `name` enum = "emerald", `name_custom` = "emerald"
- Admin enters "round" → `cut` enum = "round", `cut_custom` = "round"
- Admin enters "VS1" → `clarity` enum = "VS1", `clarity_custom` = "VS1"

Purpose:

- validate that known enum values are correctly mapped to both columns.

### Custom Value Cases

Purpose:

- validate that free-text entry is **preserved** and does not corrupt enum columns.

Rule:

- Custom values must be stored in `*_custom` columns; enum columns should use closest match or default.

### Treatment/Enhancement Cases

Purpose:

- validate treatment-related fields store and display correctly.

Examples:

- "Heat treated" in `treatment_status`
- "Untreated/Natural" in `treatment_status`
- "Beryllium diffused" in `treatment_status`

### Alexandrite-Specific Cases

Purpose:

- validate color change description and Russian ТУ quality classification.

Examples:

- Color change: "Green to red under incandescent light"
- Quality: "Г1 (Group 1) - highest quality, minimal inclusions"

### Real-World Samples

Purpose:

- lock behavior against representative inputs from actual gemstone data.

Rule:

- these samples are not "unit tests"; they are regression gates tied to contracts.

---

## Corpus Entries by Contract

### FLEX-C0.1 — Database Schema Extension

**File**: `tests/corpus/flex-c0.1-schema.json` (to be created when contract executes)

**Purpose**: Validate schema: new columns exist and accept expected data types.

**Categories**: schema validation

**Entry count**: 0 (populated during contract execution)

---

### FLEX-C1.1 — Admin Form Flexible Name Field

**File**: `tests/corpus/flex-c1.1-name-field.json` (to be created when contract executes)

**Purpose**: Validate name field: enum matching and custom value preservation.

**Categories**: enum-matching, custom value

**Entry count**: 0 (populated during contract execution)

**Expected entries**:
1. Known type "emerald" → both columns set
2. Known type "diamond" → both columns set
3. Custom type "Paraiba Tourmaline" → custom column set, enum uses closest or default
4. Edit existing enum-only gemstone → form loads correctly

---

### FLEX-C1.5 — Admin Form New Detailed Properties Section

**File**: `tests/corpus/flex-c1.5-detailed-props.json` (to be created when contract executes)

**Purpose**: Validate detailed properties: all 6 fields save and load correctly.

**Categories**: treatment/enhancement, alexandrite-specific, real-world

**Entry count**: 0 (populated during contract execution)

**Expected entries**:
1. All fields empty → saves successfully
2. Treatment only → "Heat treated" persists
3. Alexandrite full entry → color change + quality classification persist
4. All fields populated → all values persist on reload

---

## Rules for Adding New Corpus Entries

- **Must be contract-driven**:
  - every new entry must reference a Contract ID (e.g., `FLEX-C1.1`) that explains why it exists.
- **Must state intent**:
  - what property is being gated (enum mapping, custom preservation, etc.).
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

When a contract changes externally visible behavior (e.g., form field behavior, database schema, API responses), the contract must require updates to:

- relevant docs under `docs/plan/` (interfaces/boundaries/corpus rules), and/or
- any repo-level changelog mechanism that exists (if and only if it exists; do not invent one).

If no changelog mechanism exists:

- the contract must state "no changelog mechanism currently observed" and include only the required doc updates.

---

## Corpus File Format

Corpus entries should be stored as JSON files in `tests/corpus/` with the following structure:

```json
{
  "contract_id": "FLEX-C1.1",
  "description": "Name field enum matching and custom value preservation",
  "entries": [
    {
      "id": "known-type-emerald",
      "category": ["enum-matching"],
      "input": {
        "name_input": "emerald",
        "other_fields": "..."
      },
      "expected_database": {
        "name": "emerald",
        "name_custom": "emerald"
      },
      "expected_form_reload": {
        "name_field_value": "emerald"
      }
    }
  ]
}
```

---

## Template Usage Notes

This test corpus document is customized for the Crystallique gemstone platform flexible fields feature. All placeholders have been replaced with project-specific details.

**Remember**: The corpus prevents drift. Add entries when contracts require them, update them only when contracts change behavior.

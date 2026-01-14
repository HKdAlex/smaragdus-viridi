# Filter & Search System Overhaul — Harness

This directory contains the complete planning harness for overhauling the Crystallique gemstone platform's customer-facing filter and search system.

## Background

This work was initiated based on the gap analysis in `CUSTOMER_FILTERS_ANALYSIS.md`, which identified:

- **11 filters** currently implemented
- **15+ additional filterable fields** available in database but not exposed
- **Search page filter sidebar disabled** (commented out in code)
- **Critical missing filters** for professional buyers (treatment status, mining country, quality classification)

## Documents

| File | Purpose |
|------|---------|
| `00_vision.md` | Architectural intent and goals (non-executable) |
| `01_contracts.md` | Executable contracts with acceptance tests |
| `02_interfaces.md` | Authority boundaries and ownership rules |
| `03_test_corpus.md` | Test cases for preventing regression |
| `AGENT_PROMPT.md` | Onboarding prompt for AI agents |
| `README.md` | This file |

## Quick Start

### For AI Agents

1. Read `AGENT_PROMPT.md` for session setup
2. Read `01_contracts.md` to find current work
3. Follow the workflow in the agent prompt

### For Human Developers

1. Read `00_vision.md` for architectural context
2. Read `01_contracts.md` for specific implementation tasks
3. Read `02_interfaces.md` for authority rules

## Contract Overview

### Phase 0: Foundation & Re-enablement (3 contracts)
- Re-enable search page filter sidebar
- Add missing filters to visual mode
- Update filter types for new fields

### Phase 1: Professional Filters (4 contracts)
- Treatment Status filter
- Mining Country filter
- Quality Classification filter
- Color Change filter

### Phase 2: Technical Filters (3 contracts)
- Dimension filter (Length × Width)
- Price Per Carat filter
- Has AI Analysis in visual mode

### Phase 3: API & Database Updates (4 contracts)
- Update catalog API
- Update search API
- Update filter counts function
- Add database indexes

### Phase 4: Integration & Polish (4 contracts)
- Integrate all filters on search page
- Add localization
- Mobile optimization
- Final verification

### Phase 5: UX/UI Design Excellence (8 contracts) ✨
- Filter sidebar visual redesign (luxury aesthetic)
- Search experience enhancement (elegant input, suggestions)
- Micro-interactions and animations (hover, transitions)
- Active filter chips (removable pills, clear all)
- Loading and empty states (skeletons, helpful messages)
- Results display optimization (card design, quick view)
- Accessibility audit (keyboard nav, ARIA, contrast)
- Final UX polish (consistency, cross-browser)

**Total: 26 contracts**

## Key Goals

1. **G1**: Complete filter coverage — all customer-relevant attributes filterable
2. **G2**: Re-enable search page filters — full functionality on `/search`
3. **G3**: Consistent filter experience — same behavior on catalog and search
4. **G4**: Professional buyer support — treatment, quality, origin filters
5. **G5**: Performance preservation — no degradation from new filters
6. **G6**: Localization support — EN/RU translations for all filters
7. **G7**: Premium UX/UI design — luxury e-commerce experience with beautiful, intuitive interactions

## Related Documents

- `CUSTOMER_FILTERS_ANALYSIS.md` — Gap analysis that motivated this work
- `docs/plan/cuts-table-migration/` — Previous migration that established patterns
- `src/features/gemstones/types/filter.types.ts` — Filter type definitions

## Status

Check `01_contracts.md` for current contract statuses. The Implementation Order section shows the recommended execution sequence.

## Notes

- This harness follows the universal-harness methodology
- All work must come from contracts, not vision
- Reality checks required before starting each contract
- Build verification mandatory before marking contracts complete

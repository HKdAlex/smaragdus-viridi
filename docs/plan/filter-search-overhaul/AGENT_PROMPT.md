# Filter & Search System Overhaul — Agent Session Prompt

> **Copy the content below this line to start a new session on filter/search work.**

---

## Role

You are an implementation agent working on the **Filter & Search System Overhaul** for the Crystallique gemstone platform. Your task is to implement comprehensive customer-facing filters, re-enable search page filtering, and add professional buyer filters (treatment status, mining country, quality classification).

## Orientation — Read These Files First

Before taking any action, read and understand the current state:

1. **Vision (architectural intent, non-executable)**:
   - `docs/plan/filter-search-overhaul/00_vision.md`

2. **Contracts (executable planning surface)**:
   - `docs/plan/filter-search-overhaul/01_contracts.md`
   - Find contracts by status: `draft`, `ready`, `in-progress`, `blocked`, `done`
   - Follow the **Agent Workflow Rules** section

3. **Interface boundaries**:
   - `docs/plan/filter-search-overhaul/02_interfaces.md`

4. **Test corpus**:
   - `docs/plan/filter-search-overhaul/03_test_corpus.md`

5. **Background analysis**:
   - `CUSTOMER_FILTERS_ANALYSIS.md` — Gap analysis that motivated this work

## Workflow

### 1. Assess Current State

After reading the contracts file, determine:
- Which contracts are `done`?
- Which contract is `in-progress`? (There should be at most one)
- What is the next `ready` or `draft` contract based on dependencies?

### 2. Select Work

Choose ONE of these modes based on current state:

**Mode A: Continue In-Progress Contract**
- If a contract is `in-progress`, continue working on it
- Check which acceptance tests are already `[x]` vs `[ ]`
- Complete remaining tests

**Mode B: Start Next Contract**
- If no contract is `in-progress`, find the next one that:
  - Has all dependencies `done`
  - Is `ready` or `draft` status
- Update its status to `in-progress`
- Run reality checks first

**Mode C: Verify Completed Work**
- If asked to verify, check all `[x]` acceptance tests are actually passing
- Update status to `done` if verified
- Check what contracts are now unblocked

### 3. Execute Contract

Follow the **Agent Workflow Rules** in `01_contracts.md`:

```
BEFORE: Read contract → Update status → Verify deps → Run reality checks
DURING: Work incrementally → Build frequently → Check off tests → Document blockers  
AFTER:  Build without errors → Verify all tests → Update status → Commit to git
```

**Filter component workflow:**
1. Update TypeScript types in `filter.types.ts` if needed
2. Create/modify UI component
3. Update URL utilities if needed
4. Test in browser
5. Verify build passes

**API workflow:**
1. Update API route handler
2. Update query logic
3. Test with curl/Postman
4. Verify TypeScript types match
5. Verify build passes

**Database workflow:**
1. Create migration file in `supabase/migrations/`
2. Apply migration via Supabase dashboard or CLI
3. Regenerate TypeScript types: `npm run types:generate`
4. Verify build passes

### 4. Update Documents

After any significant work:
- Update contract status and acceptance test checkboxes
- If architectural decisions change, update `00_vision.md`
- If scope changes, add or modify contracts

### 5. Build and Commit (MANDATORY)

After completing a contract:
1. **Build verification**: `npm run build` — must succeed
2. **Git commit**: Commit all changes with a descriptive message:
   ```bash
   git add .
   git commit -m "Contract FILTER-C[X].[Y]: [Brief description]

   - [Key change 1]
   - [Key change 2]
   - [Key change 3]
   
   Fixes: FILTER-C[X].[Y]"
   ```
3. **Update contract status**: Mark as `ready` or `done` only after successful build and commit

### 6. Session Handoff

Before ending the session:
- Document what was completed
- Update all relevant statuses
- Note any blockers or questions for next session
- Verify build succeeded and commit was made

## Contract Phases Overview

| Phase | Contracts | Type |
|-------|-----------|------|
| **Phase 0** | FILTER-C0.1 through FILTER-C0.3 | Foundation & Re-enablement |
| **Phase 1** | FILTER-C1.1 through FILTER-C1.4 | Professional Filters |
| **Phase 2** | FILTER-C2.1 through FILTER-C2.3 | Technical Filters |
| **Phase 3** | FILTER-C3.1 through FILTER-C3.4 | API & Database Updates |
| **Phase 4** | FILTER-C4.1 through FILTER-C4.4 | Integration & Polish |
| **Phase 5** | FILTER-C5.1 through FILTER-C5.8 | UX/UI Design Excellence |

> **Note**: Check `01_contracts.md` for current status of each contract. Status is NOT maintained in this prompt file.

### Phase 5 UX/UI Focus Areas

Phase 5 elevates the filter/search experience to luxury e-commerce standards:

- **C5.1**: Filter sidebar visual redesign (premium styling, hierarchy)
- **C5.2**: Search experience enhancement (elegant input, suggestions)
- **C5.3**: Micro-interactions and animations (hover, transitions)
- **C5.4**: Active filter chips (removable pills, clear all)
- **C5.5**: Loading and empty states (skeletons, helpful messages)
- **C5.6**: Results display optimization (card design, quick view)
- **C5.7**: Accessibility audit (keyboard nav, ARIA, contrast)
- **C5.8**: Final UX polish (consistency, cross-browser)

## Key Directories

```
docs/plan/filter-search-overhaul/     # Planning documents (this harness)
src/features/gemstones/types/         # Filter type definitions
src/features/gemstones/components/filters/  # Filter UI components
src/features/gemstones/utils/         # Filter URL utilities
src/features/search/                  # Search feature
src/app/api/catalog/                  # Catalog API
src/app/api/search/                   # Search API
src/messages/                         # Localization files
supabase/migrations/                  # Database migrations
```

## Tools & Commands

### Supabase Operations

You have access to Supabase MCP tools for database exploration:

```
list_tables        -- List all tables
get_table_schema   -- Get table structure
execute_sql        -- Run SQL queries (read-only recommended)
```

**Always use Supabase MCP tools for database verification.** Do not assume database state.

### TypeScript Operations

```bash
npm run types:generate   # Regenerate types from Supabase
npm run build           # Build project (MANDATORY before marking contract complete)
npm run lint            # Check for linting errors
```

### Development Servers

Dev server may already be running. Check terminals before starting:

| Server | Directory | Command | Default Port |
|--------|-----------|---------|--------------|
| **Next.js** | `/` | `npm run dev` | 3000 |

You may **stop/start/restart** servers as needed during development.

### Browser Verification (Required)

Use the browser tool to verify UI changes:

```
Navigate to catalog page: http://localhost:3000/catalog
Navigate to search page: http://localhost:3000/search
Check filter sidebar functionality
Verify filter combinations work
```

**When to verify via browser**:
- After creating new filter components
- After modifying filter UI
- After API changes that affect filter results
- Before marking a contract as `done`

### File System Commands

```bash
# Check existing filter components
ls src/features/gemstones/components/filters/

# Check visual filter components
ls src/features/gemstones/components/filters/visual/

# Check translation files
ls src/messages/en/
ls src/messages/ru/
```

## Important Rules

1. **Never work from vision directly** — Always work from contracts
2. **One contract at a time** — Complete before starting another
3. **Update documents** — Keep contracts and vision in sync with reality
4. **Reality checks first** — Verify assumptions before implementing
5. **Incremental progress** — Check off tests as you complete them
6. **Types first** — Update `filter.types.ts` before creating UI components

---

## Quick Start

Tell me:
- "Continue where we left off" — I'll check for `in-progress` contracts
- "Start the next contract" — I'll find the next ready contract
- "Verify contract FILTER-C[X].[Y]" — I'll check if it's complete
- "What's the current status?" — I'll summarize all contract statuses

---

## Determining Current Status (Dynamic)

**DO NOT rely on hardcoded status in this prompt.** The SSOT for contract status is `01_contracts.md`.

### How to Find the Next Contract

1. **Read `01_contracts.md`** and scan for contract statuses
2. **Find any `in-progress` contract** → Continue it (Mode A)
3. **If none in-progress**, find the first `ready` or `draft` contract where:
   - All dependencies are `done`
   - Listed in the "Implementation Order" section
4. **Start that contract** (Mode B)

### Status Keywords to Search For

```
Status: `done`         → Completed
Status: `in-progress`  → Currently being worked on
Status: `ready`        → Can be started (dependencies met)
Status: `draft`        → Needs review but may be startable
Status: `blocked`      → Waiting on something
Status: `deferred`     → Not for this phase
```

### Quick Status Check Command

Run this mental checklist after reading contracts:

1. ☐ Is there an `in-progress` contract? → Continue it
2. ☐ What's the first `ready` contract in Implementation Order? → Start it
3. ☐ Are its dependencies all `done`? → Verify before starting
4. ☐ Does it have reality-check requirements? → Run them first

---

## Verification Checklist (Agent Responsibilities)

**Servers**: Check if running; start/restart as needed. Dev server may already be running:
- Next.js: `http://localhost:3000`

**After filter component changes**:
- [ ] Component renders without errors
- [ ] Filter selection updates state correctly
- [ ] Filter persists in URL
- [ ] Build passes: `npm run build`

**After API changes** — verify via browser or curl:

1. **Catalog page** (`http://localhost:3000/catalog`):
   - Open filter sidebar
   - Apply new filter
   - Verify results update correctly

2. **Search page** (`http://localhost:3000/search`):
   - Enter search query
   - Apply filters
   - Verify combined results

**Check for errors**:
- `npm run build` — no compilation/build errors (MANDATORY before marking contract complete)
- Browser console — no JavaScript errors
- Network tab — API calls succeed (200 status)

**Git commit requirements**:
- **MANDATORY**: Commit after each contract completion
- Include contract ID in commit message
- Describe key changes made
- Use format: `Contract FILTER-C[X].[Y]: [Description]`

---

## Key Files Reference

### Filter Types
- `src/features/gemstones/types/filter.types.ts` — All filter type definitions

### Filter Components
- `src/features/gemstones/components/filters/advanced-filters-controlled.tsx` — Standard mode
- `src/features/gemstones/components/filters/advanced-filters-v2-controlled.tsx` — Visual mode
- `src/features/gemstones/components/filters/filter-sidebar.tsx` — Container component
- `src/features/gemstones/components/filters/filter-dropdown.tsx` — Dropdown component
- `src/features/gemstones/components/filters/range-slider.tsx` — Range slider component

### Visual Filter Components
- `src/features/gemstones/components/filters/visual/cut-shape-selector.tsx`
- `src/features/gemstones/components/filters/visual/color-picker.tsx`
- `src/features/gemstones/components/filters/visual/clarity-selector.tsx`
- `src/features/gemstones/components/filters/visual/price-range-cards.tsx`
- `src/features/gemstones/components/filters/visual/weight-range-cards.tsx`
- `src/features/gemstones/components/filters/visual/toggle-cards.tsx`

### URL Utilities
- `src/features/gemstones/utils/filter-url.utils.ts` — URL encoding/decoding

### APIs
- `src/app/api/catalog/route.ts` — Catalog API
- `src/app/api/search/route.ts` — Search API

### Search Components
- `src/features/search/components/search-results.tsx` — Search results page (filter sidebar disabled here)

### Localization
- `src/messages/en/filters.json` — English filter labels
- `src/messages/ru/filters.json` — Russian filter labels

---

## Database Fields for New Filters

From FLEX-C0.1 migration (already exist in database):

| Field | Column | Type | Notes |
|-------|--------|------|-------|
| Treatment Status | `treatment_status` | text | Free-text, filter uses predefined values |
| Mining Country | `mining_country` | text | Free-text country name |
| Cutting Country | `cutting_country` | text | Free-text country name |
| Quality Classification | `quality_classification` | text | Free-text (Г1, Г2, Г3, AAA, etc.) |
| Color Change | `color_change_description` | text | Free-text description |
| Length | `length_mm` | numeric | Millimeters |
| Width | `width_mm` | numeric | Millimeters |
| Price Per Carat | `price_per_carat` | numeric | Calculated field |

---

## Remember

This is a comprehensive overhaul touching many files. Work methodically through contracts. Don't skip reality checks. Test in browser before marking complete.

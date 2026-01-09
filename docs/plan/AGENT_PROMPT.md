# Crystallique Flexible Fields — Agent Session Prompt

> **Copy the content below this line to start a new session on Crystallique flexible fields work.**

---

## Role

You are an implementation agent working on the **Flexible Gemstone Property Entry** feature for the Crystallique project. Your task is to enable administrators to enter gemstone properties as free-text fields rather than being restricted to predefined dropdown selections.

## Orientation — Read These Files First

Before taking any action, read and understand the current state:

1. **Vision (architectural intent, non-executable)**:
   - `docs/plan/00_vision.md`

2. **Contracts (executable planning surface)**:
   - `docs/plan/01_contracts.md`
   - Find contracts by status: `draft`, `ready`, `in-progress`, `blocked`, `done`
   - Follow the **Agent Workflow Rules** section

3. **Interface boundaries**:
   - `docs/plan/02_interfaces.md`

4. **Test corpus**:
   - `docs/plan/03_test_corpus.md`

5. **Project-specific documentation**:
   - `src/features/admin/components/gemstone-form.tsx` (current form implementation)
   - `src/shared/services/database-enums.ts` (current enum definitions)
   - `src/shared/types/database.ts` (generated Supabase types)

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

**Database changes workflow:**
1. Create migration SQL file in `supabase/migrations/`
2. Apply migration via Supabase MCP tools
3. Regenerate types with `npm run types:generate`
4. Verify columns exist via Supabase MCP tools
5. Run `npm run build` to verify types

**Admin form changes workflow:**
1. Modify `src/features/admin/components/gemstone-form.tsx`
2. Update `GemstoneFormData` interface if needed
3. Update `GemstoneAdminService` if needed
4. Add translations to `src/messages/en/admin.json` and `src/messages/ru/admin.json`
5. Run `npm run build` to verify no errors
6. Test in browser via dev server

**Consumer display changes workflow:**
1. Modify `src/features/gemstones/components/gemstone-detail.tsx`
2. Create new components if needed (e.g., `treatment-disclosure.tsx`)
3. Add translations to `src/messages/en/catalog.json` and `src/messages/ru/catalog.json`
4. Run `npm run build` to verify no errors
5. Test in browser - view gemstone detail page with populated fields

### 4. Update Documents

After any significant work:
- Update contract status and acceptance test checkboxes
- If architectural decisions change, update `00_vision.md`
- If scope changes, add or modify contracts

### 5. Build and Commit (MANDATORY)

After completing a contract:
1. **Build verification**: Run `npm run build` to verify no TypeScript errors
2. **Git commit**: Commit all changes with a descriptive message:
   ```bash
   git add .
   git commit -m "Contract FLEX-C[X.Y]: [Brief description]

   - [Key change 1]
   - [Key change 2]
   - [Key change 3]
   
   Fixes: FLEX-C[X.Y]"
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
| **Phase 0** | FLEX-C0.1, FLEX-C0.2 | Database schema & types |
| **Phase 1** | FLEX-C1.1 through FLEX-C1.5 | Admin form modifications |
| **Phase 2** | FLEX-C2.1 | Admin translations |
| **Phase 3** | FLEX-C3.1 through FLEX-C3.3 | Consumer display (professional jewelers) |

**Note**: Phase 3 (consumer display) can run in parallel with Phase 1-2 after Phase 0 is complete.

> **Note**: Check `01_contracts.md` for current status of each contract. Status is NOT maintained in this prompt file.

## Key Directories

```
docs/plan/                                    # Planning documents (vision, contracts)
src/features/admin/components/                # Admin UI components
src/features/admin/services/                  # Admin service layer
src/shared/services/database-enums.ts         # Enum definitions
src/shared/types/database.ts                  # Generated Supabase types
src/messages/en/admin.json                    # English translations
src/messages/ru/admin.json                    # Russian translations
supabase/migrations/                          # Database migrations
```

## Tools & Commands

### Supabase Operations

You have access to Supabase MCP tools for database operations:

```
list_tables          -- List all tables in database
get_table_schema     -- Get column details for a table
execute_sql          -- Run SQL queries (SELECT, migrations)
apply_migration      -- Apply a migration file
```

**Always use Supabase MCP tools to verify database state.** Do not assume columns exist without checking.

### TypeScript Type Generation

After any database schema change:

```bash
npm run types:generate
```

This regenerates `src/shared/types/database.ts` from Supabase schema.

### Development Servers

The Next.js dev server may already be running. Check terminals before starting:

| Server | Directory | Command | Default Port |
|--------|-----------|---------|--------------|
| **Next.js** | `/` | `npm run dev` | 3000 |

You may **stop/start/restart** servers as needed during development.

### Browser Verification (Required)

Use the browser MCP tool to verify UI changes:

```
navigate_to    -- Go to a URL
screenshot     -- Capture current page
click          -- Click an element
type_text      -- Enter text in a field
```

**When to verify via browser**:
- After creating new form fields
- After modifying form behavior
- After translation changes
- Before marking a contract as `done`

### File System Commands

```bash
# Check existing state
ls src/features/admin/components/
ls src/messages/en/
ls supabase/migrations/

# Check migration history
ls supabase/migrations/
```

## Important Rules

1. **Never work from vision directly** — Always work from contracts
2. **One contract at a time** — Complete before starting another
3. **Update documents** — Keep contracts and vision in sync with reality
4. **Reality checks first** — Verify assumptions before implementing
5. **Incremental progress** — Check off tests as you complete them

---

## Quick Start

Tell me:
- "Continue where we left off" — I'll check for `in-progress` contracts
- "Start the next contract" — I'll find the next ready contract
- "Verify contract FLEX-C[X.Y]" — I'll check if it's complete
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
```

### Quick Status Check Command

Run this mental checklist after reading contracts:

1. ☐ Is there an `in-progress` contract? → Continue it
2. ☐ What's the first `ready` contract in Implementation Order? → Start it
3. ☐ Are its dependencies all `done`? → Verify before starting
4. ☐ Does it have reality-check requirements? → Run them first

---

## Verification Checklist (Agent Responsibilities)

**Servers**: Check if running; start/restart as needed:
- Next.js: `http://localhost:3000`

**After database changes**:
- [ ] Migration applied successfully
- [ ] Types regenerated with `npm run types:generate`
- [ ] New columns visible in Supabase table editor
- [ ] `npm run build` passes

**After admin form changes** — verify via browser:

1. **Admin Gemstone Form** (`http://localhost:3000/en/admin` → Gemstones → Edit):
   - New fields visible
   - Values save correctly
   - Values load on edit
   - Form submits without errors

2. **Translations**:
   - Switch to Russian, verify labels display
   - No missing translation warnings in console

**Check for errors**:
- `npm run build` — no TypeScript errors (MANDATORY before marking contract complete)
- Browser console — no runtime errors
- Supabase MCP — database operations succeed

**Git commit requirements**:
- **MANDATORY**: Commit after each contract completion
- Include contract ID in commit message
- Describe key changes made
- Use format: `Contract FLEX-C[X.Y]: [Description]`

---

## Customer Request Summary (Russian Original)

The customer requested the ability for administrators to:
- Write gemstone name (not just select from dropdown)
- Write color description
- Write cut/faceting class
- Write color change/reversal effect
- Write treatment status (enhanced or not)
- Write oiling status
- Write heat/diffusion treatment status
- Write origin country (mining location)
- Write cutting country
- Write clarity/purity (using appropriate system for each stone type)
- Write quality classification (different systems for different stones)

Key example given: Alexandrite classification using Russian ТУ system (Г1, Г2, Г3 groups) rather than diamond GIA system.

---

## Template Usage Notes

This agent prompt is customized for the Crystallique gemstone platform flexible fields feature. All placeholders have been replaced with project-specific details.

**Remember**: This prompt onboards agents to the flexible fields work. Follow contracts, verify via browser, commit after completion.

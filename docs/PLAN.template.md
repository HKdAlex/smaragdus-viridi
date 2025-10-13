# PLAN — <Feature Name>

## Summary
<One paragraph goal and user value.>

## Constraints
- Next.js App Router; Server Components by default.
- Supabase Postgres with RLS ON.
- TypeScript strict; zod validation at boundaries.
- Tests: Vitest (unit) + Playwright (e2e).

## File Map
- app/<route>/page.tsx — <server/client, role>
- app/api/<route>/route.ts — <handlers>
- lib/db/<feature>.ts — <queries/mutations>
- lib/validators/<feature>.ts — <zod>
- components/<feature>/<X>.tsx — <UI>
- tests/unit/<feature>.test.ts — <cases>
- tests/e2e/<feature>.spec.ts — <flows>

## Public Interfaces
- Functions, types, zod schemas (inputs/outputs).

## Data Model & RLS
- Tables: …
- Policies to add/update (SQL sketches).
- RPC/Edge Functions required? Why.

## Test Plan
- Unit cases:
  - [ ] happy path …
  - [ ] validation error …
  - [ ] auth/perm denial …
- E2E flow:
  - [ ] user does X -> sees Y …

## Risks
- …

## Open Questions
- …

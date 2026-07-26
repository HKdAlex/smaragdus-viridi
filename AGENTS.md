# AGENTS.md — Agent tooling & workflow

> Operational notes for AI agents and developers working in this repository.

## Package manager

This project uses **pnpm**, not npm or yarn.

- Lockfile: `pnpm-lock.yaml` (committed)
- Version pin: `packageManager` field in `package.json` (use **Corepack** so the correct pnpm version is used)

```bash
corepack enable
pnpm install
pnpm run dev
pnpm run build
pnpm run test
pnpm run lint
pnpm run type-check
```

**Do not** run `npm install`, `npm ci`, or `yarn install` — they will not match CI/Vercel.

Nested scripts in `package.json` call `pnpm run …`, not `npm run …`.

## Deployment (Vercel)

- Vercel detects pnpm from `pnpm-lock.yaml`.
- Build command: `pnpm run build` (see `vercel.json`).

## Pre-commit hooks

Husky runs `pnpm run type-check`, `pnpm run lint`, and `pnpm run test` on commit.

## Related docs

- `README.md` — quick start
- `CLAUDE.md` — project operating rules
- `docs/04-implementation/development-setup.md` — full developer setup
- `docs/agent-hygiene-backlog.md` — agent workflow hygiene loop (`/agent-hygiene-next`)

## Learned Workspace Facts

- **Supabase (production-shaped):** project ref `dpqapyojcdtrjwuhybky` (`bbtmedia-2025-1`) — see `.cursor/rules/supabase-bbtmedia-migrations.mdc`. Do not use other MCP project IDs for this app.
- **Pricing basis:** never infer `per_piece` from `quantity > 1` alone on legacy lots; default remains `per_carat`. Backfill migrations must be validated with `SELECT pricing_basis, COUNT(*) …` and a storefront spot-check before deploy.
- **Catalog secondary price:** only explicit admin `per_piece` lots show `/ шт`; `lot_fixed` and `per_carat` show price per carat under the total.

## Data migrations (agent checklist)

Before applying or shipping a migration that **backfills** domain columns:

1. Run counts / sample rows on remote (`execute_sql`) mirroring the backfill `WHERE` clause.
2. Add a **reversible** corrective migration when heuristics can misclassify legacy data.
3. Verify affected UI in a browser (`/ru/catalog` + admin) — HTML fetch alone is insufficient for pricing layout.

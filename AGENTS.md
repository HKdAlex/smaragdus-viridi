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

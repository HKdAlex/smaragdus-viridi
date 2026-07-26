# Agent hygiene session log

## 2026-07-11 — Bootstrap harvest

**Mode:** harvest (no transcript index → bootstrap + mine 3 parent chats)

**Transcripts processed:**

- `7dbf5962` — pnpm migration; Husky doc hook blocked README commit
- `4d37f10b` — Instagram + pricing basis; client catalog regression; deploy without browser verify
- `868e47ed` — agent-hygiene bootstrap (this session)

**Gaps filed:** AGHY-GAP-001 … AGHY-GAP-004

**Artifacts created:** backlog, prompt, session log, `.cursor/commands/agent-hygiene-next.md`, transcript index

**AGENTS.md:** added Learned Workspace Facts + data-migration backfill policy

**Next:** `next_pick: implement` — start with AGHY-GAP-002 (P0)

## 2026-07-26 — Working tree hygiene (stop hook)

**Dirty WIP integrated:** branch `chore/agent-hygiene-bootstrap` — backlog, session log, prompt, command, `.gitignore`, `AGENTS.md` facts.

**Deferred stash:** `stash@{0}` (`WIP on feature/ai-analysis-v5`) — `batch-test-100-gems.mjs` + `database.ts`; `git apply --check` fails on master. Recover on `feature/ai-analysis-v5` or file issue; do not drop until classified.

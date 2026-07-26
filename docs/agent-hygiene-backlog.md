# Agent workflow hygiene — backlog (Smaragdus Viridi / Crystallique)

> **Epic:** [#5](https://github.com/HKdAlex/smaragdus-viridi/issues/5) · **Loop:** `/agent-hygiene-next` · **Global skill:** `~/.cursor/skills/agent-hygiene-harvest/` · **Log:** `docs/agent-hygiene-session-log.md`

## State block (agent-maintained)

```yaml
next_pick: implement
epic_issue: 5
last_harvest_at: 2026-07-11
last_harvest_transcript_index: .cursor/hooks/state/agent-hygiene-transcript-index.json
cadence_state: .cursor/hooks/state/agent-hygiene.json
stop_hook: ~/.cursor/hooks/agent-hygiene-stop.mjs
```

## Queue

| ID | Priority | Summary | Status |
|----|----------|---------|--------|
| AGHY-01 | P1 | Bootstrap Smaragdus backlog + `/agent-hygiene-next` | ✅ closed (this session) |

## Discovered gaps (AGHY-GAP)

| Gap | GitHub | Priority | Summary | Status |
|-----|--------|----------|---------|--------|
| AGHY-GAP-001 | [#5](https://github.com/HKdAlex/smaragdus-viridi/issues/5) | P1 | Husky doc validator blocks unrelated commits (sprint doc drift vs changed files) | ⬜ open |
| AGHY-GAP-002 | [#5](https://github.com/HKdAlex/smaragdus-viridi/issues/5) | P0 | Migration backfill inferred `per_piece` from `quantity > 1` — caused catalog `/ шт` regression | ⬜ open |
| AGHY-GAP-003 | [#5](https://github.com/HKdAlex/smaragdus-viridi/issues/5) | P1 | Storefront pricing UI verified via Vercel HTML fetch, not browser — layout/regression risk | ⬜ open |
| AGHY-GAP-004 | [#5](https://github.com/HKdAlex/smaragdus-viridi/issues/5) | P2 | Debug-session ingest instrumentation left in hotfix path until deploy commit | ⬜ open |

## Maintenance

After each harvest/implement session:

1. Update State block + gap rows.
2. Append `docs/agent-hygiene-session-log.md`.
3. Comment on epic #5 when filing P0/P1 gaps.

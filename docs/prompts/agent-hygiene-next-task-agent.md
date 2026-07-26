# Agent workflow hygiene — unified loop (harvest ↔ implement)

> **Invoke:** `/agent-hygiene-next` · **Harvest skill:** `~/.cursor/skills/agent-hygiene-harvest/SKILL.md`  
> **Stop hook:** user-level — runs in **every** workspace (~10 turns / 120 min)

## Mode selection

| Input | Mode |
|-------|------|
| `harvest` / `harvest only` | harvest transcripts → backlog |
| `implement` | one backlog slice |
| `AGHY-GAP-###` / `#NNN` | implement that gap |
| bare `/agent-hygiene-next` | harvest if index has deltas, else implement |

## Harvest mode

Read `~/.cursor/skills/agent-hygiene-harvest/docs/harvest-task-agent.md`.

Backlog: `docs/agent-hygiene-backlog.md`

## Implement mode

Read `~/.cursor/skills/agent-hygiene-harvest/docs/implement-task-agent.md`.

## Authority

1. `docs/agent-hygiene-backlog.md`
2. Harvest/implement task agents in skill folder
3. Epic issue in backlog State block

## Rule H

Agent never closes the hygiene epic without operator `close epic`.

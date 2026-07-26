# Agent workflow hygiene: harvest ↔ implement

**Operator sends `/agent-hygiene-next` only.**

| Modifier | Effect |
|----------|--------|
| `harvest` / `harvest only` | force harvest |
| `implement` | force implement one slice |
| `AGHY-GAP-###` / `#NNN` | implement that gap |

## Mandatory first step

Read **`docs/prompts/agent-hygiene-next-task-agent.md`**, then execute harvest or implement per mode.

## Automatic harvest

User-level **stop hook** (`~/.cursor/hooks/agent-hygiene-stop.mjs`) triggers harvest on cadence in **every workspace**. No per-repo install required.

## Defaults

- **Backlog:** `docs/agent-hygiene-backlog.md`
- **Gap prefix:** `AGHY-GAP-###`
- **State:** `.cursor/hooks/state/agent-hygiene*.json` (gitignored)

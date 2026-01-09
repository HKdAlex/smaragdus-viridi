# Universal AI-Powered Development Harness

> **Copy this entire `universal-harness/` directory to your project and adapt it to your needs.**

## What This Is

This is a **methodology and documentation system** for AI-powered development using **microcontracts** (executable planning surfaces). It provides:

- **Vision documents** (architectural intent, non-executable)
- **Contract system** (executable planning surface with acceptance tests)
- **Interface authority boundaries** (prevents architectural drift)
- **Golden test corpus** (prevents semantic drift)
- **Agent workflow** (structured execution process)

## Core Principles

1. **Vision vs Contracts**: Vision documents describe *intent* and *direction*. Contracts define *executable work* with acceptance tests.
2. **Reality Checks First**: Never assume current state—verify it before planning changes.
3. **One Contract at a Time**: Complete contracts before starting new ones.
4. **Test-Driven**: Acceptance tests are defined before implementation.
5. **Authority Boundaries**: Clear rules about which system owns which decisions.

## Quick Start

### For AI Agents

**Use `SETUP_PROMPT.md`**: This is a self-contained prompt you can send to an AI agent along with your project plan. The agent will:
1. Read the template files
2. Create customized versions in `docs/plan/`
3. Replace all placeholders with your project details
4. Set up the complete harness

### For Human Users

**Use `QUICK_START.md`**: This is a step-by-step guide for manual setup.

### Step 1: Copy the Harness

```bash
# Copy the entire universal-harness directory to your project
cp -r universal-harness/ your-project/docs/plan/
```

### Step 2: Create Your Vision Document

1. Copy `TEMPLATE_00_vision.md` to `00_vision.md`
2. Fill in your project's architectural intent
3. Remember: **This is NOT executable**—it's context for contracts

### Step 3: Create Your Contracts Document

1. Copy `TEMPLATE_01_contracts.md` to `01_contracts.md`
2. Read the contract template section
3. Create your first contract from your vision

### Step 4: Set Up Interface Boundaries

1. Copy `TEMPLATE_02_interfaces.md` to `02_interfaces.md`
2. Define your project's authority boundaries (which system owns what)
3. Update as your architecture evolves

### Step 5: Set Up Test Corpus

1. Copy `TEMPLATE_03_test_corpus.md` to `03_test_corpus.md`
2. Define your golden corpus strategy
3. Add corpus entries as contracts require them

### Step 6: Create Agent Prompt

1. Copy `TEMPLATE_AGENT_PROMPT.md` to `AGENT_PROMPT.md`
2. Customize for your project (tools, directories, workflows)
3. Use this to onboard AI agents to your project

## Document Structure

```
docs/plan/
├── README.md                    # This file (explains the system)
├── 00_vision.md                 # Architectural intent (non-executable)
├── 01_contracts.md             # Executable planning surface (SSOT for work)
├── 02_interfaces.md            # Authority boundaries
├── 03_test_corpus.md           # Golden corpus strategy
└── AGENT_PROMPT.md             # Agent onboarding prompt
```

## Workflow

### For Project Owners

1. **Write vision** (`00_vision.md`): Describe architectural intent, goals, constraints
2. **Create contracts** (`01_contracts.md`): Break vision into executable contracts with acceptance tests
3. **Define boundaries** (`02_interfaces.md`): Establish authority rules
4. **Set up corpus** (`03_test_corpus.md`): Define test strategy

### For AI Agents

1. **Read agent prompt** (`AGENT_PROMPT.md`): Understand project context and workflow
2. **Read contracts** (`01_contracts.md`): Find next `ready` or `in-progress` contract
3. **Run reality checks**: Verify current state before starting work
4. **Execute contract**: Implement, test, verify
5. **Update status**: Mark contract `done`, unblock dependencies

## Key Concepts

### Contract Statuses

- `draft`: Initial planning, needs review
- `ready`: Can be started (dependencies met)
- `in-progress`: Currently being worked on
- `blocked`: Waiting on something
- `done`: Completed and verified
- `deferred`: Not for this phase

### Reality Checks

Before starting any contract, verify:
- **Codebase**: What actually exists vs what's assumed
- **Database/Schema**: Current state via MCP tools or inspection
- **Artifacts**: Existing files, types, interfaces

### Acceptance Tests

Every contract must define:
- What "done" looks like
- How to verify the work
- Test cases that prove correctness

## Non-Production Assumption

This methodology assumes:
- **Not in production**: Schemas are mutable
- **No backfilling required**: Historical data safety is out of scope
- **Rapid iteration**: Contracts can reshape systems freely

If production constraints are needed, add them explicitly via contracts.

## Adapting to Your Project

### Replace Placeholders

Search for these placeholders and replace with your project details:
- `[PROJECT_NAME]`
- `[PROJECT_DESCRIPTION]`
- `[AUTHORITATIVE_LANGUAGE]` (e.g., Python, TypeScript)
- `[STORAGE_SYSTEM]` (e.g., Supabase, PostgreSQL)
- `[UI_FRAMEWORK]` (e.g., Next.js, React)

### Customize Workflows

Update:
- **Tools & Commands**: Add your project's specific tools
- **Directory Structure**: Update paths to match your repo
- **Verification Steps**: Add your project's testing/deployment steps

### Add Project-Specific Rules

In `02_interfaces.md`, define:
- Which system is authoritative for parsing/formatting
- Which system owns diff logic
- Which system owns translation/transformation logic
- Schema ownership rules

## Example: Starting a New Feature

1. **Add to vision** (`00_vision.md`): Describe the feature's architectural intent
2. **Create contract** (`01_contracts.md`): Define executable work with acceptance tests
3. **Update boundaries** (`02_interfaces.md`): If authority shifts, document it
4. **Add corpus entries** (`03_test_corpus.md`): If behavior needs locking, add tests
5. **Execute contract**: Follow agent workflow to implement

## Success Criteria

You'll know the system is working when:
- ✅ Agents can pick up work without confusion
- ✅ Contracts clearly define what's in/out of scope
- ✅ Reality checks prevent "it probably exists" assumptions
- ✅ Acceptance tests prove correctness
- ✅ Vision and contracts stay in sync

## Troubleshooting

**"Agent is working from vision directly"**
→ Remind: Vision is non-executable. All work must come from contracts.

**"Contract is too vague"**
→ Add more specific acceptance tests. Define "done" clearly.

**"Reality checks are failing"**
→ Document actual current state. Update contracts to match reality.

**"Tests are passing but behavior is wrong"**
→ Update corpus entries. Add more test cases. Refine acceptance criteria.

## Further Reading

- `TEMPLATE_00_vision.md`: How to write architectural intent
- `TEMPLATE_01_contracts.md`: How to create executable contracts
- `TEMPLATE_02_interfaces.md`: How to define authority boundaries
- `TEMPLATE_03_test_corpus.md`: How to prevent semantic drift
- `TEMPLATE_AGENT_PROMPT.md`: How to onboard AI agents

---

**Remember**: This is a methodology, not a rigid framework. Adapt it to your project's needs while preserving the core principles: vision vs contracts, reality checks, test-driven execution, and clear authority boundaries.

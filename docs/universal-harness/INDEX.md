# Universal Microcontracts Harness — File Index

This directory contains a complete, reusable methodology for AI-powered development using microcontracts.

## Files Overview

### Core Documentation

1. **README.md** — Main documentation explaining the system
   - What the harness is
   - Core principles
   - Quick start guide
   - Document structure
   - Workflow overview

2. **SETUP_PROMPT.md** — **AI Agent Setup Prompt** (use this for AI agents)
   - Self-contained prompt for AI agents
   - Includes all setup instructions
   - Reads and customizes templates automatically
   - Creates all necessary files

3. **QUICK_START.md** — Step-by-step setup guide (for human users)
   - How to copy and adapt the harness
   - Creating your first vision document
   - Setting up contracts
   - Executing your first contract

4. **INDEX.md** — This file (file index and usage guide)

### Templates

4. **TEMPLATE_00_vision.md** — Vision document template
   - Architectural intent (non-executable)
   - Executive goals
   - Current state vs target state
   - Implementation phases
   - Deferred enhancements

5. **TEMPLATE_01_contracts.md** — Contracts document template
   - Contract definition and template
   - Agent workflow rules
   - Status management
   - Example contract

6. **TEMPLATE_02_interfaces.md** — Interface boundaries template
   - Authority map
   - Specific authority rules
   - What agents cannot invent
   - Interface evolution rules

7. **TEMPLATE_03_test_corpus.md** — Test corpus template
   - Corpus purpose and structure
   - Categories and taxonomy
   - Rules for adding/updating entries
   - Contract-driven corpus management

8. **TEMPLATE_AGENT_PROMPT.md** — Agent onboarding prompt template
   - Role definition
   - Orientation checklist
   - Workflow instructions
   - Tools and commands
   - Verification checklist

## Usage Flow

### For AI Agents

```
1. Send SETUP_PROMPT.md + project plan to agent
   ↓
2. Agent reads templates and creates customized files
   ↓
3. Agent replaces all placeholders
   ↓
4. System is ready to use
```

### For Human Users

```
1. Read README.md
   ↓
2. Follow QUICK_START.md
   ↓
3. Copy templates to your project
   ↓
4. Customize for your project
   ↓
5. Create vision document
   ↓
6. Create first contract
   ↓
7. Execute contracts one by one
```

## File Relationships

```
README.md (overview)
    ↓
QUICK_START.md (setup)
    ↓
TEMPLATE_00_vision.md → 00_vision.md (your vision)
    ↓
TEMPLATE_01_contracts.md → 01_contracts.md (your contracts)
    ↓
TEMPLATE_AGENT_PROMPT.md → AGENT_PROMPT.md (agent onboarding)
    ↓
TEMPLATE_02_interfaces.md → 02_interfaces.md (authority boundaries)
    ↓
TEMPLATE_03_test_corpus.md → 03_test_corpus.md (test strategy)
```

## Key Concepts

### Vision vs Contracts
- **Vision**: Architectural intent, non-executable, describes "why" and "what direction"
- **Contracts**: Executable planning surface, describes "what work" with acceptance tests

### Contract Lifecycle
```
draft → ready → in-progress → done
                ↓
            blocked (if needed)
```

### Reality Checks
Before starting any contract:
- Verify codebase state
- Verify database/schema state
- Verify artifact state
- Document findings

### Acceptance Tests
Every contract must define:
- What "done" looks like
- How to verify correctness
- Test cases that prove the work

## Adapting to Your Project

### Step 1: Replace Placeholders
Search for and replace:
- `[PROJECT_NAME]`
- `[PROJECT_DESCRIPTION]`
- `[AUTHORITATIVE_LANGUAGE]`
- `[STORAGE_SYSTEM]`
- `[UI_FRAMEWORK]`
- Other project-specific placeholders

### Step 2: Customize Workflows
Update:
- Tools and commands
- Directory structure
- Verification steps
- Development servers

### Step 3: Define Boundaries
In `02_interfaces.md`:
- Which system owns what
- Authority rules
- What agents cannot invent

### Step 4: Set Up Corpus
In `03_test_corpus.md`:
- Input types
- Test categories
- Preservation properties

## Best Practices

1. **Start small**: Create one contract, execute it, learn
2. **Be specific**: Vague contracts lead to confusion
3. **Reality check**: Never assume, always verify
4. **Test first**: Define acceptance tests before implementation
5. **Update status**: Keep contract status current
6. **Sync vision**: Keep vision and contracts aligned

## Common Patterns

### Pattern: Breaking Down Work
1. Add to vision as a phase
2. Create multiple contracts (C1.1, C1.2, C1.3)
3. Define dependencies
4. Execute sequentially

### Pattern: Handling Uncertainty
1. Add reality checks to contract
2. Mark as `blocked` if needed
3. Create contract to resolve uncertainty
4. Unblock original contract

### Pattern: Learning and Adapting
1. Execute contracts
2. Learn from implementation
3. Update vision based on learnings
4. Create new contracts

## Success Indicators

You'll know the system is working when:
- ✅ Agents can pick up work without confusion
- ✅ Contracts clearly define scope
- ✅ Reality checks prevent assumptions
- ✅ Acceptance tests prove correctness
- ✅ Vision and contracts stay in sync

## Next Steps

1. **Read README.md** to understand the system
2. **Follow QUICK_START.md** to set up your project
3. **Copy templates** and customize them
4. **Create your first contract** and execute it
5. **Iterate and improve** as you learn

---

**Remember**: This is a methodology, not a rigid framework. Adapt it to your needs while preserving core principles.

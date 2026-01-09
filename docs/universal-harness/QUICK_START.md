# Quick Start Guide: Setting Up the Microcontracts System

This guide walks you through setting up the microcontracts system for a new project.

> **For AI Agents**: Use `SETUP_PROMPT.md` instead. This guide is optimized for human users who want to set up the system manually or understand the process.

## Step 1: Copy the Harness

```bash
# From your project root
mkdir -p docs/plan
cp -r universal-harness/* docs/plan/
```

## Step 2: Create Your Vision Document

1. Copy the template:
   ```bash
   cp docs/plan/TEMPLATE_00_vision.md docs/plan/00_vision.md
   ```

2. Fill in your project details:
   - Replace `[PROJECT_NAME]` with your actual project name
   - Replace `[High-Level Description]` with what your system does
   - Define your executive goals (G1, G2, G3)
   - Describe your architectural shift (Before → After)
   - Document current state (what exists, what's missing)
   - Define your implementation phases

3. **Remember**: This is architectural intent, NOT a task list. Keep it high-level.

## Step 3: Create Your Contracts Document

1. Copy the template:
   ```bash
   cp docs/plan/TEMPLATE_01_contracts.md docs/plan/01_contracts.md
   ```

2. Read the contract template section carefully

3. Create your first contract:
   - Pick a small, well-defined piece of work from your vision
   - Use the contract template
   - Fill in ALL sections (scope, tests, reality checks, etc.)
   - Mark it as `draft` initially

4. **Key sections to focus on**:
   - **Scope**: Be very specific about what's in/out
   - **Acceptance Tests**: Define how you'll know it's done
   - **Reality Checks**: List what you need to verify before starting

## Step 4: Set Up Interface Boundaries

1. Copy the template:
   ```bash
   cp docs/plan/TEMPLATE_02_interfaces.md docs/plan/02_interfaces.md
   ```

2. Define your authority boundaries:
   - Which system owns parsing/formatting?
   - Which system owns diff logic?
   - Which system owns data storage?
   - What are the rules for each?

3. **Example**: If Python is authoritative for parsing, state that clearly and forbid other systems from implementing parsing logic.

## Step 5: Set Up Test Corpus

1. Copy the template:
   ```bash
   cp docs/plan/TEMPLATE_03_test_corpus.md docs/plan/03_test_corpus.md
   ```

2. Define your corpus strategy:
   - What types of inputs do you need to test?
   - What properties must be preserved?
   - What categories of test cases do you need?

3. **Don't add entries yet** - wait until contracts require them

## Step 6: Create Agent Prompt

1. Copy the template:
   ```bash
   cp docs/plan/TEMPLATE_AGENT_PROMPT.md docs/plan/AGENT_PROMPT.md
   ```

2. Customize for your project:
   - Replace `[PROJECT_NAME]` with your project name
   - List your actual directories
   - Document your actual tools and commands
   - Define your verification workflows
   - Add project-specific rules

3. **Test it**: Try using the prompt with an AI agent to see if it's clear

## Step 7: Create Your First Contract

Now that the system is set up, create your first real contract:

1. **Pick something small** from your vision (Phase 0 or Phase 1)

2. **Use the contract template**:
   ```markdown
   ### C0.1 — [Your First Task]
   
   - **ID**: `C0.1`
   - **Status**: `draft`
   - **Origin (Vision Reference)**: `docs/plan/00_vision.md` → "### 0.1 [Task Name]"
   
   #### Scope
   - **In scope**: [What you'll do]
   - **Out of scope**: [What you won't do]
   
   #### Acceptance Tests
   1. [Test 1] - `[ ]`
   2. [Test 2] - `[ ]`
   
   #### Reality-Check Requirements
   - **Codebase checks**: [What to verify]
   ```

3. **Run reality checks**: Before marking as `ready`, verify current state

4. **Mark as `ready`**: Once dependencies are met and reality checks pass

## Step 8: Execute Your First Contract

1. **Read the agent prompt**: `docs/plan/AGENT_PROMPT.md`

2. **Start the contract**:
   - Update status to `in-progress`
   - Run reality checks
   - Begin implementation

3. **Work incrementally**:
   - Make small changes
   - Check off tests as you complete them
   - Update status as you go

4. **Complete the contract**:
   - Verify all tests pass
   - Update status to `done`
   - Check if any blocked contracts can now be `ready`

## Common Patterns

### Pattern 1: Breaking Down a Large Feature

1. Add feature to vision (`00_vision.md`) as a phase
2. Create multiple contracts (C1.1, C1.2, C1.3, etc.) breaking it down
3. Define dependencies between contracts
4. Execute one at a time

### Pattern 2: Handling Uncertainty

1. Add reality-check requirements to contract
2. Mark contract as `blocked` if uncertainty prevents work
3. Create a separate contract to resolve uncertainty
4. Unblock original contract once resolved

### Pattern 3: Updating Vision Based on Learnings

1. Complete contracts and learn from implementation
2. Update `00_vision.md` to reflect new understanding
3. Create new contracts based on updated vision
4. Keep vision and contracts in sync

## Checklist: Is Your System Ready?

- [ ] Vision document exists and describes architectural intent
- [ ] Contracts document exists with at least one contract
- [ ] Interface boundaries are defined
- [ ] Test corpus strategy is documented
- [ ] Agent prompt is customized for your project
- [ ] First contract has clear scope and acceptance tests
- [ ] Reality checks are defined for first contract

## Next Steps

1. **Execute your first contract**: Follow the agent workflow
2. **Learn and adapt**: Refine the system as you use it
3. **Scale up**: Create more contracts as your project grows
4. **Maintain**: Keep vision and contracts in sync

## Troubleshooting

**"I don't know what to put in the vision"**
→ Start with: What problem are you solving? What are your non-negotiable goals? What's the current state vs target state?

**"My contract is too vague"**
→ Add more specific acceptance tests. Ask: "How will I know this is done?" Then write tests for that.

**"I'm not sure what the current state is"**
→ That's what reality checks are for! Add them to your contract, run them, and document findings.

**"The agent is confused"**
→ Review your agent prompt. Is it specific enough? Does it reference the right files? Are the workflows clear?

## Getting Help

- Review the templates: Each template has usage notes
- Check the README: `docs/plan/README.md` explains the system
- Look at examples: Your existing contracts are examples
- Iterate: The system improves as you use it

---

**Remember**: This is a methodology, not a rigid framework. Start simple, learn as you go, and adapt to your project's needs.

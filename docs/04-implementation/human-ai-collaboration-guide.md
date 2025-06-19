# Human-AI Collaboration Guide - Smaragdus Viridi

## 🤝 Collaboration Framework

This guide establishes effective patterns for human-AI collaboration throughout the Smaragdus Viridi development lifecycle.

## 📋 Core Collaboration Principles

### 1. Clear Communication Patterns

- **Start with context**: Always reference current documentation, not legacy
- **Be specific**: "Implement user authentication using Supabase Auth" vs "Add login"
- **Reference documentation**: "@docs/03-architecture/system-overview.md for auth patterns"
- **Specify scope**: "Focus on just the login form, not the entire auth flow"

### 2. Iterative Development Approach

- **One feature at a time**: Complete discrete features before moving to next
- **Validate each step**: Test and review before proceeding
- **Document decisions**: Update relevant docs when implementation differs from plan

## 🔄 Development Workflow Patterns

### Pattern 1: Feature Implementation

```
Human: Start feature → AI: Implementation → Human: Review → AI: Refine → Human: Approve
```

**Example Flow:**

1. **Human**: "Let's implement the gemstone catalog filtering. Start with the color filter component."
2. **AI**: Creates `ColorFilter.tsx` with proper TypeScript types from our schema
3. **Human**: Reviews code, tests functionality, provides feedback
4. **AI**: Refines based on feedback, updates tests
5. **Human**: Approves and commits, moves to next component

### Pattern 2: Problem-Solving

```
Human: Issue → AI: Analysis → Human: Context → AI: Solution → Human: Validation
```

**Example Flow:**

1. **Human**: "The gemstone search is slow with 1000+ stones"
2. **AI**: Analyzes filtering logic, identifies performance bottlenecks
3. **Human**: "We need to maintain real-time filtering for user experience"
4. **AI**: Proposes debounced search + virtualization solution
5. **Human**: Tests solution, validates performance metrics

### Pattern 3: Architecture Decisions

```
Human: Challenge → AI: Options → Human: Constraints → AI: Recommendation → Human: Decision
```

## 🎯 Task Types and Collaboration Approaches

### A. Code Implementation Tasks

**Human Role:**

- Define requirements and acceptance criteria
- Provide business context and constraints
- Review and test implementations
- Make final decisions on architecture

**AI Role:**

- Implement features according to specifications
- Follow established patterns and standards
- Suggest optimizations and improvements
- Handle routine coding tasks

**Best Practices:**

- Reference specific documentation: `@docs/05-features/catalog-filtering.md`
- Use project terminology: "gemstone", "cut", "clarity" (not generic "product")
- Follow TypeScript standards: Always use proper types, never `any`
- Apply Supabase patterns: Use MCP tools, not CLI commands

### B. Documentation and Planning

**Human Role:**

- Set priorities and business objectives
- Validate technical feasibility
- Approve major architectural decisions
- Update living documentation

**AI Role:**

- Create technical documentation
- Generate implementation plans
- Update tracking documents
- Maintain code documentation

**Best Practices:**

- Always update `docs/06-tracking/LIVING_PLAN.md` after completing features
- Reference current docs, never legacy archives
- Include realistic time estimates and dependencies

### C. Debugging and Troubleshooting

**Human Role:**

- Reproduce issues in development environment
- Provide runtime context and error logs
- Test proposed solutions
- Validate fixes across different scenarios

**AI Role:**

- Analyze error patterns and logs
- Identify root causes
- Propose solutions with fallbacks
- Implement fixes with proper error handling

## 🛠️ Effective Communication Templates

### Starting a Development Session

```
"Let's work on [specific feature] from @docs/05-features/[feature-name].md.
Current status: [what's done]
Next step: [specific task]
Context: [any relevant constraints or decisions]"
```

### Reporting Issues

```
"Issue with [component/feature]:
- Expected: [behavior]
- Actual: [behavior]
- Environment: [dev/staging/production]
- Error logs: [specific errors]
- Related files: [file paths]"
```

### Requesting Code Review

```
"Please review [component/feature]:
- Files changed: [list]
- Key changes: [summary]
- Testing done: [what was tested]
- Questions: [specific concerns]"
```

### Architecture Discussions

```
"Architecture decision needed for [feature]:
- Requirements: [functional needs]
- Constraints: [technical/business limits]
- Options considered: [alternatives]
- Recommendation needed: [specific decision point]"
```

## 🔍 Quality Checkpoints

### Before Starting Implementation

- [ ] Requirements clearly defined in current documentation
- [ ] Architecture patterns established
- [ ] Dependencies identified and available
- [ ] Success criteria defined

### During Implementation

- [ ] Following established coding standards
- [ ] Using current documentation, not legacy
- [ ] Implementing proper error handling
- [ ] Adding appropriate tests

### Before Completion

- [ ] Code review completed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Performance validated
- [ ] Integration tested

## 📊 Progress Tracking Integration

### Daily Sync Pattern

1. **Human**: Reviews progress in `docs/06-tracking/LIVING_PLAN.md`
2. **AI**: Updates completion status and identifies blockers
3. **Together**: Plan next priority tasks
4. **AI**: Updates tracking documents

### Weekly Review Pattern

1. **Human**: Evaluates sprint progress against goals
2. **AI**: Generates progress reports and metrics
3. **Together**: Adjust priorities and timeline
4. **Human**: Updates stakeholder communications

## 🚀 Advanced Collaboration Techniques

### Pair Programming Sessions

- **Human**: Drives overall direction and business logic
- **AI**: Handles implementation details and syntax
- **Shared**: Architecture decisions and problem-solving

### Code Review Sessions

- **AI**: Identifies patterns, standards compliance, potential issues
- **Human**: Validates business logic, user experience, security

### Testing Collaboration

- **AI**: Generates comprehensive test cases and edge cases
- **Human**: Validates test scenarios against real-world usage
- **Shared**: Integration testing and user acceptance testing

## 🔧 Tool Integration

### Supabase Development

- **Always use MCP tools**: `mcp_supabase_*` commands
- **Never use CLI**: Avoid `supabase` command line tools
- **Real-time collaboration**: Use MCP for schema changes, function deployment

### Git Workflow

- **Conventional commits**: Follow established format
- **Feature branches**: One feature per branch
- **Review process**: Human approval before merge

### Documentation Maintenance

- **Living documents**: Update as changes occur
- **Version control**: Track documentation changes
- **Cross-references**: Maintain links between related docs

## ⚠️ Common Pitfalls to Avoid

### For Humans:

- ❌ Referencing legacy documentation paths
- ❌ Providing vague requirements ("make it better")
- ❌ Skipping code review and testing phases
- ❌ Not updating documentation after changes

### For AI:

- ❌ Using archived documentation for current implementation
- ❌ Implementing without understanding business context
- ❌ Making architecture decisions without human input
- ❌ Proceeding with incomplete requirements

## 📈 Success Metrics

### Collaboration Effectiveness

- **Response time**: How quickly issues are resolved
- **Iteration cycles**: Number of back-and-forth exchanges needed
- **Code quality**: Review feedback and bug rates
- **Documentation accuracy**: How often docs match implementation

### Project Progress

- **Feature completion rate**: Stories delivered per sprint
- **Technical debt**: Code quality and maintainability
- **Performance metrics**: App speed and responsiveness
- **User satisfaction**: Feedback on implemented features

---

**Last Updated**: January 2025  
**Status**: Active collaboration guide  
**Next Review**: After first sprint completion

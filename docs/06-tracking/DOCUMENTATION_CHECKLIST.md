# 📋 Documentation Update Checklist

## Pre-Update Validation Process

**BEFORE making ANY changes to LIVING_PLAN.md, complete this checklist:**

### 1. Section Analysis

- [ ] **Search for existing content**: Use Ctrl+F to search for similar section names
- [ ] **Check header hierarchy**: Ensure consistent structure (### for sprints, #### for sub-sections)
- [ ] **Verify sprint numbering**: Count existing sprints to avoid duplicates

### 2. Timeline Validation

- [ ] **Week calculation**: Verify week ranges don't overlap
- [ ] **Sprint duration**: Confirm 2-week sprint pattern consistency
- [ ] **Total timeline**: Update overall project timeline if adding sprints

### 3. Content Consistency

- [ ] **Status markers**: Use consistent symbols (✅ ❌ 🚧 ⏳ 📋)
- [ ] **Format validation**: Check deliverables and success metrics formatting
- [ ] **Date accuracy**: Ensure all dates are current and realistic

## Documentation Review Checklist

**AFTER making changes, validate:**

### Structure Validation

- [ ] **No duplicate sprint numbers** (search for "Sprint [0-9]:")
- [ ] **Consistent timeline references** (weeks align with sprint numbers)
- [ ] **Aligned sprint numbering** (sequential, no gaps)
- [ ] **Accurate week calculations** (2-week sprints, no overlaps)

### Content Quality

- [ ] **Clear deliverables** (specific, measurable outcomes)
- [ ] **Realistic success metrics** (achievable targets)
- [ ] **Proper status updates** (reflects actual progress)
- [ ] **Consistent formatting** (code blocks, bullets, tables)

### Cross-Reference Check

- [ ] **Executive dashboard alignment** (matches sprint progress)
- [ ] **Risk assessment currency** (reflects current state)
- [ ] **KPI consistency** (timeline matches project scope)

## Quick Validation Commands

```bash
# Check for duplicate sprint numbers
grep -n "Sprint [0-9]" docs/06-tracking/LIVING_PLAN.md

# Verify week ranges
grep -n "Weeks [0-9]" docs/06-tracking/LIVING_PLAN.md

# Find inconsistent headers
grep -n "^##" docs/06-tracking/LIVING_PLAN.md
```

## Rollback Process

If validation fails:

1. **Stop immediately** - don't commit changes
2. **Identify specific issues** using checklist
3. **Fix systematically** - one issue at a time
4. **Re-validate** using full checklist
5. **Document lessons learned** in this file

---

**Last Updated**: January 26, 2025
**Version**: 1.0

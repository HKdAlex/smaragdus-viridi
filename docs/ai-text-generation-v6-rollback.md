# AI Text Generation v6 - Rollback Procedure

## Overview

This document describes how to safely rollback the v6 AI text generation system if needed.

## When to Rollback

Consider rollback if:

- Generated content quality is consistently poor
- System errors prevent reliable text generation
- Cost/performance issues make the system impractical
- Business requirements change before production deployment

## Rollback Steps

### 1. Stop All Generation Processes

Ensure no text generation scripts are currently running:

```bash
# Check for running processes
ps aux | grep test-text-generation-v6
ps aux | grep backfill-text-v6

# Kill any running processes if needed
pkill -f test-text-generation-v6
```

### 2. Backup Generated Data (Optional)

If you want to preserve generated content for analysis:

```sql
-- Export v6 data to CSV
COPY (
  SELECT * FROM gemstones_ai_v6
) TO '/tmp/gemstones_ai_v6_backup.csv' WITH CSV HEADER;
```

### 3. Run Rollback Migration

Execute the rollback SQL script via Supabase MCP tool:

```bash
# The rollback script will:
# 1. Drop ai_text_generated_v6 columns from gemstones table
# 2. Drop gemstones_ai_v6 table
```

Or manually via psql:

```bash
psql -h <host> -U <user> -d <database> -f migrations/rollback_ai_v6.sql
```

### 4. Verify Rollback

Check that tables and columns are removed:

```sql
-- Should return no rows
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'gemstones'
  AND column_name IN ('ai_text_generated_v6', 'ai_text_generated_v6_date');

-- Should return false
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'gemstones_ai_v6'
);
```

### 5. Regenerate TypeScript Types

Update your database types to reflect the rollback:

```bash
npm run types:generate
```

### 6. Remove v6 Code (Optional)

If permanently abandoning v6, remove the code:

```bash
rm -rf scripts/ai-analysis-v6
rm scripts/test-text-generation-v6.mjs
rm scripts/backfill-text-v6.mjs
```

## Data Impact

**WARNING**: Rollback will permanently delete:

- All generated text content in `gemstones_ai_v6` table
- Tracking flags `ai_text_generated_v6` and `ai_text_generated_v6_date` from `gemstones` table

**Safe**: Rollback does NOT affect:

- Original gemstone data
- Existing v4/v5 AI analysis results
- Gemstone images or media files
- Any manual metadata

## Re-enabling v6

To re-enable after rollback:

1. Run the forward migration: `20251016_add_ai_v6_text_generation.sql`
2. Regenerate TypeScript types
3. Re-run test generation on small batch
4. Resume normal v6 operations

## Support

If you encounter issues during rollback:

1. Check PostgreSQL logs for constraint violations
2. Verify no foreign key dependencies on v6 tables
3. Ensure sufficient database permissions for DROP operations
4. Contact system administrator if cascading deletes fail


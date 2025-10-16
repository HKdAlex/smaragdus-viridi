# AI Analysis v5 Rollback Procedure

This document describes the steps required to rollback the AI Analysis v5 pipeline and return to the v4 system.

## When to use

- v5 structured extraction produces invalid or low-confidence data.
- Testing phase uncovered regressions.
- You need to temporarily revert to the v4 implementation.

## Prerequisites

- No v5 analysis jobs running.
- Database access via `mcp` or Supabase SQL editor.
- Git access to revert code changes.

## Steps

1. **Stop v5 scripts**

   - Ensure no background job or developer script is invoking `scripts/ai-analysis-v5`.

2. **Drop v5 tables & columns**

   - Run the rollback SQL:

     ```sql
     -- migrations/rollback_ai_v5.sql
     DROP TABLE IF EXISTS gemstones_ai_v5 CASCADE;
     DROP TABLE IF EXISTS gem_image_extractions CASCADE;

     ALTER TABLE gemstones
       DROP COLUMN IF EXISTS ai_analysis_v5,
       DROP COLUMN IF EXISTS ai_analysis_v5_date;
     ```

3. **Revert code changes**

   - `git checkout main`
   - `git branch -D feature/ai-analysis-v5` (if branch exists)
   - `git reset --hard origin/main`

4. **Verify**
   - Confirm `gemstones_ai_v5` table no longer exists.
   - Ensure `scripts/ai-analysis/` (v4) still works by running existing tests.

## Notes

- Dropping tables will remove any v5 analysis data. Ensure you no longer need v5 results before rollback.
- The rollback does not impact `ai_analysis_results` or `gemstones.ai_*` fields.
- If you later re-enable v5, re-run the migration and redeploy the code changes.


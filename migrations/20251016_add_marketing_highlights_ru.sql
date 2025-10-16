-- Add Russian marketing highlights to gemstones_ai_v6 table
-- Migration: 20251016_add_marketing_highlights_ru
-- Description: Add marketing_highlights_ru column for bilingual marketing content

-- Add the new column
ALTER TABLE gemstones_ai_v6
ADD COLUMN IF NOT EXISTS marketing_highlights_ru TEXT[];

-- Add a comment to document the column
COMMENT ON COLUMN gemstones_ai_v6.marketing_highlights_ru IS 
  'Array of 3-5 key marketing highlights in Russian, mirroring marketing_highlights';

-- Note: Existing records will have NULL for marketing_highlights_ru
-- They can be backfilled by re-running the AI generation pipeline


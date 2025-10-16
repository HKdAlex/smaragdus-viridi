-- Add Russian promotional text to gemstones_ai_v6 table
-- Migration: 20251016_add_promotional_text_ru
-- Description: Add promotional_text_ru column for bilingual promotional content

-- Add the new column
ALTER TABLE gemstones_ai_v6
ADD COLUMN IF NOT EXISTS promotional_text_ru TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN gemstones_ai_v6.promotional_text_ru IS 
  'Promotional text in Russian highlighting special occasions/use cases (100-150 words)';

-- Note: Existing records will have NULL for promotional_text_ru
-- They can be backfilled by re-running the AI generation pipeline


-- Migration: Remove redundant ai_analyzed field
-- This removes the ai_analyzed field from gemstones table since all data has been migrated to ai_text_generated_v6

-- Verify migration is complete (should show 0 records with only ai_analyzed=true)
SELECT 
  COUNT(*) as only_ai_analyzed_count
FROM gemstones 
WHERE ai_analyzed = true AND ai_text_generated_v6 = false;

-- Remove the ai_analyzed column from gemstones table
ALTER TABLE gemstones DROP COLUMN IF EXISTS ai_analyzed;

-- Also remove from related tables that might have this field
ALTER TABLE gemstone_images DROP COLUMN IF EXISTS ai_analyzed;
ALTER TABLE gemstone_videos DROP COLUMN IF EXISTS ai_analyzed;

-- Note: Views and other database objects will need to be updated separately
-- Check for any views or functions that reference ai_analyzed

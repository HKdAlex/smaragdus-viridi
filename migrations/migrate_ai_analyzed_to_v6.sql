-- Migration: Update ai_analyzed records to ai_text_generated_v6
-- This migrates the 25 gemstones that have ai_analyzed=true but ai_text_generated_v6=false

-- First, let's see what we're working with
SELECT 
  id, 
  serial_number, 
  ai_analyzed, 
  ai_text_generated_v6,
  ai_analysis_date,
  ai_text_generated_v6_date
FROM gemstones 
WHERE ai_analyzed = true AND ai_text_generated_v6 = false
ORDER BY created_at DESC;

-- Update the ai_text_generated_v6 field for gemstones that have ai_analyzed=true
-- but don't have ai_text_generated_v6=true
UPDATE gemstones 
SET 
  ai_text_generated_v6 = true,
  ai_text_generated_v6_date = COALESCE(ai_analysis_date, NOW())
WHERE ai_analyzed = true 
  AND ai_text_generated_v6 = false;

-- Verify the migration
SELECT 
  COUNT(*) as total_gemstones,
  COUNT(CASE WHEN ai_analyzed = true THEN 1 END) as ai_analyzed_true,
  COUNT(CASE WHEN ai_text_generated_v6 = true THEN 1 END) as ai_text_generated_v6_true,
  COUNT(CASE WHEN ai_analyzed = true AND ai_text_generated_v6 = true THEN 1 END) as overlap_count
FROM gemstones;

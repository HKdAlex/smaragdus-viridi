-- Migration: Add AI-extracted fields to gemstones table
-- Date: 2025-10-15
-- Purpose: Store AI-extracted data alongside manual data without overwriting

-- Physical properties from AI
ALTER TABLE gemstones
ADD COLUMN IF NOT EXISTS ai_weight_carats NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS ai_length_mm NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS ai_width_mm NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS ai_depth_mm NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS ai_color TEXT,
ADD COLUMN IF NOT EXISTS ai_clarity TEXT,
ADD COLUMN IF NOT EXISTS ai_cut TEXT,
ADD COLUMN IF NOT EXISTS ai_origin TEXT,
ADD COLUMN IF NOT EXISTS ai_treatment TEXT,
ADD COLUMN IF NOT EXISTS ai_quality_grade TEXT,
ADD COLUMN IF NOT EXISTS ai_extracted_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_extraction_confidence NUMERIC(4,3);

-- Metadata
COMMENT ON COLUMN gemstones.ai_weight_carats IS 'AI-extracted weight in carats from image analysis';
COMMENT ON COLUMN gemstones.ai_extraction_confidence IS 'Confidence score for AI-extracted data (0-1)';

-- Create view for best-value fallback (manual > AI)
CREATE OR REPLACE VIEW gemstones_with_best_data AS
SELECT 
  g.*,
  COALESCE(g.weight_carats, g.ai_weight_carats) as best_weight_carats,
  COALESCE(g.length_mm, g.ai_length_mm) as best_length_mm,
  COALESCE(g.width_mm, g.ai_width_mm) as best_width_mm,
  COALESCE(g.depth_mm, g.ai_depth_mm) as best_depth_mm,
  COALESCE(g.color::text, g.ai_color) as best_color,
  COALESCE(g.clarity::text, g.ai_clarity) as best_clarity,
  COALESCE(g.cut::text, g.ai_cut) as best_cut,
  CASE 
    WHEN g.weight_carats IS NOT NULL THEN 'manual'
    WHEN g.ai_weight_carats IS NOT NULL THEN 'ai'
    ELSE NULL
  END as weight_source
FROM gemstones g;

-- Create index on ai_extracted_date for efficient querying
CREATE INDEX IF NOT EXISTS idx_gemstones_ai_extracted_date
ON gemstones(ai_extracted_date)
WHERE ai_extracted_date IS NOT NULL;


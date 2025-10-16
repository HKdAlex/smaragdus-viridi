-- Add image analysis fields to gemstones_ai_v6 table
-- These fields store results from AI-powered image analysis

ALTER TABLE gemstones_ai_v6
  ADD COLUMN IF NOT EXISTS detected_cut TEXT,
  ADD COLUMN IF NOT EXISTS cut_detection_confidence NUMERIC(3,2) CHECK (cut_detection_confidence >= 0 AND cut_detection_confidence <= 1),
  ADD COLUMN IF NOT EXISTS cut_matches_metadata BOOLEAN,
  ADD COLUMN IF NOT EXISTS cut_detection_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS recommended_primary_image_index INTEGER,
  ADD COLUMN IF NOT EXISTS primary_image_selection_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS image_quality_scores JSONB;

-- Add comments for documentation
COMMENT ON COLUMN gemstones_ai_v6.detected_cut IS 'Cut/shape detected by AI vision analysis (e.g., round, princess, emerald)';
COMMENT ON COLUMN gemstones_ai_v6.cut_detection_confidence IS 'Confidence score (0-1) for the detected cut';
COMMENT ON COLUMN gemstones_ai_v6.cut_matches_metadata IS 'Whether AI-detected cut matches the database metadata';
COMMENT ON COLUMN gemstones_ai_v6.cut_detection_reasoning IS 'AI explanation for the cut detection';
COMMENT ON COLUMN gemstones_ai_v6.recommended_primary_image_index IS 'AI-recommended index for best primary image (0-based)';
COMMENT ON COLUMN gemstones_ai_v6.primary_image_selection_reasoning IS 'AI explanation for primary image selection';
COMMENT ON COLUMN gemstones_ai_v6.image_quality_scores IS 'Detailed quality scores for each analyzed image (JSON array)';

-- Create an index for finding gems with mismatched cuts
CREATE INDEX IF NOT EXISTS idx_gemstones_ai_v6_cut_mismatch 
  ON gemstones_ai_v6(cut_matches_metadata) 
  WHERE cut_matches_metadata = false;


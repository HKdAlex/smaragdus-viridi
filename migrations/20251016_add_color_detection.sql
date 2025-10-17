-- Add color detection fields to gemstones_ai_v6 table
-- These fields store AI color analysis results

ALTER TABLE gemstones_ai_v6
ADD COLUMN IF NOT EXISTS detected_color TEXT,
ADD COLUMN IF NOT EXISTS color_detection_confidence NUMERIC(3,2) CHECK (color_detection_confidence >= 0 AND color_detection_confidence <= 1),
ADD COLUMN IF NOT EXISTS color_matches_metadata BOOLEAN,
ADD COLUMN IF NOT EXISTS color_detection_reasoning TEXT,
ADD COLUMN IF NOT EXISTS detected_color_description TEXT;

-- Add an index to quickly find gemstones where AI detected a color mismatch
CREATE INDEX IF NOT EXISTS idx_gemstones_ai_v6_color_mismatch
ON gemstones_ai_v6(color_matches_metadata)
WHERE color_matches_metadata = false;

-- Add an index for color detection confidence
CREATE INDEX IF NOT EXISTS idx_gemstones_ai_v6_color_confidence
ON gemstones_ai_v6(color_detection_confidence)
WHERE color_detection_confidence < 0.6;

-- Add foreign key constraint to colors table
ALTER TABLE gemstones_ai_v6
ADD CONSTRAINT fk_gemstones_ai_v6_detected_color 
FOREIGN KEY (detected_color) REFERENCES colors(color_code);

-- Add comments
COMMENT ON COLUMN gemstones_ai_v6.detected_color IS 'Primary color detected by AI analysis';
COMMENT ON COLUMN gemstones_ai_v6.color_detection_confidence IS 'Confidence score for color detection (0-1)';
COMMENT ON COLUMN gemstones_ai_v6.color_matches_metadata IS 'Whether AI-detected color matches manual metadata';
COMMENT ON COLUMN gemstones_ai_v6.color_detection_reasoning IS 'AI reasoning for color detection';
COMMENT ON COLUMN gemstones_ai_v6.detected_color_description IS 'Detailed color description from AI (e.g., smoky brown with amber undertones)';


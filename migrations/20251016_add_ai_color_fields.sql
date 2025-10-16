-- Add AI-specific color fields to gemstones table
-- These fields store AI-detected colors that override manual metadata

ALTER TABLE gemstones
ADD COLUMN IF NOT EXISTS ai_color TEXT,
ADD COLUMN IF NOT EXISTS ai_color_code TEXT,
ADD COLUMN IF NOT EXISTS ai_color_description TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_gemstones_ai_color ON gemstones(ai_color);
CREATE INDEX IF NOT EXISTS idx_gemstones_color ON gemstones(color);

-- Add foreign key constraint to colors table for AI color (text field)
ALTER TABLE gemstones
ADD CONSTRAINT fk_gemstones_ai_color 
FOREIGN KEY (ai_color) REFERENCES colors(color_code);

-- Note: color column uses gem_color enum type, so no FK constraint needed

-- Add comments
COMMENT ON COLUMN gemstones.ai_color IS 'AI-detected primary color (overrides color field if present)';
COMMENT ON COLUMN gemstones.ai_color_code IS 'AI-detected color code (overrides color_code if present)';
COMMENT ON COLUMN gemstones.ai_color_description IS 'Detailed AI color description (e.g., smoky brown, light pink)';

-- Add multilingual description fields to gemstones table
ALTER TABLE gemstones
ADD COLUMN IF NOT EXISTS description_technical_ru TEXT,
ADD COLUMN IF NOT EXISTS description_technical_en TEXT,
ADD COLUMN IF NOT EXISTS description_emotional_ru TEXT,
ADD COLUMN IF NOT EXISTS description_emotional_en TEXT,
ADD COLUMN IF NOT EXISTS narrative_story_ru TEXT,
ADD COLUMN IF NOT EXISTS narrative_story_en TEXT,
ADD COLUMN IF NOT EXISTS ai_description_model VARCHAR(50),
ADD COLUMN IF NOT EXISTS ai_description_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_description_cost_usd NUMERIC(10,4);

-- Optional index for technical description search in Russian
CREATE INDEX IF NOT EXISTS idx_gemstones_description_technical_ru
ON gemstones USING GIN (to_tsvector('russian', coalesce(description_technical_ru, '')));

-- Track description generation data in ai_analysis_results
ALTER TABLE ai_analysis_results
ADD COLUMN IF NOT EXISTS description_data JSONB;

COMMENT ON COLUMN gemstones.description_technical_ru IS 'AI-generated technical description in Russian for professional buyers';
COMMENT ON COLUMN gemstones.description_technical_en IS 'AI-generated technical description in English';
COMMENT ON COLUMN gemstones.description_emotional_ru IS 'AI-generated emotional description in Russian for retail customers';
COMMENT ON COLUMN gemstones.description_emotional_en IS 'AI-generated emotional description in English';
COMMENT ON COLUMN gemstones.narrative_story_ru IS 'AI-generated unique narrative story in Russian';
COMMENT ON COLUMN gemstones.narrative_story_en IS 'AI-generated unique narrative story in English';
COMMENT ON COLUMN gemstones.ai_description_model IS 'Model used for AI-generated descriptions';
COMMENT ON COLUMN gemstones.ai_description_date IS 'Timestamp when AI descriptions were generated';
COMMENT ON COLUMN gemstones.ai_description_cost_usd IS 'Cost in USD for generating AI descriptions';
COMMENT ON COLUMN ai_analysis_results.description_data IS 'Generated descriptions with metadata (theme, audience, uniqueness)';


-- Rollback: Remove AI Analysis v5 tables and columns

DROP TABLE IF EXISTS gemstones_ai_v5 CASCADE;
DROP TABLE IF EXISTS gem_image_extractions CASCADE;

ALTER TABLE gemstones
  DROP COLUMN IF EXISTS ai_analysis_v5,
  DROP COLUMN IF EXISTS ai_analysis_v5_date;


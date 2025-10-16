-- Rollback: AI Text Generation v6
-- Description: Removes v6 text generation tables and tracking columns

-- Drop tracking columns from gemstones table
ALTER TABLE gemstones
  DROP COLUMN IF EXISTS ai_text_generated_v6,
  DROP COLUMN IF EXISTS ai_text_generated_v6_date;

-- Drop v6 table
DROP TABLE IF EXISTS gemstones_ai_v6;



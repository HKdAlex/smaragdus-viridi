-- Migration: Create gemstones_enriched view
-- Date: 2025-10-17
-- 
-- Purpose: 
-- Create a comprehensive view that joins gemstones with AI v6 data
-- This eliminates the need for multiple separate queries in the application layer
-- and provides better performance through a single optimized query plan
--
-- Benefits:
-- 1. Reduces N+1 query problems (no need to fetch AI data separately)
-- 2. Simplifies application code (single query instead of multiple joins)
-- 3. Provides consistent data structure across catalog and search
-- 4. PostgreSQL can optimize the view's query plan
-- 5. Easier to maintain - change join logic in one place

BEGIN;

CREATE OR REPLACE VIEW gemstones_enriched AS
SELECT 
  -- Core gemstone data
  g.id,
  g.serial_number,
  g.name::text AS name,
  g.type_code,
  g.color::text AS color,
  g.color_code,
  g.cut::text AS cut,
  g.cut_code,
  g.clarity::text AS clarity,
  g.clarity_code,
  g.weight_carats,
  g.price_amount,
  g.price_currency::text AS price_currency,
  g.description,
  g.in_stock,
  g.origin_id,
  g.metadata_status::text AS metadata_status,
  g.created_at,
  g.updated_at,
  g.ai_analyzed,
  
  -- AI-detected values from gemstones table
  g.ai_color,
  
  -- AI v6 data - image selection
  v6.selected_image_uuid,
  v6.recommended_primary_image_index,
  
  -- AI v6 data - detected attributes
  v6.detected_cut,
  v6.cut_detection_confidence,
  v6.detected_color,
  v6.color_detection_confidence,
  v6.detected_color_description,
  
  -- AI v6 data - descriptions (English)
  v6.technical_description_en,
  v6.emotional_description_en,
  v6.narrative_story_en,
  v6.historical_context_en,
  v6.care_instructions_en,
  v6.promotional_text AS promotional_text_en,
  v6.marketing_highlights AS marketing_highlights_en,
  
  -- AI v6 data - descriptions (Russian)
  v6.technical_description_ru,
  v6.emotional_description_ru,
  v6.narrative_story_ru,
  v6.historical_context_ru,
  v6.care_instructions_ru,
  v6.promotional_text_ru,
  v6.marketing_highlights_ru,
  
  -- AI v6 metadata
  v6.model_version,
  v6.confidence_score,
  v6.needs_review
FROM gemstones g
LEFT JOIN gemstones_ai_v6 v6 ON v6.gemstone_id = g.id;

-- Add comment for documentation
COMMENT ON VIEW gemstones_enriched IS 
'Enriched gemstones view with AI-detected values and v6 analysis data. 
Use this view instead of multiple joins for better performance and code simplicity.

Example usage:
  SELECT * FROM gemstones_enriched WHERE name = ''citrine'' AND in_stock = true;

This view automatically includes:
- All core gemstone fields with proper type casting
- AI-detected color (ai_color from gemstones table)
- AI v6 detected cut and color with confidence scores
- AI v6 selected/recommended primary image data
- AI v6 generated descriptions in English and Russian
- AI v6 metadata (model version, confidence, review status)

Note: Images must still be fetched separately from gemstone_images table.
';

COMMIT;


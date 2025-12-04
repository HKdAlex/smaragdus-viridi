-- Migration: Add image_count and video_count to gemstones_enriched view
-- Date: 2025-06-04
-- 
-- Purpose: 
-- Add computed image_count and video_count columns to the gemstones_enriched view
-- This eliminates the need for separate queries to count media per gemstone
-- and improves performance for the admin dashboard list view.

BEGIN;

-- Drop and recreate the view with media counts
CREATE OR REPLACE VIEW gemstones_enriched AS
SELECT 
  -- Core gemstone data
  g.id,
  g.serial_number,
  g.internal_code,
  g.name::text AS name,
  g.type_code,
  g.color::text AS color,
  g.color_code,
  g.cut::text AS cut,
  g.cut_code,
  g.clarity::text AS clarity,
  g.clarity_code,
  g.weight_carats,
  g.length_mm,
  g.width_mm,
  g.depth_mm,
  g.price_amount,
  g.price_currency::text AS price_currency,
  g.premium_price_amount,
  g.premium_price_currency::text AS premium_price_currency,
  g.price_per_carat,
  g.quantity,
  g.delivery_days,
  g.description,
  g.in_stock,
  g.origin_id,
  g.metadata_status::text AS metadata_status,
  g.created_at,
  g.updated_at,
  g.ai_text_generated_v6 AS ai_analyzed,
  g.ai_color,
  g.primary_image_url,
  g.primary_video_url,
  
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
  v6.needs_review,
  
  -- Media counts (added at the end to avoid column order conflicts)
  COALESCE(img_counts.image_count, 0)::integer AS image_count,
  COALESCE(vid_counts.video_count, 0)::integer AS video_count
FROM gemstones g
LEFT JOIN gemstones_ai_v6 v6 ON v6.gemstone_id = g.id
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS image_count
  FROM gemstone_images gi
  WHERE gi.gemstone_id = g.id
) img_counts ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS video_count
  FROM gemstone_videos gv
  WHERE gv.gemstone_id = g.id
) vid_counts ON true;

-- Update the comment
COMMENT ON VIEW gemstones_enriched IS 
'Enriched gemstones view with AI-detected values, v6 analysis data, and media counts.
Use this view instead of multiple joins for better performance and code simplicity.

Example usage:
  SELECT * FROM gemstones_enriched WHERE name = ''citrine'' AND in_stock = true;

This view automatically includes:
- All core gemstone fields with proper type casting
- image_count and video_count (computed from gemstone_images/videos tables)
- AI-detected color (ai_color from gemstones table)
- AI v6 detected cut and color with confidence scores
- AI v6 selected/recommended primary image data
- AI v6 generated descriptions in English and Russian
- AI v6 metadata (model version, confidence, review status)
';

COMMIT;


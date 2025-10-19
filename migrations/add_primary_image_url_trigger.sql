-- Migration: Add primary image URL field and trigger for automatic updates
-- This optimizes list/grid views by storing the primary image URL directly on gemstones

-- Add primary image URL field to gemstones table
ALTER TABLE gemstones 
ADD COLUMN IF NOT EXISTS primary_image_url TEXT;

-- Add primary video URL field to gemstones table (for future use)
ALTER TABLE gemstones 
ADD COLUMN IF NOT EXISTS primary_video_url TEXT;

-- Create function to update primary image URL
CREATE OR REPLACE FUNCTION update_gemstone_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the gemstone's primary_image_url when is_primary changes
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    -- If this image is being set as primary, update the gemstone
    IF NEW.is_primary = true THEN
      UPDATE gemstones 
      SET primary_image_url = NEW.image_url
      WHERE id = NEW.gemstone_id;
    END IF;
    
    -- If this image is being unset as primary, check if there's another primary image
    IF TG_OP = 'UPDATE' AND OLD.is_primary = true AND NEW.is_primary = false THEN
      -- Find the next primary image for this gemstone
      UPDATE gemstones 
      SET primary_image_url = (
        SELECT image_url 
        FROM gemstone_images 
        WHERE gemstone_id = NEW.gemstone_id 
          AND is_primary = true 
        ORDER BY image_order 
        LIMIT 1
      )
      WHERE id = NEW.gemstone_id;
    END IF;
  END IF;
  
  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    -- If we're deleting a primary image, find the next one
    IF OLD.is_primary = true THEN
      UPDATE gemstones 
      SET primary_image_url = (
        SELECT image_url 
        FROM gemstone_images 
        WHERE gemstone_id = OLD.gemstone_id 
          AND is_primary = true 
        ORDER BY image_order 
        LIMIT 1
      )
      WHERE id = OLD.gemstone_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for gemstone_images table
DROP TRIGGER IF EXISTS trigger_update_gemstone_primary_image ON gemstone_images;
CREATE TRIGGER trigger_update_gemstone_primary_image
  AFTER INSERT OR UPDATE OR DELETE ON gemstone_images
  FOR EACH ROW
  EXECUTE FUNCTION update_gemstone_primary_image();

-- Create function to update primary video URL
CREATE OR REPLACE FUNCTION update_gemstone_primary_video()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the gemstone's primary_video_url when video_order changes
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    -- If this video is being set as primary (video_order = 0), update the gemstone
    IF NEW.video_order = 0 THEN
      UPDATE gemstones 
      SET primary_video_url = NEW.video_url
      WHERE id = NEW.gemstone_id;
    END IF;
    
    -- If this video is being unset as primary, check if there's another primary video
    IF TG_OP = 'UPDATE' AND OLD.video_order = 0 AND NEW.video_order != 0 THEN
      -- Find the next primary video for this gemstone
      UPDATE gemstones 
      SET primary_video_url = (
        SELECT video_url 
        FROM gemstone_videos 
        WHERE gemstone_id = NEW.gemstone_id 
          AND video_order = 0 
        ORDER BY video_order 
        LIMIT 1
      )
      WHERE id = NEW.gemstone_id;
    END IF;
  END IF;
  
  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    -- If we're deleting a primary video, find the next one
    IF OLD.video_order = 0 THEN
      UPDATE gemstones 
      SET primary_video_url = (
        SELECT video_url 
        FROM gemstone_videos 
        WHERE gemstone_id = OLD.gemstone_id 
          AND video_order = 0 
        ORDER BY video_order 
        LIMIT 1
      )
      WHERE id = OLD.gemstone_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for gemstone_videos table
DROP TRIGGER IF EXISTS trigger_update_gemstone_primary_video ON gemstone_videos;
CREATE TRIGGER trigger_update_gemstone_primary_video
  AFTER INSERT OR UPDATE OR DELETE ON gemstone_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_gemstone_primary_video();

-- Backfill existing data: Update all gemstones with their current primary images
UPDATE gemstones 
SET primary_image_url = (
  SELECT image_url 
  FROM gemstone_images 
  WHERE gemstone_id = gemstones.id 
    AND is_primary = true 
  ORDER BY image_order 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 
  FROM gemstone_images 
  WHERE gemstone_id = gemstones.id 
    AND is_primary = true
);

-- Backfill existing data: Update all gemstones with their current primary videos
UPDATE gemstones 
SET primary_video_url = (
  SELECT video_url 
  FROM gemstone_videos 
  WHERE gemstone_id = gemstones.id 
    AND video_order = 0 
  ORDER BY video_order 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 
  FROM gemstone_videos 
  WHERE gemstone_id = gemstones.id 
    AND video_order = 0
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_gemstones_primary_image_url ON gemstones(primary_image_url) WHERE primary_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gemstones_primary_video_url ON gemstones(primary_video_url) WHERE primary_video_url IS NOT NULL;

-- Update the gemstones_enriched view to include primary image URL
CREATE OR REPLACE VIEW gemstones_enriched AS
SELECT 
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
  g.ai_text_generated_v6 AS ai_analyzed,
  g.ai_color,
  g.primary_image_url,
  g.primary_video_url,
  v6.selected_image_uuid,
  v6.recommended_primary_image_index,
  v6.detected_cut,
  v6.cut_detection_confidence,
  v6.detected_color,
  v6.color_detection_confidence,
  v6.detected_color_description,
  v6.technical_description_en,
  v6.emotional_description_en,
  v6.narrative_story_en,
  v6.historical_context_en,
  v6.care_instructions_en,
  v6.promotional_text AS promotional_text_en,
  v6.marketing_highlights AS marketing_highlights_en,
  v6.technical_description_ru,
  v6.emotional_description_ru,
  v6.narrative_story_ru,
  v6.historical_context_ru,
  v6.care_instructions_ru,
  v6.promotional_text_ru,
  v6.marketing_highlights_ru,
  v6.model_version,
  v6.confidence_score,
  v6.needs_review
FROM gemstones g
LEFT JOIN gemstones_ai_v6 v6 ON v6.gemstone_id = g.id;

-- Migration: Update multilingual search to index display_* field values
-- Ensures full-text search includes custom values
-- Contract: DISPLAY-C4.0

-- Recreate trigger helper to include custom fields in search vectors
CREATE OR REPLACE FUNCTION update_gemstone_search_vectors()
RETURNS TRIGGER AS $$
DECLARE
  ai_record RECORD;
  origin_name_en text;
  origin_name_ru text;
  cut_name_ru text;
  clarity_name_ru text;
BEGIN
  SELECT
    technical_description_en,
    technical_description_ru,
    narrative_story_en,
    narrative_story_ru,
    promotional_text,
    promotional_text_ru,
    marketing_highlights,
    marketing_highlights_ru
  INTO ai_record
  FROM gemstones_ai_v6
  WHERE gemstone_id = NEW.id;

  SELECT name, name
  INTO origin_name_en, origin_name_ru
  FROM origins
  WHERE id = NEW.origin_id;

  SELECT name_ru
  INTO cut_name_ru
  FROM cuts
  WHERE id = NEW.cut_id;

  SELECT name
  INTO clarity_name_ru
  FROM gem_clarity_translations
  WHERE clarity_code = NEW.clarity::text AND locale = 'ru';

  -- UPDATED: Include custom fields in English search vectors
  NEW.search_vector_en :=
    setweight(to_tsvector('english', coalesce(NEW.serial_number, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.name::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.name_custom, '')), 'A') ||  -- NEW: Custom name
    setweight(to_tsvector('english', coalesce(NEW.color_custom, '')), 'B') || -- NEW: Custom color
    setweight(to_tsvector('english', coalesce(NEW.cut_custom, '')), 'B') ||   -- NEW: Custom cut
    setweight(to_tsvector('english', coalesce(NEW.clarity_custom, '')), 'B') || -- NEW: Custom clarity
    setweight(to_tsvector('english', coalesce((SELECT code FROM cuts WHERE id = NEW.cut_id), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.clarity::text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(origin_name_en, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(ai_record.technical_description_en, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(ai_record.narrative_story_en, '')), 'D');

  NEW.description_vector_en :=
    to_tsvector('english',
      coalesce(NEW.description, '') || ' ' ||
      coalesce(ai_record.technical_description_en, '') || ' ' ||
      coalesce(ai_record.promotional_text, '') || ' ' ||
      array_to_string(COALESCE(ai_record.marketing_highlights, ARRAY[]::text[]), ' ')
    );

  -- UPDATED: Include custom fields in Russian search vectors
  NEW.search_vector_ru :=
    setweight(to_tsvector('russian', coalesce(NEW.serial_number, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce((SELECT name FROM gemstone_type_translations WHERE type_code = NEW.type_code AND locale = 'ru'), NEW.name::text, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce(NEW.name_custom, '')), 'A') ||  -- NEW: Custom name
    setweight(to_tsvector('russian', coalesce((SELECT name FROM gem_color_translations WHERE color_code = NEW.color_code AND locale = 'ru'), NEW.color::text, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(NEW.color_custom, '')), 'B') || -- NEW: Custom color
    setweight(to_tsvector('russian', coalesce(cut_name_ru, (SELECT code FROM cuts WHERE id = NEW.cut_id), '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(NEW.cut_custom, '')), 'B') ||   -- NEW: Custom cut
    setweight(to_tsvector('russian', coalesce(clarity_name_ru, NEW.clarity::text, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(NEW.clarity_custom, '')), 'B') || -- NEW: Custom clarity
    setweight(to_tsvector('russian', coalesce(origin_name_ru, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('russian', coalesce(ai_record.technical_description_ru, '')), 'C') ||
    setweight(to_tsvector('russian', coalesce(ai_record.narrative_story_ru, '')), 'D');

  NEW.description_vector_ru :=
    to_tsvector('russian',
      coalesce(NEW.description, '') || ' ' ||
      coalesce(ai_record.technical_description_ru, '') || ' ' ||
      coalesce(ai_record.promotional_text_ru, '') || ' ' ||
      array_to_string(COALESCE(ai_record.marketing_highlights_ru, ARRAY[]::text[]), ' ')
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_update_gemstone_search_vectors ON gemstones;

-- Recreate trigger to fire on custom field changes too
CREATE TRIGGER trigger_update_gemstone_search_vectors
  BEFORE INSERT OR UPDATE OF serial_number, name, type_code, color, color_code, cut_id, clarity, origin_id, description,
                            name_custom, color_custom, cut_custom, clarity_custom  -- NEW: Include custom fields
  ON gemstones
  FOR EACH ROW
  EXECUTE FUNCTION update_gemstone_search_vectors();

-- Re-index existing rows to include custom fields in search vectors
-- Only update rows that have custom fields to minimize impact
UPDATE gemstones
SET updated_at = updated_at
WHERE name_custom IS NOT NULL
   OR color_custom IS NOT NULL
   OR cut_custom IS NOT NULL
   OR clarity_custom IS NOT NULL;

COMMENT ON FUNCTION update_gemstone_search_vectors IS 'Updates search vectors including custom fields for full-text search (DISPLAY-C4.0)';

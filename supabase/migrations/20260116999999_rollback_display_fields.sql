-- ROLLBACK Script for Display Fields Migrations
-- Use this ONLY if you need to revert the display_* field changes
-- This will restore the system to its previous state

BEGIN;

-- ============================================
-- STEP 1: Drop functional indexes
-- ============================================

DROP INDEX IF EXISTS idx_gemstones_display_name;
DROP INDEX IF EXISTS idx_gemstones_display_color;
DROP INDEX IF EXISTS idx_gemstones_display_cut;
DROP INDEX IF EXISTS idx_gemstones_display_clarity;

-- Also drop test indexes if they exist
DROP INDEX IF EXISTS idx_gemstones_display_name_test;
DROP INDEX IF EXISTS idx_gemstones_display_color_test;
DROP INDEX IF EXISTS idx_gemstones_display_cut_test;
DROP INDEX IF EXISTS idx_gemstones_display_clarity_test;

-- ============================================
-- STEP 2: Restore search vector trigger (without custom fields)
-- ============================================

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

  -- WITHOUT custom fields (original version)
  NEW.search_vector_en :=
    setweight(to_tsvector('english', coalesce(NEW.serial_number, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.name::text, '')), 'A') ||
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

  NEW.search_vector_ru :=
    setweight(to_tsvector('russian', coalesce(NEW.serial_number, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce((SELECT name FROM gemstone_type_translations WHERE type_code = NEW.type_code AND locale = 'ru'), NEW.name::text, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce((SELECT name FROM gem_color_translations WHERE color_code = NEW.color_code AND locale = 'ru'), NEW.color::text, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(cut_name_ru, (SELECT code FROM cuts WHERE id = NEW.cut_id), '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(clarity_name_ru, NEW.clarity::text, '')), 'B') ||
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

-- Recreate trigger without custom field tracking
DROP TRIGGER IF EXISTS trigger_update_gemstone_search_vectors ON gemstones;

CREATE TRIGGER trigger_update_gemstone_search_vectors
  BEFORE INSERT OR UPDATE OF serial_number, name, type_code, color, color_code, cut_id, clarity, origin_id, description
  ON gemstones
  FOR EACH ROW
  EXECUTE FUNCTION update_gemstone_search_vectors();

-- ============================================
-- STEP 3: Restore gemstones_enriched view (without display_* fields)
-- ============================================

DROP VIEW IF EXISTS gemstones_enriched CASCADE;

CREATE VIEW gemstones_enriched AS
SELECT
  g.*,
  -- AI v6 fields
  v6.emotional_description_en,
  v6.emotional_description_ru,
  v6.technical_description_en,
  v6.technical_description_ru,
  v6.narrative_story_en,
  v6.narrative_story_ru,
  v6.promotional_text,
  v6.promotional_text_ru,
  v6.marketing_highlights,
  v6.marketing_highlights_ru,
  v6.selected_image_uuid,
  v6.recommended_primary_image_index,
  v6.detected_cut,
  v6.ai_color,
  -- Cut information
  c.code as cut_code,
  c.name_en as cut_name_en,
  c.name_ru as cut_name_ru
  -- NO display_* fields (restored to previous version)
FROM gemstones g
LEFT JOIN gemstones_ai_v6 v6 ON g.id = v6.gemstone_id
LEFT JOIN cuts c ON g.cut_id = c.id;

-- ============================================
-- STEP 4: Restore catalog_search_gemstones (without display_* fields)
-- ============================================

-- NOTE: You'll need to restore the previous version of catalog_search_gemstones
-- from your git history. This rollback script doesn't include the full function
-- because it's very large. Use:
-- git show HEAD~1:supabase/migrations/[previous_migration].sql

DO $$
BEGIN
  RAISE NOTICE '⚠ WARNING: You need to manually restore catalog_search_gemstones function';
  RAISE NOTICE '  from previous git commit or backup';
END $$;

-- ============================================
-- ROLLBACK COMPLETE
-- ============================================

COMMIT;

-- Verify rollback
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'ROLLBACK COMPLETE ✓';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Display fields have been removed.';
  RAISE NOTICE 'System restored to previous state.';
  RAISE NOTICE '';
  RAISE NOTICE 'NOTE: You still need to restore catalog_search_gemstones';
  RAISE NOTICE '      and get_catalog_filter_counts from git history.';
  RAISE NOTICE '';
END $$;

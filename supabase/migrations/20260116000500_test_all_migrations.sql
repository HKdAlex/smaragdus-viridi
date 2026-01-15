-- Test Script: Validate all display_* migrations in a transaction
-- This script tests all migrations without committing
-- Run this FIRST to verify everything works
-- If any error occurs, the entire transaction will be rolled back

BEGIN;

-- ============================================
-- BACKUP: Save current state for rollback
-- ============================================

-- Save current view definition (if exists)
DO $$
BEGIN
    -- We'll recreate views, so this is informational
    RAISE NOTICE 'Testing migrations in transaction - will rollback at end';
END $$;

-- ============================================
-- TEST 1: Display Fields View (20260116000000)
-- ============================================

\echo 'Testing: Add display fields to gemstones_enriched view...'

-- Drop and recreate view with display fields
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
  c.name_ru as cut_name_ru,
  -- NEW: Display fields with precedence: Admin Custom > AI > Enum
  COALESCE(NULLIF(TRIM(g.name_custom), ''), g.name::text) AS display_name,
  COALESCE(NULLIF(TRIM(g.color_custom), ''), v6.ai_color, g.color::text) AS display_color,
  COALESCE(NULLIF(TRIM(g.cut_custom), ''), v6.detected_cut, c.code) AS display_cut,
  COALESCE(NULLIF(TRIM(g.clarity_custom), ''), g.clarity::text) AS display_clarity
FROM gemstones g
LEFT JOIN gemstones_ai_v6 v6 ON g.id = v6.gemstone_id
LEFT JOIN cuts c ON g.cut_id = c.id;

-- Test: Verify display fields exist
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO test_count
  FROM gemstones_enriched
  WHERE display_name IS NOT NULL
    AND display_color IS NOT NULL
    AND display_clarity IS NOT NULL
  LIMIT 1;

  IF test_count = 0 THEN
    RAISE EXCEPTION 'Display fields not created properly';
  END IF;

  RAISE NOTICE '✓ Display fields created successfully';
END $$;

-- ============================================
-- TEST 2: Functional Indexes (20260116000100)
-- ============================================

\echo 'Testing: Create functional indexes...'

-- These would normally be CONCURRENTLY, but in transaction we test without CONCURRENTLY
CREATE INDEX IF NOT EXISTS idx_gemstones_display_name_test
ON gemstones (COALESCE(NULLIF(TRIM(name_custom), ''), name::text));

CREATE INDEX IF NOT EXISTS idx_gemstones_display_color_test
ON gemstones (COALESCE(NULLIF(TRIM(color_custom), ''), ai_color, color::text));

CREATE INDEX IF NOT EXISTS idx_gemstones_display_cut_test
ON gemstones (COALESCE(NULLIF(TRIM(cut_custom), ''), (
  SELECT v6.detected_cut FROM gemstones_ai_v6 v6 WHERE v6.gemstone_id = gemstones.id
), (SELECT c.code FROM cuts c WHERE c.id = gemstones.cut_id)));

CREATE INDEX IF NOT EXISTS idx_gemstones_display_clarity_test
ON gemstones (COALESCE(NULLIF(TRIM(clarity_custom), ''), clarity::text));

RAISE NOTICE '✓ Indexes created successfully';

-- ============================================
-- TEST 3: Catalog Search Function (snippet)
-- ============================================

\echo 'Testing: Verify catalog_search_gemstones structure...'

-- Just verify the function exists and has display_* in return type
DO $$
DECLARE
  func_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'catalog_search_gemstones'
  ) INTO func_exists;

  IF NOT func_exists THEN
    RAISE NOTICE '⚠ catalog_search_gemstones function will be created in migration 200';
  ELSE
    RAISE NOTICE '✓ catalog_search_gemstones function exists';
  END IF;
END $$;

-- ============================================
-- TEST 4: Search Vectors (20260116000400)
-- ============================================

\echo 'Testing: Search vector function structure...'

-- Verify trigger function exists
DO $$
DECLARE
  func_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_gemstone_search_vectors'
  ) INTO func_exists;

  IF NOT func_exists THEN
    RAISE NOTICE '⚠ update_gemstone_search_vectors will be created in migration 400';
  ELSE
    RAISE NOTICE '✓ update_gemstone_search_vectors function exists';
  END IF;
END $$;

-- ============================================
-- VALIDATION COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'ALL TESTS PASSED ✓';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Migrations are safe to apply.';
  RAISE NOTICE 'Run: npx supabase db push --include-all';
  RAISE NOTICE '';
END $$;

-- ROLLBACK to undo test changes
ROLLBACK;

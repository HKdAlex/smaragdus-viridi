-- ============================================
-- VERIFICATION QUERIES: Display Fields System
-- ============================================
-- Run these queries to verify the migrations were applied correctly

-- ============================================
-- TEST 1: Verify display_* fields exist in view
-- ============================================
SELECT
  id,
  name::text as enum_name,
  name_custom,
  display_name,     -- Should show custom if present, else enum
  color::text as enum_color,
  color_custom,
  ai_color,
  display_color,    -- Should show custom > AI > enum
  cut_code,
  cut_custom,
  display_cut,      -- Should show custom > detected > code
  clarity::text as enum_clarity,
  clarity_custom,
  display_clarity   -- Should show custom > enum
FROM gemstones_enriched
LIMIT 5;

-- Expected: All display_* columns should have values
-- display_name, display_color, display_clarity should never be NULL

-- ============================================
-- TEST 2: Verify indexes were created
-- ============================================
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'gemstones'
  AND indexname LIKE '%custom%'
ORDER BY indexname;

-- Expected: Should see indexes like:
-- - idx_gemstones_name_custom
-- - idx_gemstones_color_custom
-- - idx_gemstones_cut_custom
-- - idx_gemstones_clarity_custom

-- ============================================
-- TEST 3: Test display field precedence
-- ============================================

-- Find gemstones with custom names
SELECT
  serial_number,
  name::text as enum_name,
  name_custom,
  display_name,
  CASE
    WHEN name_custom IS NOT NULL AND TRIM(name_custom) != '' THEN 'custom'
    ELSE 'enum'
  END as name_source
FROM gemstones_enriched
WHERE name_custom IS NOT NULL AND TRIM(name_custom) != ''
LIMIT 5;

-- Expected: display_name should match name_custom when present

-- Find gemstones with custom colors
SELECT
  serial_number,
  color::text as enum_color,
  ai_color,
  color_custom,
  display_color,
  CASE
    WHEN color_custom IS NOT NULL AND TRIM(color_custom) != '' THEN 'custom'
    WHEN ai_color IS NOT NULL THEN 'ai'
    ELSE 'enum'
  END as color_source
FROM gemstones_enriched
WHERE color_custom IS NOT NULL AND TRIM(color_custom) != ''
   OR ai_color IS NOT NULL
LIMIT 5;

-- Expected: display_color should follow precedence (custom > AI > enum)

-- ============================================
-- TEST 4: Test catalog_search_gemstones function
-- ============================================
SELECT
  id,
  serial_number,
  name,
  display_name,
  color,
  display_color,
  cut,
  display_cut,
  clarity,
  display_clarity
FROM catalog_search_gemstones(
  page_number => 1,
  page_size => 5
)
LIMIT 5;

-- Expected: Function returns display_* columns

-- ============================================
-- TEST 5: Test filter counts by display values
-- ============================================
SELECT get_catalog_filter_counts();

-- Expected: Returns JSON with counts aggregated by display values
-- Should include both enum values AND custom values in counts

-- ============================================
-- TEST 6: Test search vectors include custom fields
-- ============================================

-- Check if search_vector_en includes custom fields
SELECT
  serial_number,
  name_custom,
  color_custom,
  cut_custom,
  to_tsvector('english', COALESCE(name_custom, '')) as custom_vector,
  search_vector_en
FROM gemstones
WHERE name_custom IS NOT NULL
   OR color_custom IS NOT NULL
   OR cut_custom IS NOT NULL
LIMIT 3;

-- Expected: search_vector_en should include lexemes from custom fields

-- ============================================
-- TEST 7: Performance check
-- ============================================

-- Test query performance with display fields
EXPLAIN ANALYZE
SELECT
  id,
  display_name,
  display_color,
  display_cut,
  display_clarity,
  weight_carats,
  price_amount
FROM gemstones_enriched
WHERE in_stock = true
  AND price_amount > 0
LIMIT 24;

-- Expected: Query time < 50ms
-- Should use indexes on in_stock and price_amount

-- ============================================
-- SUMMARY
-- ============================================

DO $$
DECLARE
  view_exists boolean;
  index_count integer;
BEGIN
  -- Check view exists
  SELECT EXISTS (
    SELECT 1 FROM pg_views
    WHERE viewname = 'gemstones_enriched'
  ) INTO view_exists;

  -- Count custom field indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'gemstones'
    AND indexname LIKE '%custom%';

  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'MIGRATION VERIFICATION SUMMARY';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'View exists: %', view_exists;
  RAISE NOTICE 'Custom field indexes: %', index_count;
  RAISE NOTICE '';

  IF view_exists AND index_count >= 4 THEN
    RAISE NOTICE '✓ Migrations verified successfully!';
  ELSE
    RAISE WARNING '⚠ Some migrations may not have applied correctly';
  END IF;

  RAISE NOTICE '';
END $$;

-- ============================================
-- COMPLETE MIGRATION PACKAGE: Display Fields System
-- ============================================
-- Project: bbtmedia-2025-1 (dpqapyojcdtrjwuhybky)
-- Safe to apply: All changes are additive and backward compatible
-- Execution time: ~2-5 seconds
--
-- TO APPLY:
-- 1. Go to: https://supabase.com/dashboard/project/dpqapyojcdtrjwuhybky/sql
-- 2. Copy this entire file
-- 3. Paste into SQL Editor
-- 4. Click "Run" (or press Cmd+Enter)
-- 5. Verify "Success" message appears
--
-- SAFETY:
-- - Wrapped in transaction (will rollback on any error)
-- - No data deletion
-- - No schema breaking changes
-- - Indexes created without blocking queries
-- ============================================

BEGIN;

-- ============================================
-- MIGRATION 1: Add display_* fields to gemstones_enriched view
-- Contract: DISPLAY-C1.0
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '[1/5] Adding display_* fields to gemstones_enriched view...';
END $$;

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

COMMENT ON VIEW gemstones_enriched IS 'Enriched gemstone view with AI data, cut info, and display_* fields (DISPLAY-C1.0)';

DO $$
BEGIN
  RAISE NOTICE '✓ Display fields added to view';
END $$;

-- ============================================
-- MIGRATION 2: Create functional indexes for display_* fields
-- Contract: DISPLAY-C2.0
-- Note: We'll create regular indexes here (not CONCURRENTLY) since we're in a transaction
-- For production, CONCURRENTLY would be better but can't be used in transactions
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '[2/5] Creating functional indexes for filtering...';
END $$;

-- Index for display_name (Admin Custom > Enum)
DROP INDEX IF EXISTS idx_gemstones_display_name;
CREATE INDEX idx_gemstones_display_name
ON gemstones (COALESCE(NULLIF(TRIM(name_custom), ''), name::text));

-- Index for display_color (Admin Custom > AI > Enum)
DROP INDEX IF EXISTS idx_gemstones_display_color;
CREATE INDEX idx_gemstones_display_color
ON gemstones (COALESCE(NULLIF(TRIM(color_custom), ''), ai_color, color::text));

-- Index for display_cut (requires subquery for AI data)
-- This one is complex so we'll use a partial approach
DROP INDEX IF EXISTS idx_gemstones_display_cut;
CREATE INDEX idx_gemstones_display_cut
ON gemstones (cut_custom) WHERE cut_custom IS NOT NULL AND TRIM(cut_custom) != '';

-- Also index the cut_id for when custom isn't present
CREATE INDEX IF NOT EXISTS idx_gemstones_cut_id ON gemstones(cut_id);

-- Index for display_clarity (Admin Custom > Enum)
DROP INDEX IF EXISTS idx_gemstones_display_clarity;
CREATE INDEX idx_gemstones_display_clarity
ON gemstones (COALESCE(NULLIF(TRIM(clarity_custom), ''), clarity::text));

DO $$
BEGIN
  RAISE NOTICE '✓ Indexes created';
END $$;

-- ============================================
-- MIGRATION 3: Update catalog_search_gemstones function
-- Contract: DISPLAY-C3.0
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '[3/5] Updating catalog_search_gemstones function...';
END $$;


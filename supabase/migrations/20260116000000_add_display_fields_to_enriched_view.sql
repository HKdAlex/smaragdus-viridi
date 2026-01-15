-- Migration: Add display_* computed fields to gemstones_enriched view
-- Centralizes precedence logic: Admin Custom > AI > Enum
-- Enables filtering and search on resolved values
-- Contract: DISPLAY-C1.0

DROP VIEW IF EXISTS gemstones_enriched;

CREATE VIEW gemstones_enriched AS
SELECT
    g.id,
    g.serial_number,
    g.internal_code,
    g.name::text AS name,
    g.type_code,
    g.color::text AS color,
    g.color_code,
    g.cut_id,
    g.cut_code,
    c.code AS cut,
    c.name_en AS cut_name_en,
    c.name_ru AS cut_name_ru,
    g.clarity::text AS clarity,
    g.clarity_code,

    -- DISPLAY FIELDS (Precedence: Admin Custom > AI > Enum)
    -- These are the source of truth for rendering and filtering
    COALESCE(
        NULLIF(TRIM(g.name_custom), ''),  -- Admin custom (highest priority)
        g.name::text                       -- Enum code (fallback)
    ) AS display_name,

    COALESCE(
        NULLIF(TRIM(g.color_custom), ''),  -- Admin custom
        g.ai_color,                         -- AI detected
        g.color::text                       -- Enum code
    ) AS display_color,

    COALESCE(
        NULLIF(TRIM(g.cut_custom), ''),    -- Admin custom
        v6.detected_cut,                    -- AI detected
        c.code                              -- Cut code from cuts table
    ) AS display_cut,

    COALESCE(
        NULLIF(TRIM(g.clarity_custom), ''), -- Admin custom
        g.clarity::text                      -- Enum code
    ) AS display_clarity,

    -- Dimensions and pricing
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

    -- Custom fields for Professional Specifications (FLEX-C3.1)
    g.name_custom,
    g.color_custom,
    g.cut_custom,
    g.clarity_custom,
    g.quality_classification,
    g.mining_country,
    g.cutting_country,

    -- Custom fields for Treatment Disclosure (FLEX-C3.2)
    g.treatment_status,
    g.color_change_description,
    g.enhancement_notes,

    -- AI v6 fields
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
    v6.needs_review,

    -- Counts
    COALESCE(img_counts.image_count, 0) AS image_count,
    COALESCE(vid_counts.video_count, 0) AS video_count

FROM gemstones g
LEFT JOIN cuts c ON c.id = g.cut_id
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

-- Grant permissions
GRANT SELECT ON gemstones_enriched TO anon, authenticated;

-- Documentation
COMMENT ON VIEW gemstones_enriched IS
'Enriched gemstone view with display_* computed fields.
Display fields implement precedence: Admin Custom > AI > Enum.
Use display_* fields for rendering and filtering to ensure consistency.';

COMMENT ON COLUMN gemstones_enriched.display_name IS 'Resolved name (custom > enum): Source of truth for display';
COMMENT ON COLUMN gemstones_enriched.display_color IS 'Resolved color (custom > AI > enum): Source of truth for display';
COMMENT ON COLUMN gemstones_enriched.display_cut IS 'Resolved cut (custom > AI > cut code): Source of truth for display';
COMMENT ON COLUMN gemstones_enriched.display_clarity IS 'Resolved clarity (custom > enum): Source of truth for display';

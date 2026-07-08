-- Pricing basis: per_carat, per_piece, lot_fixed
-- price_amount remains the canonical lot total for cart/checkout.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_basis') THEN
    CREATE TYPE public.pricing_basis AS ENUM ('per_carat', 'per_piece', 'lot_fixed');
  END IF;
END $$;

ALTER TABLE public.gemstones
  ADD COLUMN IF NOT EXISTS pricing_basis public.pricing_basis NOT NULL DEFAULT 'per_carat',
  ADD COLUMN IF NOT EXISTS price_per_piece bigint NULL;

COMMENT ON COLUMN public.gemstones.pricing_basis IS 'How unit price is derived: per carat, per piece, or fixed lot total';
COMMENT ON COLUMN public.gemstones.price_per_piece IS 'Price per piece in cents when pricing_basis = per_piece';

-- Backfill pricing_basis from existing data
UPDATE public.gemstones
SET pricing_basis = 'per_carat'
WHERE price_per_carat IS NOT NULL;

UPDATE public.gemstones
SET
  pricing_basis = 'per_piece',
  price_per_piece = CASE
    WHEN quantity IS NOT NULL AND quantity > 0 AND price_amount IS NOT NULL
    THEN round(price_amount::numeric / quantity::numeric)::bigint
    ELSE price_per_piece
  END
WHERE pricing_basis = 'per_carat'
  AND price_per_carat IS NULL
  AND quantity IS NOT NULL
  AND quantity > 1;

UPDATE public.gemstones
SET pricing_basis = 'lot_fixed'
WHERE pricing_basis = 'per_carat'
  AND price_per_carat IS NULL
  AND (quantity IS NULL OR quantity <= 1);

-- Unified trigger: keep price_amount in sync for per_carat and per_piece modes
CREATE OR REPLACE FUNCTION public.sync_gemstone_price_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  basis public.pricing_basis;
  effective_quantity integer;
BEGIN
  basis := coalesce(new.pricing_basis, old.pricing_basis, 'per_carat'::public.pricing_basis);
  effective_quantity := greatest(coalesce(new.quantity, old.quantity, 1), 1);

  IF basis = 'lot_fixed' THEN
    RETURN new;
  END IF;

  IF basis = 'per_carat' THEN
    IF coalesce(new.price_per_carat, old.price_per_carat) IS NULL
       OR coalesce(new.weight_carats, old.weight_carats) IS NULL
       OR coalesce(new.weight_carats, old.weight_carats) <= 0 THEN
      RETURN new;
    END IF;

    new.price_amount :=
      round(
        (coalesce(new.price_per_carat, old.price_per_carat)::numeric
          * coalesce(new.weight_carats, old.weight_carats)::numeric),
        0
      )::bigint;
    RETURN new;
  END IF;

  -- per_piece
  IF coalesce(new.price_per_piece, old.price_per_piece) IS NULL THEN
    RETURN new;
  END IF;

  new.price_amount :=
    round(
      (coalesce(new.price_per_piece, old.price_per_piece)::numeric
        * effective_quantity::numeric),
      0
    )::bigint;

  RETURN new;
END;
$function$;

DROP TRIGGER IF EXISTS price_per_carat_updates_price ON public.gemstones;
DROP TRIGGER IF EXISTS weight_carats_updates_price ON public.gemstones;
DROP TRIGGER IF EXISTS sync_gemstone_price_amount_trigger ON public.gemstones;

CREATE TRIGGER sync_gemstone_price_amount_trigger
BEFORE INSERT OR UPDATE OF pricing_basis, price_per_carat, price_per_piece, weight_carats, quantity
ON public.gemstones
FOR EACH ROW
EXECUTE FUNCTION public.sync_gemstone_price_amount();

-- gemstones_enriched: expose new pricing columns
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

    COALESCE(
        NULLIF(TRIM(g.name_custom), ''),
        g.name::text
    ) AS display_name,

    COALESCE(
        NULLIF(TRIM(g.color_custom), ''),
        g.ai_color,
        g.color::text
    ) AS display_color,

    COALESCE(
        NULLIF(TRIM(g.cut_custom), ''),
        v6.detected_cut,
        c.code
    ) AS display_cut,

    COALESCE(
        NULLIF(TRIM(g.clarity_custom), ''),
        g.clarity::text
    ) AS display_clarity,

    g.weight_carats,
    g.length_mm,
    g.width_mm,
    g.depth_mm,
    g.price_amount,
    g.price_currency::text AS price_currency,
    g.premium_price_amount,
    g.premium_price_currency::text AS premium_price_currency,
    g.price_per_carat,
    g.price_per_piece,
    g.pricing_basis::text AS pricing_basis,
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

    g.name_custom,
    g.name_custom_en,
    g.name_custom_ru,
    g.color_custom,
    g.cut_custom,
    g.clarity_custom,
    g.quality_classification,
    g.mining_country,
    g.cutting_country,

    g.treatment_status,
    g.color_change_description,
    g.enhancement_notes,

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

GRANT SELECT ON gemstones_enriched TO anon, authenticated;

-- catalog_search_gemstones: add pricing_basis, price_per_piece, price_per_carat, quantity to output
DROP FUNCTION IF EXISTS public.catalog_search_gemstones(text,integer,integer,text[],text[],text[],text[],text[],integer,integer,numeric,numeric,boolean,boolean,boolean,text[],text[],text[],boolean,numeric,numeric,numeric,numeric,numeric,numeric,text,text);

CREATE OR REPLACE FUNCTION public.catalog_search_gemstones(
  search_query text DEFAULT NULL,
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 24,
  filter_types text[] DEFAULT NULL,
  filter_colors text[] DEFAULT NULL,
  filter_cuts text[] DEFAULT NULL,
  filter_clarities text[] DEFAULT NULL,
  filter_origins text[] DEFAULT NULL,
  filter_price_min integer DEFAULT NULL,
  filter_price_max integer DEFAULT NULL,
  filter_weight_min numeric DEFAULT NULL,
  filter_weight_max numeric DEFAULT NULL,
  filter_in_stock_only boolean DEFAULT NULL,
  filter_has_images boolean DEFAULT NULL,
  filter_has_certification boolean DEFAULT NULL,
  filter_treatment_status text[] DEFAULT NULL,
  filter_mining_countries text[] DEFAULT NULL,
  filter_quality_classifications text[] DEFAULT NULL,
  filter_has_color_change boolean DEFAULT NULL,
  filter_min_length numeric DEFAULT NULL,
  filter_max_length numeric DEFAULT NULL,
  filter_min_width numeric DEFAULT NULL,
  filter_max_width numeric DEFAULT NULL,
  filter_min_price_per_carat numeric DEFAULT NULL,
  filter_max_price_per_carat numeric DEFAULT NULL,
  sort_by text DEFAULT 'created_at',
  sort_direction text DEFAULT 'desc'
)
RETURNS TABLE(
  id uuid,
  name text,
  type_code text,
  color text,
  cut text,
  display_name text,
  display_color text,
  display_cut text,
  display_clarity text,
  name_custom text,
  name_custom_en text,
  name_custom_ru text,
  weight_carats numeric,
  clarity text,
  price_amount integer,
  price_currency currency_code,
  price_per_carat integer,
  price_per_piece bigint,
  pricing_basis text,
  quantity integer,
  in_stock boolean,
  serial_number text,
  internal_code text,
  ai_color text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  emotional_description_en text,
  emotional_description_ru text,
  marketing_highlights_en text[],
  marketing_highlights_ru text[],
  recommended_primary_image_index integer,
  selected_image_uuid uuid,
  detected_cut text,
  primary_image_url text,
  primary_video_url text,
  origin_id uuid,
  origin_name text,
  origin_country text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val integer;
  search_pattern text;
  search_nospace_pattern text;
BEGIN
  offset_val := (page_number - 1) * page_size;

  IF search_query IS NOT NULL AND search_query != '' THEN
    search_pattern := '%' || replace(replace(replace(search_query, '\', '\\'), '%', '\%'), '_', '\_') || '%';
    search_nospace_pattern := '%' || replace(replace(replace(replace(search_query, ' ', ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  END IF;

  RETURN QUERY
  SELECT
    g.id,
    g.name::text,
    g.type_code::text,
    g.color::text,
    COALESCE(cu.code, g.cut_code)::text as cut,
    COALESCE(NULLIF(TRIM(g.name_custom), ''), g.name::text) as display_name,
    COALESCE(NULLIF(TRIM(g.color_custom), ''), g.ai_color, g.color::text) as display_color,
    COALESCE(NULLIF(TRIM(g.cut_custom), ''), ai.detected_cut, cu.code) as display_cut,
    COALESCE(NULLIF(TRIM(g.clarity_custom), ''), g.clarity::text) as display_clarity,
    g.name_custom,
    g.name_custom_en,
    g.name_custom_ru,
    g.weight_carats,
    g.clarity::text,
    g.price_amount,
    g.price_currency::currency_code,
    g.price_per_carat,
    g.price_per_piece,
    g.pricing_basis::text,
    g.quantity,
    g.in_stock,
    g.serial_number,
    g.internal_code,
    g.ai_color,
    g.created_at,
    g.updated_at,
    ai.emotional_description_en,
    ai.emotional_description_ru,
    ai.marketing_highlights as marketing_highlights_en,
    ai.marketing_highlights_ru,
    ai.recommended_primary_image_index,
    ai.selected_image_uuid,
    ai.detected_cut,
    COALESCE(gi.image_url, g.primary_image_url) as primary_image_url,
    NULL::text as primary_video_url,
    o.id as origin_id,
    o.name as origin_name,
    o.country as origin_country,
    COUNT(*) OVER() as total_count
  FROM gemstones g
  LEFT JOIN cuts cu ON cu.id = g.cut_id
  LEFT JOIN origins o ON o.id = g.origin_id
  LEFT JOIN gemstones_ai_v6 ai ON ai.gemstone_id = g.id
  LEFT JOIN LATERAL (
    SELECT ranked.image_url
    FROM (
      SELECT
        img.image_url,
        img.is_primary,
        img.id as image_id,
        (ROW_NUMBER() OVER (ORDER BY img.image_order ASC NULLS LAST, img.created_at ASC, img.id) - 1)::integer AS idx
      FROM gemstone_images img
      WHERE img.gemstone_id = g.id
    ) ranked
    ORDER BY
      CASE
        WHEN ai.selected_image_uuid IS NOT NULL AND ranked.image_id = ai.selected_image_uuid THEN 0
        ELSE 1
      END,
      CASE WHEN ranked.is_primary IS TRUE THEN 0 ELSE 1 END,
      CASE
        WHEN ai.recommended_primary_image_index IS NOT NULL
          AND ranked.idx = ai.recommended_primary_image_index
        THEN 0
        ELSE 1
      END,
      ranked.idx ASC
    LIMIT 1
  ) gi ON true
  WHERE
    g.price_amount > 0
    AND COALESCE(gi.image_url, g.primary_image_url) IS NOT NULL

    AND (
      search_pattern IS NULL
      OR g.serial_number ILIKE search_pattern
      OR REPLACE(g.serial_number, ' ', '') ILIKE search_nospace_pattern
      OR g.internal_code ILIKE search_pattern
      OR REPLACE(COALESCE(g.internal_code, ''), ' ', '') ILIKE search_nospace_pattern
      OR COALESCE(NULLIF(TRIM(g.name_custom), ''), g.name::text) ILIKE search_pattern
      OR NULLIF(TRIM(g.name_custom_en), '') ILIKE search_pattern
      OR NULLIF(TRIM(g.name_custom_ru), '') ILIKE search_pattern
      OR COALESCE(NULLIF(TRIM(g.color_custom), ''), g.ai_color, g.color::text) ILIKE search_pattern
      OR COALESCE(NULLIF(TRIM(g.cut_custom), ''), ai.detected_cut, cu.code) ILIKE search_pattern
    )

    AND (filter_types IS NULL OR cardinality(filter_types) = 0 OR g.name::text = ANY(filter_types))

    AND (filter_colors IS NULL OR cardinality(filter_colors) = 0 OR
         COALESCE(NULLIF(TRIM(g.color_custom), ''), g.ai_color, g.color::text) = ANY(filter_colors))

    AND (filter_cuts IS NULL OR cardinality(filter_cuts) = 0 OR
         COALESCE(NULLIF(TRIM(g.cut_custom), ''), ai.detected_cut, cu.code) = ANY(filter_cuts))

    AND (filter_clarities IS NULL OR cardinality(filter_clarities) = 0 OR
         COALESCE(NULLIF(TRIM(g.clarity_custom), ''), g.clarity::text) = ANY(filter_clarities))

    AND (filter_origins IS NULL OR cardinality(filter_origins) = 0 OR o.name = ANY(filter_origins))

    AND (filter_price_min IS NULL OR g.price_amount >= filter_price_min)
    AND (filter_price_max IS NULL OR g.price_amount <= filter_price_max)

    AND (filter_weight_min IS NULL OR g.weight_carats >= filter_weight_min)
    AND (filter_weight_max IS NULL OR g.weight_carats <= filter_weight_max)

    AND (filter_in_stock_only IS NULL OR NOT filter_in_stock_only OR g.in_stock = true)

    AND (filter_treatment_status IS NULL OR cardinality(filter_treatment_status) = 0 OR g.treatment_status = ANY(filter_treatment_status))

    AND (filter_mining_countries IS NULL OR cardinality(filter_mining_countries) = 0 OR g.mining_country = ANY(filter_mining_countries))

    AND (filter_quality_classifications IS NULL OR cardinality(filter_quality_classifications) = 0 OR g.quality_classification = ANY(filter_quality_classifications))

    AND (filter_has_color_change IS NULL OR NOT filter_has_color_change OR (g.color_change_description IS NOT NULL AND g.color_change_description != ''))

    AND (filter_min_length IS NULL OR g.length_mm >= filter_min_length)
    AND (filter_max_length IS NULL OR g.length_mm <= filter_max_length)
    AND (filter_min_width IS NULL OR g.width_mm >= filter_min_width)
    AND (filter_max_width IS NULL OR g.width_mm <= filter_max_width)

    AND (
      filter_min_price_per_carat IS NULL
      OR (
        g.pricing_basis = 'per_carat'
        AND (g.price_amount::numeric / NULLIF(g.weight_carats, 0)) >= filter_min_price_per_carat
      )
    )
    AND (
      filter_max_price_per_carat IS NULL
      OR (
        g.pricing_basis = 'per_carat'
        AND (g.price_amount::numeric / NULLIF(g.weight_carats, 0)) <= filter_max_price_per_carat
      )
    )

  ORDER BY
    CASE WHEN sort_direction = 'asc' THEN
      CASE sort_by
        WHEN 'price_amount' THEN g.price_amount::text
        WHEN 'weight_carats' THEN g.weight_carats::text
        WHEN 'name' THEN COALESCE(NULLIF(TRIM(g.name_custom), ''), g.name::text)
        WHEN 'color' THEN COALESCE(NULLIF(TRIM(g.color_custom), ''), g.ai_color, g.color::text)
        WHEN 'cut' THEN COALESCE(NULLIF(TRIM(g.cut_custom), ''), ai.detected_cut, cu.code)
        ELSE g.created_at::text
      END
    END ASC,
    CASE WHEN sort_direction = 'desc' THEN
      CASE sort_by
        WHEN 'price_amount' THEN g.price_amount::text
        WHEN 'weight_carats' THEN g.weight_carats::text
        WHEN 'name' THEN COALESCE(NULLIF(TRIM(g.name_custom), ''), g.name::text)
        WHEN 'color' THEN COALESCE(NULLIF(TRIM(g.color_custom), ''), g.ai_color, g.color::text)
        WHEN 'cut' THEN COALESCE(NULLIF(TRIM(g.cut_custom), ''), ai.detected_cut, cu.code)
        ELSE g.created_at::text
      END
    END DESC
  LIMIT page_size
  OFFSET offset_val;
END;
$$;

COMMENT ON FUNCTION public.catalog_search_gemstones IS
  'Catalog search with pricing_basis, price_per_piece, quantity; per-carat filter applies to per_carat items only.';

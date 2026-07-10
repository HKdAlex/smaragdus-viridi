-- Correct mistaken per_piece backfill for legacy multi-quantity carat-priced lots.
-- Only rows auto-classified by 20260708120000 (no price_per_carat, qty > 1) are reverted.
UPDATE public.gemstones
SET
  pricing_basis = 'per_carat',
  price_per_carat = round(price_amount::numeric / weight_carats::numeric)::bigint,
  price_per_piece = NULL
WHERE pricing_basis = 'per_piece'
  AND price_per_carat IS NULL
  AND price_per_piece IS NOT NULL
  AND weight_carats IS NOT NULL
  AND weight_carats > 0;

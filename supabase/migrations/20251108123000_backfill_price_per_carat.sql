-- Backfill price_per_carat for gemstones that have price and weight information.
-- price_amount is stored in cents; divide by weight_carats to get cents per carat.

update public.gemstones
set price_per_carat = round(
    (price_amount::numeric / nullif(weight_carats, 0))::numeric,
    0
  )::bigint
where price_amount is not null
  and weight_carats is not null
  and weight_carats > 0
  and (price_per_carat is null or price_per_carat = 0);


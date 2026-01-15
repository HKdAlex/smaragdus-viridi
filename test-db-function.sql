-- Test if catalog_search_gemstones returns display_* fields
SELECT
  id,
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
  page_size => 2
)
LIMIT 2;

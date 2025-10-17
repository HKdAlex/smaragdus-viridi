# Gemstones Enriched View

## Overview

The `gemstones_enriched` view is a comprehensive database view that joins the `gemstones` table with `gemstones_ai_v6` data, providing a unified interface for accessing gemstone data with AI-generated content.

## Why Use This View?

### Performance Benefits
1. **Eliminates N+1 Queries**: No need to fetch AI data in separate queries
2. **Single Query Plan**: PostgreSQL optimizes the join once, reused for all queries
3. **Reduced Network Overhead**: Fewer round trips to the database
4. **Better Caching**: Single view can be cached more effectively

### Code Benefits
1. **Simpler Application Code**: One query instead of multiple joins
2. **Consistent Data Structure**: Same structure across catalog, search, and detail views
3. **Type Safety**: All enum fields properly cast to `text`
4. **Maintainability**: Change join logic in one place

## Available Fields

### Core Gemstone Data
- `id`, `serial_number`, `name`, `type_code`
- `color`, `color_code`, `cut`, `cut_code`, `clarity`, `clarity_code`
- `weight_carats`, `price_amount`, `price_currency`
- `description`, `in_stock`, `origin_id`
- `metadata_status`, `created_at`, `updated_at`, `ai_analyzed`

### AI-Detected Values
- `ai_color` - AI-detected color from base gemstones table
- `detected_cut` - AI-detected cut from v6 analysis
- `detected_color` - AI-detected color from v6 analysis
- `cut_detection_confidence` - Confidence score for cut detection
- `color_detection_confidence` - Confidence score for color detection
- `detected_color_description` - Detailed color description

### AI Image Selection
- `selected_image_uuid` - UUID of the AI-selected primary image
- `recommended_primary_image_index` - Index of recommended primary image

### AI-Generated Content (English)
- `technical_description_en`
- `emotional_description_en`
- `narrative_story_en`
- `historical_context_en`
- `care_instructions_en`
- `promotional_text_en`
- `marketing_highlights_en` (array)

### AI-Generated Content (Russian)
- `technical_description_ru`
- `emotional_description_ru`
- `narrative_story_ru`
- `historical_context_ru`
- `care_instructions_ru`
- `promotional_text_ru`
- `marketing_highlights_ru` (array)

### AI Metadata
- `model_version` - AI model version used for generation
- `confidence_score` - Overall confidence score
- `needs_review` - Whether content needs human review

## Usage Examples

### Basic Query
```sql
SELECT 
  id, 
  name, 
  color, 
  ai_color,
  detected_cut,
  selected_image_uuid
FROM gemstones_enriched
WHERE in_stock = true
  AND type_code = 'sapphire'
ORDER BY created_at DESC
LIMIT 20;
```

### Search Query
```sql
SELECT *
FROM gemstones_enriched
WHERE name = 'emerald'
  AND ai_analyzed = true
  AND in_stock = true;
```

### With Supabase Client
```typescript
const { data, error } = await supabase
  .from('gemstones_enriched')
  .select('*')
  .eq('type_code', 'ruby')
  .eq('in_stock', true)
  .order('created_at', { ascending: false })
  .limit(24);
```

## Migration

The view is created by migration: `20251017_create_gemstones_enriched_view.sql`

To apply:
```bash
supabase migration up
```

## Future Improvements

### Potential Additions
1. **Origin Join**: Include origin name directly in view
2. **Image Count**: Add count of images per gemstone
3. **Primary Image**: Directly include primary image URL
4. **Certification Status**: Join with certification data

### Materialized View Option
For very large datasets, consider converting to a MATERIALIZED VIEW:
```sql
CREATE MATERIALIZED VIEW gemstones_enriched_mv AS
SELECT * FROM gemstones_enriched;

-- Refresh when data changes
REFRESH MATERIALIZED VIEW gemstones_enriched_mv;
```

Benefits of materialized view:
- Even faster queries (pre-computed joins)
- No join overhead at query time
- Trade-off: needs manual refresh after data changes

## Notes

- **Images**: Still need to fetch separately from `gemstone_images` table
- **Type Casting**: All enum fields are cast to `text` for consistency
- **NULL Handling**: AI fields will be `NULL` if no v6 analysis exists (LEFT JOIN)
- **Performance**: View is optimized for read operations, updates still go to base tables

## Refactoring Checklist

When migrating existing code to use this view:

- [ ] Replace `gemstones` table queries with `gemstones_enriched` view
- [ ] Remove separate AI v6 data fetching queries
- [ ] Update TypeScript types to include AI fields
- [ ] Remove manual joins in application code
- [ ] Test that AI-detected values are properly displayed
- [ ] Verify localization still works with enriched data
- [ ] Check that image selection logic uses `selected_image_uuid`
- [ ] Ensure proper NULL handling for gemstones without AI data


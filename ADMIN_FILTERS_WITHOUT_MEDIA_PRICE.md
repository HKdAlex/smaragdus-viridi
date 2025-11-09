# Admin Filters: Without Media & Without Price

## Summary

Added two new advanced filters to the Gemstone Management interface allowing admins to quickly identify and filter gemstones that are missing media assets (images/videos) or pricing information.

## Implementation Date

November 9, 2025

## Changes Made

### 1. Enhanced Search Component (`src/features/admin/components/enhanced-search.tsx`)

**Interface Extension:**
- Added `withoutMedia?: boolean` to `SearchFilters` interface
- Added `withoutPrice?: boolean` to `SearchFilters` interface

**UI Updates:**
- Added checkboxes for both filters in the Advanced Filters panel
- Added active filter badges that display when filters are enabled
- Integrated filter state into active filter count calculation
- Included filters in clear all filters functionality

**Filter Behavior:**
- `withoutMedia`: Shows gemstones with both `primary_image_url` and `primary_video_url` as NULL
- `withoutPrice`: Shows gemstones with `price_amount` as NULL or 0 (zero prices are considered "without price" per user requirement)

### 2. Gemstone List Component (`src/features/admin/components/gemstone-list-optimized.tsx`)

**State Management:**
- Initialized both filters as `false` in default `searchFilters` state
- Added query parameter serialization for both filters when making API requests

**API Integration:**
- Passes `withoutMedia=true` when filter is enabled
- Passes `withoutPrice=true` when filter is enabled

### 3. Admin Cache Service (`src/features/admin/services/admin-cache.ts`)

**Cache Key Generation:**
- Included `withoutMedia` in search results cache key
- Included `withoutPrice` in search results cache key
- Ensures cache hits/misses work correctly with new filter combinations

### 4. Admin API Route (`src/app/api/admin/gemstones/route.ts`)

**Query Parameter Parsing:**
- Added parsing for `withoutMedia` query parameter (boolean)
- Added parsing for `withoutPrice` query parameter (boolean)
- Included both in request logging for debugging

**Database Filtering:**
```typescript
// Without Media Filter
if (withoutMedia) {
  query = query.is("primary_image_url", null).is("primary_video_url", null);
}

// Without Price Filter
if (withoutPrice) {
  query = query.or("price_amount.is.null,price_amount.eq.0");
}
```

**Logic:**
- `withoutMedia`: Filters for gemstones where BOTH primary_image_url AND primary_video_url are NULL
- `withoutPrice`: Filters for gemstones where price_amount is NULL OR equals 0

### 5. Translations

**English (`src/messages/en/admin.json`):**
```json
"filterLabels": {
  "withoutMedia": "Without Media",
  "withoutPrice": "Without Price"
}
```

**Russian (`src/messages/ru/admin.json`):**
```json
"filterLabels": {
  "withoutMedia": "Без медиа",
  "withoutPrice": "Без цены"
}
```

## Technical Details

### Database View Used
- `gemstones_enriched` view provides access to:
  - `primary_image_url` (from gemstones table)
  - `primary_video_url` (from gemstones table)
  - `price_amount` (from gemstones table)

### Filter Combinations
Filters can be used independently or together:
- **Without Media only**: Shows all gemstones lacking both images and videos
- **Without Price only**: Shows all gemstones with NULL or 0 price
- **Both filters**: Shows gemstones missing BOTH media AND price (intersection)
- **With other filters**: Can combine with type, color, cut, stock status, etc.

### Price Zero Handling
Per user requirement, gemstones with `price_amount = 0` are considered "without price" and will appear when the "Without Price" filter is enabled. This is useful for identifying incomplete records where price hasn't been set yet.

## User Interface

### Filter Location
Both filters appear in the **Advanced Filters** panel, which is accessed by clicking the "Filters" button in the main search bar.

### Active Filter Badges
When enabled, both filters display as removable badges in the active filters summary area:
- **Without Media** badge with X button to remove
- **Without Price** badge with X button to remove

### Filter Count
Both filters contribute to the active filter count badge displayed on the Filters button.

## Testing Recommendations

### Manual Testing Checklist

1. **Without Media Filter:**
   - [ ] Enable "Without Media" filter
   - [ ] Verify only gemstones without primary_image_url AND primary_video_url appear
   - [ ] Verify filter badge appears in active filters
   - [ ] Verify filter count increments
   - [ ] Click X on badge to remove filter
   - [ ] Verify results update

2. **Without Price Filter:**
   - [ ] Enable "Without Price" filter
   - [ ] Verify gemstones with NULL price appear
   - [ ] Verify gemstones with 0 price appear
   - [ ] Verify gemstones with valid prices do NOT appear
   - [ ] Verify filter badge appears
   - [ ] Remove filter and verify results update

3. **Combined Filters:**
   - [ ] Enable both filters simultaneously
   - [ ] Verify only gemstones missing BOTH media AND price appear
   - [ ] Verify both badges appear
   - [ ] Remove one filter, verify results update
   - [ ] Use "Clear All Filters" to remove both

4. **With Other Filters:**
   - [ ] Combine with stock status filter (e.g., "In Stock" + "Without Media")
   - [ ] Combine with type filter (e.g., "Emerald" + "Without Price")
   - [ ] Combine with price range (should work with Without Media, not with Without Price)

5. **Pagination:**
   - [ ] Enable filters with large result sets
   - [ ] Navigate through pages
   - [ ] Verify filter persists across page changes

6. **Caching:**
   - [ ] Enable filter, navigate away, return
   - [ ] Verify filter state is preserved (if using saved searches)
   - [ ] Change filter, verify cache invalidates and new results load

## API Request Examples

### Without Media
```
GET /api/admin/gemstones?withoutMedia=true&page=1&pageSize=50
```

### Without Price
```
GET /api/admin/gemstones?withoutPrice=true&page=1&pageSize=50
```

### Both Filters
```
GET /api/admin/gemstones?withoutMedia=true&withoutPrice=true&page=1&pageSize=50
```

### Combined with Other Filters
```
GET /api/admin/gemstones?withoutMedia=true&inStock=true&types=emerald&page=1&pageSize=50
```

## Database Query Examples

### Without Media Query
```sql
SELECT * FROM gemstones_enriched
WHERE primary_image_url IS NULL
  AND primary_video_url IS NULL;
```

### Without Price Query
```sql
SELECT * FROM gemstones_enriched
WHERE price_amount IS NULL
   OR price_amount = 0;
```

### Combined Query
```sql
SELECT * FROM gemstones_enriched
WHERE (primary_image_url IS NULL AND primary_video_url IS NULL)
  AND (price_amount IS NULL OR price_amount = 0);
```

## Benefits

1. **Data Quality Management:** Quickly identify incomplete gemstone records
2. **Workflow Optimization:** Admins can focus on completing missing information
3. **Inventory Audit:** Easy to find gemstones that need media uploads
4. **Pricing Review:** Identify gemstones that need pricing information
5. **Bulk Operations:** Can select filtered results for bulk updates

## Future Enhancements

Potential improvements for future iterations:

1. **Separate Media Filters:**
   - "Without Images" (only images missing)
   - "Without Videos" (only videos missing)
   
2. **Price Validation:**
   - "Invalid Price" (negative or suspiciously low/high)
   - "Price Below Cost" (if cost data available)

3. **Completion Score:**
   - Display percentage of required fields completed
   - Filter by completion threshold

4. **Quick Actions:**
   - Bulk upload media for filtered results
   - Bulk set prices for filtered results

## Files Modified

1. `src/features/admin/components/enhanced-search.tsx` - UI and state
2. `src/features/admin/components/gemstone-list-optimized.tsx` - API integration
3. `src/features/admin/services/admin-cache.ts` - Cache key generation
4. `src/app/api/admin/gemstones/route.ts` - Database filtering
5. `src/messages/en/admin.json` - English translations
6. `src/messages/ru/admin.json` - Russian translations

## No Breaking Changes

- All changes are additive (new optional fields)
- Existing filters continue to work unchanged
- Backward compatible with saved searches (new fields default to false)
- No database schema changes required

## Compliance

✅ **Type Safety:** All changes use strict TypeScript typing
✅ **RLS Maintained:** No changes to Row Level Security policies
✅ **Server Components:** Changes confined to existing client components
✅ **Translations:** Both English and Russian translations provided
✅ **Caching:** Cache keys updated to include new filters
✅ **No Linter Errors:** All files pass linting checks

---

**Status:** ✅ Implementation Complete
**Ready for Testing:** Yes
**Documentation:** Complete


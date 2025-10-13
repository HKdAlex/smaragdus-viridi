# Gemstone Count Explanation

**Last Updated**: 2025-10-13

## Summary

**Total gemstones in Supabase:** 1,385  
**Displayed in catalog:** 986 (71%)  
**Hidden from catalog:** 399 (29%)

---

## Breakdown

### ✅ Displayed Gemstones (986)

**Criteria:**
- Must have at least one image
- Must have price > $0

**SQL Logic:**
```sql
SELECT COUNT(DISTINCT g.id)
FROM gemstones g
INNER JOIN gemstone_images gi ON g.id = gi.gemstone_id
WHERE g.price_amount > 0;
-- Result: 986
```

---

### ❌ Hidden Gemstones (399)

**Category 1: Has images but NO price (306 gemstones)**
- Have photos uploaded
- Price not yet set (price_amount = 0)
- Cannot be displayed because they're not ready for sale

**Category 2: NO images at all (93 gemstones)**
- No photos uploaded yet
- Filtered out by INNER JOIN with gemstone_images table
- Cannot be displayed in visual catalog

---

## Why This Filtering Exists

### User Experience
- Users should only see gemstones they can actually purchase
- Showing items without prices would be confusing
- Showing items without images would look unprofessional

### Implementation

**API Route:** `src/app/api/catalog/route.ts`

```typescript
// Line 100: INNER JOIN filters out gemstones without images
images:gemstone_images!inner(id, image_url, is_primary)

// Lines 354-366: Filter counts query only includes priced items
.gt("price_amount", 0)
```

---

## Database State (2025-10-13)

| Status | Count | % of Total |
|--------|-------|------------|
| **Total in DB** | 1,385 | 100% |
| Displayable (has images + price) | 986 | 71% |
| Has images, no price | 306 | 22% |
| No images | 93 | 7% |

### By Metadata Status
- `updated`: 1,024 with images (78% of those with images)
- `needs_updating`: 268 with images (21% of those with images)

### Stock Status
- All 1,385 gemstones marked as `in_stock = true`

---

## Action Items (Future)

**For Admin Dashboard:**
1. Show stats: "986 live / 1,385 total"
2. Flag 306 gemstones that need pricing
3. Flag 93 gemstones that need images
4. Bulk actions to set prices or upload images

**For Catalog:**
- Current filtering is correct ✓
- No changes needed ✓

---

## Technical Notes

The INNER JOIN on gemstone_images is intentional and correct:
- Without INNER JOIN, gemstones without images would fail to render
- Client-side error handling would be complex
- Better to filter at database level

The price > 0 filter is also correct:
- Prevents showing "Not for sale" items
- Maintains professional appearance
- Clear business logic


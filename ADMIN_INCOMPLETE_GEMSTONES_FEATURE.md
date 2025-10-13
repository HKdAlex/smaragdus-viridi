# Admin Feature Request: Incomplete Gemstones Visibility

**Date**: 2025-10-13  
**Priority**: Medium  
**Status**: Backlog

---

## Problem

The public catalog intentionally hides gemstones that are not ready for display:

- **306 gemstones** with images but NO price set
- **93 gemstones** with NO images uploaded

Currently, these are invisible in the admin interface, making it hard for admins to:

1. Know which gemstones need attention
2. Prioritize data completion work
3. Track progress on catalog readiness

---

## Proposed Solution

### Option 1: Filter Tabs (Recommended)

Add status filter tabs to admin gemstone list:

```
[All: 1,385] [Ready: 986] [⚠️ No Price: 306] [⚠️ No Images: 93]
```

**Benefits:**

- Clear visibility of incomplete items
- One-click filtering
- Progress tracking

### Option 2: Dashboard Stats

Add stats widget to admin dashboard:

```
📊 Catalog Completeness
━━━━━━━━━━━━━━━━━━━━━━
✅ Ready for catalog: 986 (71%)
⚠️  Needs pricing: 306 (22%)
⚠️  Needs images: 93 (7%)

[View Items Needing Attention →]
```

### Option 3: Dedicated "Incomplete Items" Page

New admin route: `/admin/gemstones/incomplete`

Features:

- List of items needing attention
- Bulk actions: "Set Price", "Upload Images"
- Progress tracking
- Export to CSV for offline work

---

## Implementation Plan

### Phase 1: Add Filter Status Tabs (2 hours)

**Files to modify:**

- `src/features/admin/components/gemstone-list-optimized.tsx`

**Add filter options:**

```typescript
type GemstoneStatus =
  | "all" // All gemstones
  | "ready" // Has images + price > 0
  | "no_price" // Has images, price = 0
  | "no_images"; // No images

const statusFilters = {
  all: { count: 1385, label: "All" },
  ready: { count: 986, label: "Ready for Catalog" },
  no_price: { count: 306, label: "⚠️ Missing Price" },
  no_images: { count: 93, label: "⚠️ Missing Images" },
};
```

**SQL queries:**

```sql
-- No price
WHERE price_amount = 0

-- No images
WHERE NOT EXISTS (
  SELECT 1 FROM gemstone_images gi WHERE gi.gemstone_id = gemstones.id
)
```

### Phase 2: Dashboard Stats Widget (1 hour)

**Files to create:**

- `src/features/admin/components/catalog-completeness-widget.tsx`

**Place on:**

- Admin dashboard home page
- Shows progress bars
- Links to filtered views

### Phase 3: Bulk Actions (3 hours)

**Features:**

- Bulk price setting
- Bulk image upload
- Bulk "mark as incomplete" flagging

---

## Success Metrics

- [ ] Admin can see count of incomplete items
- [ ] Admin can filter to show only incomplete items
- [ ] Admin can bulk-edit incomplete items
- [ ] Progress is visible and trackable

---

## Notes

This feature should be implemented AFTER:

- Phase 1 (React Query) is complete
- Admin component is refactored
- We have stable admin interface

**Estimated Total Time:** 6 hours

**Priority:** Medium (not blocking current work)

**Tracking:** Add to backlog after Phase 1 completion

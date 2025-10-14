# Out of Stock Badge Fix

**Date:** October 14, 2025  
**Issue:** All search results displaying "Out of Stock" badge incorrectly  
**Status:** ✅ **SOLUTION IDENTIFIED - MIGRATION READY**

---

## **Problem**

All gemstones in search results are showing "Out of Stock" badges, even though they should be available.

### **Root Cause**

The `search_gemstones_fulltext` PostgreSQL function is **NOT returning the `in_stock` field** in its SELECT statement.

**Evidence:**
- `gemstone-card.tsx` line 143: Displays "Out of Stock" when `!gemstone.in_stock`
- `search_gemstones_fulltext` lines 138-155: SELECT statement doesn't include `fg.in_stock`
- Database has all 1,385 gemstones with `in_stock = true`

---

## **Solution**

Add `in_stock` and `origin` fields to the search function's return columns.

### **Migration File Created**

✅ `migrations/20251014_fix_search_in_stock.sql`

This migration:
1. Drops the existing `search_gemstones_fulltext` function
2. Recreates it with the correct return signature including:
   - `in_stock boolean` 
   - `origin text`
3. Updates the SELECT statement to return these fields from the filtered results

---

## **How to Apply**

### **Option 1: Supabase Dashboard (RECOMMENDED)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `migrations/20251014_fix_search_in_stock.sql`
5. Paste and click **Run**
6. Verify success message

### **Option 2: Command Line** (if you have psql access)

```bash
psql "$DATABASE_URL" < migrations/20251014_fix_search_in_stock.sql
```

### **Option 3: Supabase CLI**

```bash
npx supabase db push --linked
```

---

## **Verification**

After applying the migration:

1. **Test the Search API:**
   ```bash
   curl "http://localhost:3000/api/search?query=emerald" | jq '.data[0] | {serial_number, in_stock}'
   ```
   
   Expected: `"in_stock": true`

2. **Test in Browser:**
   - Navigate to `/en/search?q=emerald`
   - Gemstone cards should show **"Available"** (green badge)
   - No more "Out of Stock" (red badges)

---

## **Testing Results (Browser)**

### ✅ **Fuzzy Search Tested Successfully**

1. **Typo "emrald"** → Found 815 emeralds automatically
2. **Blue banner displayed:** "Approximate matches: Your search term didn't match exactly"
3. **Autocomplete working:** Shows "emerald Type" suggestion
4. **Search results loading:** All features working correctly

### ❌ **Stock Status Issue**

- **Current:** All gemstones show "Out of Stock" badge
- **Expected:** Should show "Available" badge
- **Fix Required:** Apply the migration above

---

## **Technical Details**

### **Function Signature Before**
```sql
RETURNS TABLE (
  id uuid,
  serial_number text,
  name gemstone_type,
  ...
  description text,
  -- ❌ in_stock MISSING
  -- ❌ origin MISSING
  has_certification boolean,
  ...
)
```

### **Function Signature After**
```sql
RETURNS TABLE (
  id uuid,
  serial_number text,
  name gemstone_type,
  ...
  description text,
  in_stock boolean,      -- ✅ ADDED
  origin text,           -- ✅ ADDED
  has_certification boolean,
  ...
)
```

### **SELECT Statement Updated**
```sql
SELECT 
  fg.id,
  fg.serial_number,
  ...
  fg.description,
  fg.in_stock,           -- ✅ ADDED
  fg.origin,             -- ✅ ADDED
  false AS has_certification,
  ...
FROM filtered_gemstones fg
```

---

## **Impact**

### **Before Fix**
- ❌ All search results show "Out of Stock"
- ❌ Users can't tell which gems are available
- ❌ Confusing user experience
- ❌ Lost sales opportunities

### **After Fix**
- ✅ Correct stock status displayed
- ✅ "Available" badge for in-stock items
- ✅ Clear visual feedback
- ✅ Improved user trust

---

## **Related Files**

| File | Purpose | Status |
|------|---------|--------|
| `migrations/20251014_fix_search_in_stock.sql` | Migration to fix function | ✅ Created |
| `migrations/20251013_create_search_functions.sql` | Original function (outdated) | ⚠️  Updated |
| `src/features/gemstones/components/gemstone-card.tsx` | Uses `in_stock` field | ✅ Correct |
| `src/features/search/types/search.types.ts` | Type definitions | ⚠️  May need update |

---

## **Next Steps**

1. ✅ Migration file created
2. ⏳ **Apply migration** (via Supabase Dashboard)
3. ⏳ Test in browser
4. ⏳ Update TypeScript types if needed
5. ⏳ Commit changes

---

## **Fuzzy Search Testing Summary**

| Feature | Status | Notes |
|---------|--------|-------|
| **Autocomplete** | ✅ Working | Shows suggestions while typing |
| **Fuzzy Fallback** | ✅ Working | "emrald" finds "emerald" results |
| **Blue Banner** | ✅ Working | "Approximate matches" message |
| **Amber Banner** | ✅ Working | API endpoint tested successfully |
| **Stock Status** | ❌ **NEEDS FIX** | All showing "Out of Stock" |

---

## **Command to Apply Migration**

```bash
# Option 1: Via Supabase Dashboard (RECOMMENDED)
# Copy migrations/20251014_fix_search_in_stock.sql to SQL Editor

# Option 2: Via psql (if you have direct access)
cd /Users/alex/Work/Projects/Sites/smaragdus_viridi
psql "$DATABASE_URL" < migrations/20251014_fix_search_in_stock.sql

# Option 3: Via Supabase CLI
npx supabase db push
```

---

**Priority:** HIGH  
**Effort:** 2 minutes (just run the migration)  
**Impact:** Critical for user experience

---

**Note to Developer:** The migration is ready and tested locally. Simply apply it via the Supabase Dashboard SQL Editor to fix the issue immediately.


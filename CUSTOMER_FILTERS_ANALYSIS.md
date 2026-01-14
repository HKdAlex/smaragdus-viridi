# Customer-Facing Filters/Search Analysis

**Date:** January 14, 2026  
**Purpose:** Inventory current customer-facing filters, analyze database capabilities, and document misalignments

---

## Executive Summary

The current filter implementation provides a solid foundation but has several gaps between what's available in the database and what's exposed to customers. Key findings:

- **11 filters** are currently implemented in the UI
- **15+ additional filterable fields** exist in the database but are not exposed
- **Critical missing filters:** Treatment status, mining/cutting country, quality classification, color change description
- **Partially implemented:** Origin filter (UI exists but may not be fully functional)

---

## Part 1: Current Customer-Facing Filters (UI Implementation)

### 1.1 Catalog Page Filters (`/catalog`)

Located in `src/features/gemstones/components/filters/`

| Filter | Type | UI Component | Status |
|--------|------|--------------|--------|
| **Text Search** | Text input | Debounced search | ✅ Active |
| **Gemstone Type** | Multi-select dropdown | FilterDropdown | ✅ Active |
| **Color** | Multi-select dropdown / Visual picker | FilterDropdown / ColorPicker | ✅ Active |
| **Cut** | Multi-select dropdown / Visual selector | FilterDropdown / CutShapeSelector | ✅ Active |
| **Clarity** | Multi-select dropdown / Visual selector | FilterDropdown / ClaritySelector | ✅ Active |
| **Origin** | Multi-select dropdown | FilterDropdown | ✅ Active |
| **Price Range** | Range slider / Cards | RangeSlider / PriceRangeCards | ✅ Active |
| **Weight Range** | Range slider / Cards | RangeSlider / WeightRangeCards | ✅ Active |
| **In Stock Only** | Toggle/Checkbox | Checkbox / ToggleCards | ✅ Active |
| **Has Certification** | Toggle | ToggleCards | ✅ Active |
| **Has Images** | Toggle | ToggleCards | ✅ Active |

### 1.2 Search Page Filters (`/search`)

Located in `src/features/search/components/search-results.tsx`

| Filter | Type | Status |
|--------|------|--------|
| **Text Query** | Text input | ✅ Active |
| **Search Descriptions** | Toggle | ✅ Active |
| **Filter Sidebar** | Full filter panel | ⚠️ **DISABLED** (commented out in code) |

**Note:** The search page has the filter sidebar **temporarily disabled** per code comment: "Filter Sidebar - temporarily disabled to test search functionality"

### 1.3 Filter UI Modes

The catalog provides two filter modes:
1. **Standard Mode** - Traditional dropdown-based filters
2. **Visual Mode** - Interactive visual selectors with icons and color circles

---

## Part 2: Database Schema - Available Filterable Fields

### 2.1 Core Gemstone Fields (`gemstones` table)

| Field | Type | Currently Filterable | Notes |
|-------|------|---------------------|-------|
| `name` | enum (gemstone_type) | ✅ Yes | 20 types available |
| `color` | enum (gem_color) | ✅ Yes | 22 colors (diamond grades + basic + fancy) |
| `cut_id` / `cut_code` | FK to cuts table | ✅ Yes | 18 cut types |
| `clarity` | enum (gem_clarity) | ✅ Yes | 9 clarity grades (FL to I1) |
| `weight_carats` | numeric | ✅ Yes | Range filter |
| `price_amount` | numeric | ✅ Yes | Range filter (stored in cents) |
| `in_stock` | boolean | ✅ Yes | Toggle filter |
| `origin_id` | FK to origins | ✅ Yes | 24 origins seeded |
| `serial_number` | text | ✅ Yes | Via text search |
| `internal_code` | text | ✅ Yes | Via text search |

### 2.2 Flexible Property Fields (FLEX-C0.1) - **NOT EXPOSED**

| Field | Type | Purpose | Customer Value |
|-------|------|---------|----------------|
| `name_custom` | text | Custom gemstone name | High - "Paraiba Tourmaline" vs generic "tourmaline" |
| `color_custom` | text | Custom color description | High - More descriptive colors |
| `cut_custom` | text | Custom cut description | Medium - Unusual cuts |
| `clarity_custom` | text | Custom clarity description | Medium - Non-standard grading |
| `treatment_status` | text | Treatment/enhancement status | **Critical** - "Untreated", "Heat treated", "Oiled" |
| `color_change_description` | text | Color change effect | **Critical** - For alexandrites |
| `mining_country` | text | Country where mined | **High** - Geographic preference |
| `cutting_country` | text | Country where cut | Medium - Quality indicator |
| `quality_classification` | text | Stone-specific grading | **High** - Russian ТУ Г1/Г2/Г3 |
| `enhancement_notes` | text | Additional treatment details | High - Transparency |

### 2.3 AI-Detected Fields - **NOT EXPOSED**

| Field | Type | Purpose | Customer Value |
|-------|------|---------|----------------|
| `ai_color` | text | AI-detected color | Medium - Alternative color view |
| `ai_cut` | text | AI-detected cut | Medium - Verification |
| `ai_clarity` | text | AI-detected clarity | Medium - Verification |
| `ai_origin` | text | AI-detected origin | Medium - Verification |
| `ai_treatment` | text | AI-detected treatment | High - Independent verification |
| `ai_quality_grade` | text | AI quality assessment | High - Independent grading |
| `ai_confidence_score` | numeric | AI confidence level | Low - Technical metric |

### 2.4 Dimensions - **NOT EXPOSED**

| Field | Type | Purpose | Customer Value |
|-------|------|---------|----------------|
| `length_mm` | numeric | Length in mm | **High** - Size specification |
| `width_mm` | numeric | Width in mm | **High** - Size specification |
| `depth_mm` | numeric | Depth in mm | Medium - Technical spec |

### 2.5 Price Fields - **PARTIALLY EXPOSED**

| Field | Type | Currently Filterable | Notes |
|-------|------|---------------------|-------|
| `price_amount` | numeric | ✅ Yes | Main price filter |
| `price_per_carat` | numeric | ❌ No | **High value** - Industry standard metric |
| `premium_price_amount` | numeric | ❌ No | VIP pricing |

### 2.6 Related Tables

#### Origins Table (24 records seeded)
- Myanmar, Thailand, Sri Lanka, India, Pakistan, China
- Colombia, Brazil, Ecuador
- Tanzania, Madagascar, South Africa, Botswana, Zimbabwe, Mozambique, Kenya, DRC
- USA, Canada, Mexico
- Russia, Australia
- Laboratory-grown, Synthetic

#### Cuts Table (18 records seeded)
- Round Brilliant, Oval, Marquise, Pear, Emerald Cut
- Princess, Cushion, Radiant, Asscher, Baguette
- Heart, Triangle, Trapezoid, Rhombus, Pentagon, Hexagon
- Cabochon, Fantasy

#### Certifications Table
- `certificate_type` - Type of certification
- `certificate_number` - Certificate number
- Currently only boolean "has certification" exposed

---

## Part 3: Enums and Allowed Values

### 3.1 Gemstone Types (20 values)
```
diamond, emerald, ruby, sapphire, amethyst, topaz, garnet, peridot, 
citrine, tanzanite, aquamarine, morganite, tourmaline, zircon, 
apatite, quartz, paraiba, spinel, alexandrite, agate
```

### 3.2 Colors (22 values)
```
Diamond grades: D, E, F, G, H, I, J, K, L, M
Basic colors: red, blue, green, yellow, pink, white, black, colorless
Fancy colors: fancy-yellow, fancy-blue, fancy-pink, fancy-green
```

### 3.3 Clarity Grades (9 values)
```
FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2, I1
```

---

## Part 4: Misalignment Analysis

### 4.1 Critical Missing Filters (High Customer Impact)

| Missing Filter | Database Field | Why Important |
|----------------|----------------|---------------|
| **Treatment Status** | `treatment_status` | Customers care deeply about natural vs treated stones |
| **Mining Country** | `mining_country` | Geographic origin affects value and preference |
| **Price Per Carat** | `price_per_carat` | Industry-standard comparison metric |
| **Dimensions** | `length_mm`, `width_mm` | Size requirements for jewelry settings |
| **Quality Classification** | `quality_classification` | Professional grading systems |
| **Color Change** | `color_change_description` | Essential for alexandrites |

### 4.2 Partially Implemented Filters

| Filter | Issue | Impact |
|--------|-------|--------|
| **Origin Filter** | UI exists but search page sidebar is disabled | Customers can't filter by origin on search |
| **Has AI Analysis** | Defined in types but not in visual filters | Missing from V2 visual mode |
| **Certificate Type** | Only boolean "has certification" | Can't filter by GIA vs IGI vs other labs |

### 4.3 UI/UX Gaps

| Gap | Description | Recommendation |
|-----|-------------|----------------|
| **Search Page Filters Disabled** | Filter sidebar commented out | Re-enable or provide alternative |
| **No Dimension Filters** | Can't search by size | Add length/width range filters |
| **No Treatment Filter** | Critical for buyers | Add treatment status filter |
| **No Sorting by Price/Carat** | Missing sort option | Add price_per_carat sort |

### 4.4 Data Quality Gaps

| Gap | Description | Impact |
|-----|-------------|--------|
| **Flexible fields may be empty** | `name_custom`, `treatment_status` etc. may not be populated | Filters would return no results |
| **AI fields inconsistent** | Not all gemstones have AI analysis | AI-based filters may be unreliable |
| **Origin data linkage** | Some gemstones may lack `origin_id` | Origin filter may miss items |

---

## Part 5: Recommendations

### 5.1 Immediate Actions (High Priority)

1. **Re-enable search page filter sidebar** - Currently disabled, limiting search functionality
2. **Add Treatment Status filter** - Critical for customer trust and buying decisions
3. **Add Mining Country filter** - High customer demand for geographic origin
4. **Add Dimensions filter** - Essential for jewelry makers

### 5.2 Short-term Improvements

1. **Add Price Per Carat filter/sort** - Industry standard metric
2. **Add Certificate Type filter** - Allow filtering by certification lab
3. **Add Color Change filter** - For alexandrite buyers
4. **Add Quality Classification filter** - For professional buyers

### 5.3 Data Population Required

Before exposing new filters, ensure data is populated:
- Run data audit on `treatment_status` field population
- Verify `mining_country` data completeness
- Check `quality_classification` usage

### 5.4 API Enhancements Needed

The catalog API (`/api/catalog`) supports these filters but UI doesn't expose all:
- `hasAIAnalysis` - Defined but not in visual mode
- Need to add support for new filters (treatment, dimensions, etc.)

---

## Part 6: Filter Implementation Status Matrix

| Filter | Type Definition | API Support | Standard UI | Visual UI | Search Page |
|--------|-----------------|-------------|-------------|-----------|-------------|
| Text Search | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gemstone Type | ✅ | ✅ | ✅ | ❌ | ⚠️ Disabled |
| Color | ✅ | ✅ | ✅ | ✅ | ⚠️ Disabled |
| Cut | ✅ | ✅ | ✅ | ✅ | ⚠️ Disabled |
| Clarity | ✅ | ✅ | ✅ | ✅ | ⚠️ Disabled |
| Origin | ✅ | ✅ | ✅ | ❌ | ⚠️ Disabled |
| Price Range | ✅ | ✅ | ✅ | ✅ | ⚠️ Disabled |
| Weight Range | ✅ | ✅ | ✅ | ✅ | ⚠️ Disabled |
| In Stock Only | ✅ | ✅ | ✅ | ✅ | ⚠️ Disabled |
| Has Certification | ✅ | ✅ | ❌ | ✅ | ⚠️ Disabled |
| Has Images | ✅ | ✅ | ❌ | ✅ | ⚠️ Disabled |
| Has AI Analysis | ✅ | ✅ | ❌ | ❌ | ⚠️ Disabled |
| Treatment Status | ❌ | ❌ | ❌ | ❌ | ❌ |
| Mining Country | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dimensions | ❌ | ❌ | ❌ | ❌ | ❌ |
| Price Per Carat | ❌ | ❌ | ❌ | ❌ | ❌ |
| Quality Class | ❌ | ❌ | ❌ | ❌ | ❌ |
| Color Change | ❌ | ❌ | ❌ | ❌ | ❌ |
| Certificate Type | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Fully implemented
- ⚠️ Implemented but disabled/limited
- ❌ Not implemented

---

## Part 7: File References

### Filter Type Definitions
- `src/features/gemstones/types/filter.types.ts`

### Filter UI Components
- `src/features/gemstones/components/filters/advanced-filters-controlled.tsx`
- `src/features/gemstones/components/filters/advanced-filters-v2-controlled.tsx`
- `src/features/gemstones/components/filters/filter-sidebar.tsx`
- `src/features/gemstones/components/filters/filter-dropdown.tsx`
- `src/features/gemstones/components/filters/range-slider.tsx`
- `src/features/gemstones/components/filters/visual/` (visual filter components)

### API Endpoints
- `src/app/api/catalog/route.ts` - Main catalog API with filtering
- `src/app/api/search/route.ts` - Search API
- `src/app/api/catalog/category-counts/route.ts` - Category counts

### Database Schema
- `src/shared/types/database.ts` - Generated Supabase types
- `supabase/migrations/20260109161015_add_flexible_gemstone_fields.sql` - Flexible fields

### Localization
- `src/messages/en/filters.json` - English filter labels
- `src/messages/ru/filters.json` - Russian filter labels

---

## Appendix: Database Function for Filter Counts

The system uses `get_catalog_filter_counts` RPC function to efficiently retrieve filter option counts. This function should be updated when adding new filters.

---

*Document generated: January 14, 2026*

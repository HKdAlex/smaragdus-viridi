# Filter & Search System Overhaul — Vision Document

<!-- markdownlint-disable MD041 -->

> This document describes architectural intent and long-term direction.  
> It is **not** an implementation checklist and must not be executed directly.

## How to Read This Document

- **Read for intent and constraints**: this file explains why the system is architected this way and what properties are non-negotiable.
- **Treat phases as narrative, not work items**: the phase sections describe _directional sequencing_ and rationale. They are not a contract and not an execution surface.
- **Use `docs/plan/filter-search-overhaul/01_contracts.md` for execution**: all implementation work must be derived from explicit contracts with reality checks and acceptance tests.
- **Reality-check anything that looks like "current state"**: the embedded plan contains claims about existing systems/files. Treat those as _unverified_ until confirmed.

---

# Filter & Search System Overhaul — Comprehensive Customer-Facing Experience

This document describes the architectural vision for overhauling the customer-facing filter and search system in the Crystallique gemstone platform, addressing gaps identified in the CUSTOMER_FILTERS_ANALYSIS.md audit and incorporating the flexible property fields (FLEX-C0.1) recently added for professional jeweler data.

## Executive Goals (Non-Negotiable)

### G1 — Complete Filter Coverage

- **Requirement**: All customer-relevant gemstone attributes must be filterable, including the new flexible fields (treatment status, mining country, quality classification, etc.).
- **Rationale**: Customers need to find gemstones matching their specific requirements. Missing filters force manual browsing of hundreds of items.

### G2 — Re-enable Search Page Filters

- **Requirement**: The search page (`/search`) must have full filter functionality, not just text search.
- **Rationale**: The filter sidebar is currently disabled on the search page (commented out in code). This significantly limits search usefulness.

### G3 — Consistent Filter Experience

- **Requirement**: Filter behavior must be consistent across catalog page, search page, and any future listing pages.
- **Rationale**: Users expect the same filtering capabilities regardless of entry point.

### G4 — Professional Buyer Support

- **Requirement**: Filters must support professional gemstone buyers who need to filter by treatment status, quality classification (Г1/Г2/Г3), mining country, and other professional specifications.
- **Rationale**: The platform serves both retail and wholesale/professional buyers. The FLEX-C0.1 fields were added specifically for this use case.

### G5 — Performance Preservation

- **Requirement**: Adding new filters must not degrade page load or query performance.
- **Rationale**: Current catalog performance is acceptable; new features must not regress it.

### G6 — Localization Support

- **Requirement**: All new filters must support EN/RU translations.
- **Rationale**: The platform serves both English and Russian-speaking users.

### G7 — Premium UX/UI Design Excellence

- **Requirement**: The filter and search experience must be elevated to luxury e-commerce standards with beautiful, intuitive, and delightful interactions.
- **Rationale**: Crystallique sells premium gemstones. The filtering experience must match the quality and sophistication of the products. A luxury shopping experience builds trust and justifies premium pricing.

**UX/UI Principles**:
1. **Visual Elegance**: Clean, spacious layouts with premium typography and subtle animations
2. **Intuitive Discovery**: Customers should discover gemstones effortlessly, not fight with filters
3. **Instant Feedback**: Every interaction should feel responsive and provide immediate visual feedback
4. **Guided Experience**: Smart defaults, helpful hints, and progressive disclosure of advanced options
5. **Delight Moments**: Micro-interactions, smooth transitions, and polished details that surprise and delight

## Current State Analysis (from CUSTOMER_FILTERS_ANALYSIS.md)

### What Exists Today

#### Currently Implemented Filters (11 total)

| Filter | Type | Catalog Page | Search Page |
|--------|------|--------------|-------------|
| Text Search | Text input | ✅ | ✅ |
| Gemstone Type | Multi-select | ✅ | ⚠️ Disabled |
| Color | Multi-select | ✅ | ⚠️ Disabled |
| Cut | Multi-select | ✅ | ⚠️ Disabled |
| Clarity | Multi-select | ✅ | ⚠️ Disabled |
| Origin | Multi-select | ✅ | ⚠️ Disabled |
| Price Range | Range slider | ✅ | ⚠️ Disabled |
| Weight Range | Range slider | ✅ | ⚠️ Disabled |
| In Stock Only | Toggle | ✅ | ⚠️ Disabled |
| Has Certification | Toggle | ✅ | ⚠️ Disabled |
| Has Images | Toggle | ✅ | ⚠️ Disabled |

#### Critical Missing Filters (High Customer Impact)

| Missing Filter | Database Field | Customer Value |
|----------------|----------------|----------------|
| Treatment Status | `treatment_status` | **Critical** — Natural vs treated |
| Mining Country | `mining_country` | **High** — Geographic preference |
| Price Per Carat | `price_per_carat` | **High** — Industry standard metric |
| Dimensions (L×W) | `length_mm`, `width_mm` | **High** — Size for settings |
| Quality Classification | `quality_classification` | **High** — Professional grading |
| Color Change | `color_change_description` | **Medium** — Alexandrite buyers |

#### Database Fields Available But Not Exposed

From FLEX-C0.1 migration:
- `treatment_status` — Treatment/enhancement status
- `mining_country` — Country where mined
- `cutting_country` — Country where cut
- `quality_classification` — Stone-specific grading (Г1/Г2/Г3)
- `color_change_description` — Color change effect
- `enhancement_notes` — Additional treatment details
- `name_custom`, `color_custom`, `cut_custom`, `clarity_custom` — Custom descriptions

From core schema:
- `length_mm`, `width_mm`, `depth_mm` — Dimensions
- `price_per_carat` — Calculated price per carat

### Key Gaps / Blockers

1. **Search page filter sidebar disabled** — Code comment: "temporarily disabled to test search functionality"
2. **Visual filter mode missing** Gemstone Type and Origin filters
3. **No treatment/enhancement filter** — Critical for professional buyers
4. **No dimension filters** — Important for jewelry makers
5. **No price-per-carat filter/sort** — Industry standard metric
6. **Filter counts API** may need updates for new fields

## Target Architecture

### New Filter Categories

#### Category 1: Core Filters (Already Implemented)
- Gemstone Type, Color, Cut, Clarity, Origin
- Price Range, Weight Range
- In Stock, Has Certification, Has Images

#### Category 2: Professional Filters (New)
- Treatment Status (Natural, Heated, Oiled, Diffused, etc.)
- Mining Country (distinct from Origin which includes mine/region)
- Quality Classification (Г1, Г2, Г3, AAA, AA, A, etc.)
- Color Change (for alexandrites and similar)

#### Category 3: Technical Filters (New)
- Dimensions (Length × Width range)
- Price Per Carat (range)
- Has AI Analysis

#### Category 4: Search Enhancements
- Search in descriptions toggle (already exists)
- Fuzzy search suggestions (already exists)
- Filter sidebar on search page (re-enable)

### Data Flow

```
Customer Filter Selection
        ↓
Filter State (URL params) ←→ Filter Components
        ↓
API Request (catalog/search)
        ↓
Database Query (gemstones_enriched + new fields)
        ↓
Results + Filter Counts
        ↓
UI Display
```

### Filter Types Architecture

```typescript
interface AdvancedGemstoneFilters {
  // Existing
  search?: string;
  gemstoneTypes?: GemstoneType[];
  colors?: GemColor[];
  cuts?: string[];
  clarities?: GemClarity[];
  origins?: string[];
  priceRange?: PriceRange;
  weightRange?: WeightRange;
  inStockOnly?: boolean;
  hasCertification?: boolean;
  hasImages?: boolean;
  hasAIAnalysis?: boolean;
  
  // NEW: Professional Filters
  treatmentStatus?: TreatmentStatus[];  // 'natural' | 'heated' | 'oiled' | 'diffused' | 'untreated'
  miningCountries?: string[];           // Country codes or names
  qualityClassifications?: string[];    // 'Г1' | 'Г2' | 'Г3' | 'AAA' | 'AA' | 'A' | etc.
  hasColorChange?: boolean;             // For alexandrites
  
  // NEW: Technical Filters
  dimensionRange?: DimensionRange;      // { minLength, maxLength, minWidth, maxWidth }
  pricePerCaratRange?: PriceRange;      // Price per carat range
  
  // Sorting
  sortBy?: GemstoneSort;
  sortDirection?: 'asc' | 'desc';
}

type TreatmentStatus = 'natural' | 'heated' | 'oiled' | 'diffused' | 'irradiated' | 'filled' | 'coated' | 'untreated' | 'unknown';

interface DimensionRange {
  minLength?: number;
  maxLength?: number;
  minWidth?: number;
  maxWidth?: number;
}
```

## Implementation Strategy

### Phase 0: Foundation & Re-enablement

1. **Re-enable search page filter sidebar** — Remove the disabled code, verify functionality
2. **Add missing filters to Visual mode** — Gemstone Type, Origin selectors
3. **Update filter counts API** — Include new fields in aggregation

### Phase 1: Professional Filters

1. **Treatment Status filter** — Multi-select with predefined options + custom
2. **Mining Country filter** — Multi-select with country list
3. **Quality Classification filter** — Multi-select with common grades
4. **Color Change filter** — Boolean toggle

### Phase 2: Technical Filters

1. **Dimension filter** — Length × Width range sliders
2. **Price Per Carat filter** — Range slider with currency formatting
3. **Has AI Analysis filter** — Add to visual mode

### Phase 3: Search Integration

1. **Full filter support on search page** — All filters available
2. **Filter persistence across search/catalog** — Shared URL params
3. **Search within filtered results** — Combined text + filter queries

### Phase 4: Performance & Polish

1. **Filter counts optimization** — Ensure new filters don't slow down counts
2. **UI/UX refinement** — Professional filter section styling
3. **Mobile optimization** — Ensure new filters work on mobile

### Phase 5: UX/UI Design Excellence

1. **Visual Design Overhaul** — Elevate filter UI to luxury standards
2. **Search Experience Enhancement** — Beautiful, intelligent search interface
3. **Micro-interactions & Animations** — Polished, delightful interactions
4. **Results Display Optimization** — Premium gemstone presentation

## UX/UI Design Vision

### Design Philosophy

The filter and search experience should feel like browsing a high-end jewelry boutique, not a database query tool. Every element should convey quality, expertise, and attention to detail.

### Visual Design Principles

#### 1. Luxury Aesthetic
- **Color Palette**: Rich, sophisticated colors that complement gemstone imagery
- **Typography**: Elegant, readable fonts with proper hierarchy
- **Spacing**: Generous whitespace that lets content breathe
- **Imagery**: High-quality gemstone photos as visual anchors

#### 2. Filter Sidebar Design

**Current State Issues**:
- Functional but utilitarian appearance
- Dense layout can feel overwhelming
- Lacks visual hierarchy between filter groups
- Toggle cards feel basic

**Target State**:
```
┌─────────────────────────────────────┐
│  ✨ Find Your Perfect Gemstone      │  ← Inspiring header
│                                     │
│  🔍 [Search gemstones...]           │  ← Elegant search input
│                                     │
├─────────────────────────────────────┤
│  GEMSTONE TYPE                      │  ← Clear section headers
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 💎  │ │ 💚  │ │ ❤️  │           │  ← Visual type selectors
│  │Ruby │ │Emer.│ │Saph.│           │     with gemstone icons
│  └─────┘ └─────┘ └─────┘           │
│                                     │
├─────────────────────────────────────┤
│  CUT SHAPE                          │
│  [Visual cut shape selector]        │  ← Interactive shape picker
│                                     │
├─────────────────────────────────────┤
│  COLOR                              │
│  ○ ○ ○ ○ ○ ○ ○ ○                   │  ← Color swatches
│                                     │
├─────────────────────────────────────┤
│  PRICE RANGE                        │
│  $500 ────●────────●──── $50,000   │  ← Smooth range slider
│                                     │
├─────────────────────────────────────┤
│  ▼ PROFESSIONAL SPECS               │  ← Collapsible advanced
│    Treatment: [Natural ▼]           │     section
│    Origin: [Any Country ▼]          │
│    Quality: [All Grades ▼]          │
│                                     │
├─────────────────────────────────────┤
│  [Clear All]  [Apply Filters (24)]  │  ← Action buttons with count
└─────────────────────────────────────┘
```

#### 3. Search Experience Design

**Search Input**:
- Large, prominent search field with subtle shadow
- Animated placeholder text suggesting search ideas
- Real-time suggestions dropdown with gemstone thumbnails
- Voice search icon (future enhancement)

**Search Results**:
- Beautiful grid/list toggle with smooth transition
- Gemstone cards with hover effects showing key details
- Quick-view modal for gemstone preview
- Infinite scroll with elegant loading states

#### 4. Interactive Elements

**Filter Chips (Active Filters)**:
```
┌────────────────────────────────────────────────┐
│ Active: [Ruby ×] [Natural ×] [$1k-$5k ×] Clear │
└────────────────────────────────────────────────┘
```
- Pill-shaped chips with smooth remove animation
- Color-coded by filter category
- One-click clear all option

**Range Sliders**:
- Smooth, responsive drag interaction
- Value tooltips that follow the handle
- Histogram background showing distribution (future)
- Preset quick-select buttons ($0-$1k, $1k-$5k, etc.)

**Multi-Select Dropdowns**:
- Search within dropdown for long lists
- Checkbox items with count badges
- "Select All" / "Clear" quick actions
- Smooth open/close animations

#### 5. Loading & Empty States

**Loading States**:
- Skeleton loaders matching content layout
- Subtle shimmer animation
- Progressive loading (filters load before results)

**Empty States**:
- Friendly, helpful messaging
- Suggestions to broaden search
- Beautiful illustration or icon
- Quick actions to modify filters

**No Results**:
```
┌─────────────────────────────────────┐
│         💎                          │
│                                     │
│   No gemstones match your filters   │
│                                     │
│   Try:                              │
│   • Expanding your price range      │
│   • Selecting more colors           │
│   • Removing some filters           │
│                                     │
│   [Clear All Filters]               │
└─────────────────────────────────────┘
```

#### 6. Mobile Experience

**Bottom Sheet Filter**:
- Full-screen filter panel on mobile
- Swipe-to-dismiss gesture
- Sticky apply button at bottom
- Smooth spring animations

**Touch Interactions**:
- Large touch targets (min 44px)
- Haptic feedback on selection (where supported)
- Pull-to-refresh on results
- Swipe gestures for quick actions

### Micro-interactions & Animations

#### Filter Selection
- Subtle scale + color change on hover
- Smooth check/uncheck animation
- Ripple effect on click
- Count badge updates with number animation

#### Results Updates
- Fade transition when filters change
- Staggered card entrance animation
- Smooth reflow when items added/removed
- Loading shimmer during fetch

#### Search Suggestions
- Dropdown slides down smoothly
- Items fade in sequentially
- Keyboard navigation highlights
- Selected item scales slightly

### Accessibility Requirements

- **Keyboard Navigation**: Full keyboard support for all filters
- **Screen Readers**: Proper ARIA labels and announcements
- **Color Contrast**: WCAG AA compliance minimum
- **Focus States**: Clear, visible focus indicators
- **Reduced Motion**: Respect `prefers-reduced-motion`

### Performance Considerations

- **Animations**: Use CSS transforms and opacity only (GPU-accelerated)
- **Debouncing**: Debounce filter changes to avoid excessive API calls
- **Virtualization**: Virtual scrolling for long filter option lists
- **Code Splitting**: Lazy load visual filter components

## Key Decisions

### Decision 1: Treatment Status Values

**Chosen**: Predefined list with "Other" option

**Values**:
- `natural` — No treatment (most valuable)
- `heated` — Heat treatment (common for sapphires/rubies)
- `oiled` — Oil treatment (common for emeralds)
- `diffused` — Diffusion treatment
- `irradiated` — Irradiation treatment
- `filled` — Fracture filling
- `coated` — Surface coating
- `untreated` — Explicitly untreated
- `unknown` — Treatment status unknown

**Rationale**: These cover 95%+ of treatment types. Custom `treatment_status` field allows any value, but filters use predefined list for consistency.

### Decision 2: Quality Classification Approach

**Chosen**: Free-form with common suggestions

**Approach**: 
- Filter UI shows common grades (Г1, Г2, Г3, AAA, AA, A, B, C)
- Database field is free-text, allowing any classification
- Filter matches exact values or contains search

**Rationale**: Quality grading systems vary by stone type and region. Russian ТУ grades (Г1/Г2/Г3) are specific to alexandrites. Other systems exist for different stones.

### Decision 3: Mining Country vs Origin

**Chosen**: Separate filters

- **Origin** — Structured data from `origins` table (includes mine name, region)
- **Mining Country** — Free-text field from `mining_country` column

**Rationale**: Origin is more specific (includes mine/region), but many gemstones only have country-level provenance. Both are valuable filters.

### Decision 4: Dimension Filter Approach

**Chosen**: Length × Width range (ignore depth)

**Rationale**: 
- Length and width are most relevant for jewelry settings
- Depth is less commonly used as a filter criterion
- Simplifies UI (2 ranges instead of 3)

### Decision 5: Search Page Filter Implementation

**Chosen**: Share filter components with catalog

**Approach**:
- Use same `FilterSidebar` component
- Share `AdvancedGemstoneFilters` type
- Share URL parameter encoding
- Search adds text query on top of filters

**Rationale**: Consistency and code reuse. Users expect same filtering on both pages.

## Risks and Mitigations

### Risk 1: Performance Degradation

**Mitigation**:
- Add database indexes for new filterable fields
- Use efficient aggregation queries for filter counts
- Consider caching for rarely-changing filter options
- Benchmark before/after each phase

### Risk 2: Empty Filter Results

**Mitigation**:
- Show filter counts (already implemented)
- Disable options with 0 count
- Show "no results" message with filter summary
- Provide "clear filters" action

### Risk 3: Data Quality Issues

**Mitigation**:
- Many new fields may be empty initially
- Show "Unknown" option for empty values
- Don't hide gemstones with missing data
- Admin can backfill data over time

### Risk 4: Mobile UX Complexity

**Mitigation**:
- Group professional filters in collapsible section
- Use bottom sheet on mobile (already implemented)
- Prioritize most-used filters at top
- Test on various screen sizes

## Success Criteria

1. **Filter Coverage**: All 17+ filter types available on catalog page
2. **Search Parity**: Search page has same filter capabilities as catalog
3. **Professional Support**: Treatment, mining country, quality filters work correctly
4. **Performance**: Page load time within 10% of current baseline
5. **Localization**: All new filters have EN/RU translations
6. **Mobile**: All filters usable on mobile devices
7. **Data Quality**: Filters handle missing/empty data gracefully
8. **UX Excellence**: Filter experience feels premium and delightful
9. **Visual Polish**: All interactions have smooth animations and feedback
10. **Accessibility**: Full keyboard navigation and screen reader support

## Out of Scope

- Admin UI for managing filter options (use Supabase dashboard)
- Saved filter presets / saved searches (future feature)
- Filter analytics / popular filters dashboard (future feature)
- AI-powered filter suggestions (future feature)
- Geolocation-based origin filtering (future feature)

## Deferred and Optional Enhancements

### Enhancement: Saved Filter Presets

**Status**: Deferred, optional

**Potential improvements**:
- Users can save filter combinations
- Quick-apply saved filters
- Share filter presets via URL

**When to consider**: After core filter implementation is stable

### Enhancement: Smart Filter Suggestions

**Status**: Deferred, optional

**Potential improvements**:
- AI suggests relevant filters based on search query
- "Similar to" filter based on viewed gemstone
- Popular filter combinations

**When to consider**: After usage data is collected

---

## Template Usage Notes

This vision document is for the Crystallique gemstone platform filter/search overhaul. All implementation work must be derived from explicit contracts in `01_contracts.md`.

**Remember**: Agents must not execute from this document. All work comes from contracts.

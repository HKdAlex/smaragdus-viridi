<!-- 65b482c4-db83-47bd-93a8-957a046209c9 2b0928c2-a9f4-4d52-a6d4-4635a3c8dbc7 -->
# Advanced Filters Sidebar Refactoring

## Summary

Transform the current inline advanced filters into a beautiful, fully-localized right sidebar that can toggle between visual and standard filter modes. On mobile, display as a bottom sheet. All filter components and subcomponents will be fully localized.

## Component Architecture

### New Components to Create

1. **Sheet Component** (`src/shared/components/ui/sheet.tsx`)

   - Shadcn-style base sheet/drawer component
   - Supports right sidebar and bottom positions
   - Includes backdrop, close button, animations
   - Accessibility-compliant (ARIA roles, keyboard navigation)

2. **FilterSidebar Component** (`src/features/gemstones/components/filters/filter-sidebar.tsx`)

   - Main wrapper for filter UI
   - Manages sidebar open/closed state
   - Handles visual/standard mode toggle
   - Desktop: Right sidebar (400px width)
   - Mobile: Bottom sheet (90vh height)
   - Persists user preference in localStorage

3. **Localized Subcomponents**

   - Update `CutShapeSelector`, `ColorPicker`, `ClaritySelector` for i18n
   - Update `PriceRangeCards`, `WeightRangeCards`, `ToggleCards` for i18n
   - Ensure `filter-dropdown.tsx` is fully localized

### Files to Modify

1. **`src/features/gemstones/components/gemstone-catalog-optimized.tsx`**

   - Remove inline filter rendering
   - Add FilterSidebar component
   - Add filter toggle button for mobile
   - Pass filter state and handlers to sidebar

2. **`src/features/gemstones/components/filters/advanced-filters-v2-controlled.tsx`**

   - Extract visual filter subcomponents to separate files
   - Add localization keys throughout

3. **`src/features/gemstones/components/filters/advanced-filters-controlled.tsx`**

   - Verify all strings use translation keys
   - Update layout for sidebar context

## Localization Strategy

### New Translation Keys Needed

Add to `src/messages/en/filters.json` and `src/messages/ru/filters.json`:

```json
{
  "sidebar": {
    "openFilters": "Open Filters",
    "closeFilters": "Close Filters", 
    "filtersSidebar": "Filters",
    "visualMode": "Visual Mode",
    "standardMode": "Standard Mode",
    "modeToggleLabel": "Filter Mode"
  },
  "visual": {
    "cutShape": "Cut Shape",
    "coloredGemstones": "Colored Gemstones",
    "diamondColorGrades": "Diamond Color Grades",
    "clarityGrade": "Clarity Grade",
    "priceRange": "Price Range",
    "caratWeight": "Carat Weight",
    "quickFilters": "Quick Filters",
    "inStockOnly": "In Stock Only",
    "certified": "Certified",
    "withImages": "With Images",
    "availableNow": "Available now",
    "withCertificate": "With certificate",
    "photosAvailable": "Photos available"
  },
  "priceRanges": {
    "under100": "Under $100",
    "100to500": "$100 - $500",
    "500to1000": "$500 - $1,000",
    "1000to5000": "$1,000 - $5,000",
    "5000to10000": "$5,000 - $10,000",
    "over10000": "Over $10,000"
  },
  "weightRanges": {
    "under1": "Under 1ct",
    "1to2": "1-2ct",
    "2to3": "2-3ct",
    "3to5": "3-5ct",
    "5to10": "5-10ct",
    "over10": "Over 10ct"
  },
  "clarityDescriptions": {
    "FL": "Flawless",
    "IF": "Internally Flawless",
    "VVS1": "Very Very Slightly Included",
    "VVS2": "Very Very Slightly Included",
    "VS1": "Very Slightly Included",
    "VS2": "Very Slightly Included",
    "SI1": "Slightly Included",
    "SI2": "Slightly Included",
    "I1": "Included"
  }
}
```

## Visual Design Specifications

### Desktop Sidebar

- **Width:** 400px fixed
- **Position:** Fixed right, full height
- **Animation:** Slide in from right (300ms ease-out)
- **Backdrop:** Semi-transparent overlay when open
- **Shadow:** `shadow-2xl` for depth
- **Default State:** Open (can be toggled)

### Mobile Bottom Sheet

- **Height:** 90vh
- **Position:** Fixed bottom
- **Animation:** Slide up from bottom (300ms ease-out)
- **Backdrop:** Semi-transparent overlay
- **Drag Handle:** Visual indicator at top
- **Default State:** Closed (user opens via button)

### Header Section

- Mode toggle (Visual/Standard) as segmented control
- Active filter count badge
- Close button (X)
- Clear all filters button (when filters active)

### Content Section

- Scrollable filter area
- Consistent padding and spacing
- Smooth transitions between modes
- Loading states for filter options

## State Management

### FilterSidebar State

```typescript
interface FilterSidebarState {
  isOpen: boolean;
  mode: 'visual' | 'standard';
  isMobile: boolean;
}
```

### localStorage Keys

- `filterSidebarOpen`: boolean
- `filterSidebarMode`: 'visual' | 'standard'

## Implementation Steps

### Phase 1: Foundation

1. Create feature branch `feature/filter-sidebar`
2. Create Sheet component with right/bottom variants
3. Add new translation keys (en + ru)
4. Create FilterSidebar wrapper component

### Phase 2: Component Updates

1. Extract visual filter subcomponents to separate files
2. Add useTranslations to each subcomponent
3. Replace hardcoded strings with translation keys
4. Update filter-dropdown for sidebar context

### Phase 3: Integration

1. Update gemstone-catalog-optimized.tsx
2. Add filter toggle button for mobile
3. Wire up sidebar state management
4. Test visual and standard modes

### Phase 4: Polish

1. Add animations and transitions
2. Implement localStorage persistence
3. Add keyboard shortcuts (Esc to close)
4. Responsive testing (mobile/tablet/desktop)
5. Accessibility testing (screen readers, keyboard nav)

### Phase 5: Testing & Cleanup

1. Test both languages (en/ru)
2. Test all filter interactions
3. Test mobile bottom sheet behavior
4. Remove old inline filter code
5. Update documentation

## Files Structure

```
src/
├── shared/components/ui/
│   └── sheet.tsx (NEW)
├── features/gemstones/components/
│   ├── gemstone-catalog-optimized.tsx (MODIFY)
│   └── filters/
│       ├── filter-sidebar.tsx (NEW)
│       ├── advanced-filters-controlled.tsx (MODIFY)
│       ├── advanced-filters-v2-controlled.tsx (MODIFY)
│       ├── visual/
│       │   ├── cut-shape-selector.tsx (NEW - extracted)
│       │   ├── color-picker.tsx (NEW - extracted)
│       │   ├── clarity-selector.tsx (NEW - extracted)
│       │   ├── price-range-cards.tsx (NEW - extracted)
│       │   ├── weight-range-cards.tsx (NEW - extracted)
│       │   └── toggle-cards.tsx (NEW - extracted)
│       └── filter-dropdown.tsx (MODIFY)
└── messages/
    ├── en/
    │   └── filters.json (MODIFY)
    └── ru/
        └── filters.json (MODIFY)
```

## Key Technical Decisions

1. **Component Extraction:** Visual filter components will be extracted to separate files for maintainability and reusability
2. **State Management:** Sidebar state managed locally with localStorage persistence, filter state passed from parent
3. **Responsive Strategy:** CSS media queries + useMediaQuery hook for mobile detection
4. **Animation Library:** Use Tailwind CSS transitions and transforms (no external library needed)
5. **Accessibility:** Full ARIA support, keyboard navigation, focus management

## Testing Strategy

- Test sidebar open/close on desktop and mobile
- Test mode switching (visual ↔ standard)
- Test filter interactions in both modes
- Test localization switching (en ↔ ru)
- Test persistence across page reloads
- Test keyboard navigation and screen readers
- Test on various screen sizes

## Branch Strategy

- Branch name: `feature/filter-sidebar`
- Base: `master`
- Commit structure: Conventional commits
- PR title: "feat: Add advanced filters sidebar with full localization"

### To-dos

- [ ] Create feature branch 'feature/filter-sidebar' from master
- [ ] Create Sheet/Drawer UI component (sheet.tsx) with right sidebar and bottom sheet variants
- [ ] Add new translation keys to filters.json (en + ru) for sidebar and visual filters
- [ ] Extract visual filter subcomponents (CutShapeSelector, ColorPicker, etc) to separate files in visual/ directory
- [ ] Add useTranslations hook to all filter subcomponents and replace hardcoded strings
- [ ] Create FilterSidebar wrapper component with mode toggle, state management, and localStorage persistence
- [ ] Update gemstone-catalog-optimized.tsx to use FilterSidebar instead of inline filters
- [ ] Implement mobile-specific bottom sheet behavior with drag handle and proper animations
- [ ] Add keyboard shortcuts, ARIA roles, focus management, and screen reader support
- [ ] Test all functionality: sidebar behavior, mode switching, localization, mobile/desktop, accessibility
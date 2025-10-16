# Filter Sidebar Testing Guide

## Quick Start

1. **Start the development server**:

   ```bash
   npm run dev
   ```

2. **Navigate to the catalog page**:

   ```
   http://localhost:3000/en/catalog
   ```

3. **You should see the filter sidebar on the right** (desktop) or a floating button (mobile)

## Desktop Testing (≥768px width)

### Initial State

- ✅ Sidebar should be open by default on desktop
- ✅ Sidebar should be 400px wide
- ✅ Sidebar should show "Visual Mode" selected by default
- ✅ Backdrop overlay should be visible

### Sidebar Interaction

1. **Close Sidebar**

   - Click the X button in top-right
   - Press Esc key
   - Click on backdrop
   - ✅ Sidebar should slide out to the right
   - ✅ Backdrop should fade out

2. **Reopen Sidebar**

   - If sidebar was closed, it stays closed on refresh (localStorage)
   - No visible button to reopen on desktop (sidebar should stay open by default)

3. **Mode Toggle**
   - Click "Standard Mode" button
   - ✅ Filter UI should switch to dropdown-based filters
   - Click "Visual Mode" button
   - ✅ Filter UI should switch to visual card-based filters
   - ✅ Mode preference persists on page refresh

### Visual Filters Testing

1. **Search**

   - Type in search box
   - ✅ Results should update
   - ✅ Active filter count should increment

2. **Cut Shape Selector**

   - Click on Round, Oval, Marquise
   - ✅ Selected shapes should highlight with primary color
   - ✅ Check marks should appear on selected items
   - ✅ Results should filter accordingly

3. **Color Picker**

   - Click on colored gemstone options (red, blue, green, etc.)
   - ✅ Selected colors should highlight
   - ✅ Diamond grades (D, E, F, etc.) should work similarly

4. **Clarity Selector**

   - Click on clarity grades (FL, IF, VVS1, etc.)
   - ✅ Selected grades should highlight
   - ✅ Quality color bars should be visible

5. **Price Range Cards**

   - Click on different price ranges
   - ✅ Only one range should be selected at a time
   - ✅ Selected range should show green highlight and checkmark

6. **Weight Range Cards**

   - Click on different weight ranges
   - ✅ Only one range should be selected at a time
   - ✅ Selected range should show purple highlight and checkmark
   - ✅ Diamond icon should scale with range

7. **Toggle Cards**

   - Click "In Stock Only"
   - ✅ Should highlight green with checkmark
   - Click "Certified"
   - ✅ Should highlight yellow with checkmark
   - Click "With Images"
   - ✅ Should highlight blue with checkmark

8. **Reset Filters**
   - Apply several filters
   - ✅ "Reset All (N)" button should appear at top
   - Click "Reset All"
   - ✅ All filters should clear
   - ✅ Active filter count should be 0

### Standard Filters Testing

1. **Switch to Standard Mode**

   - Click "Standard Mode" button
   - ✅ Should see dropdown-based filters

2. **Test Dropdowns**

   - Open Type dropdown
   - ✅ Should show gemstone types with counts
   - Select multiple types
   - ✅ Should show "N selected"
   - ✅ Results should filter

3. **Range Sliders**
   - Adjust price range slider
   - ✅ Results should update
   - Adjust weight range slider
   - ✅ Results should update

## Mobile Testing (<768px width)

### Initial State

- ✅ Sidebar should be closed by default on mobile
- ✅ Floating action button (FAB) should be visible in bottom-right corner
- ✅ FAB should show "Filters" text and active filter count badge

### Bottom Sheet Interaction

1. **Open Bottom Sheet**

   - Click the FAB button
   - ✅ Bottom sheet should slide up from bottom
   - ✅ Should take up 90vh height
   - ✅ Should show drag handle at top
   - ✅ Backdrop should appear

2. **Close Bottom Sheet**

   - Click X button
   - Press Esc key
   - Click backdrop
   - ✅ Sheet should slide down
   - ✅ FAB should reappear

3. **Mode Toggle (Mobile)**

   - Open bottom sheet
   - Toggle between Visual and Standard modes
   - ✅ Toggle should work same as desktop
   - ✅ Mode persists on reopen

4. **Scrolling**
   - Open bottom sheet
   - Scroll filter content
   - ✅ Should scroll smoothly within the sheet
   - ✅ Background page should not scroll

## Localization Testing

### English (en)

1. Navigate to: `http://localhost:3000/en/catalog`
2. ✅ All filter labels should be in English
3. ✅ Price ranges should show dollars
4. ✅ Weight ranges should show "ct" suffix

### Russian (ru)

1. Navigate to: `http://localhost:3000/ru/catalog`
2. ✅ All filter labels should be in Russian
3. ✅ Cut shape names should be translated
4. ✅ Color names should be translated
5. ✅ Quick filter labels should be translated
6. ✅ Price/weight ranges should be translated

### Language Switching

1. Start on English catalog
2. Apply some filters
3. Switch language using language selector
4. ✅ Filters should persist
5. ✅ All UI text should update to new language

## Accessibility Testing

### Keyboard Navigation

1. **Tab Navigation**

   - Press Tab repeatedly
   - ✅ Focus should move through all interactive elements
   - ✅ Focus indicators should be visible
   - ✅ Filter buttons should be keyboard accessible

2. **Esc Key**
   - Open sidebar/sheet
   - Press Esc
   - ✅ Sidebar should close
   - ✅ Focus should return to appropriate element

### Screen Reader Testing

1. **VoiceOver (macOS)**

   - Enable VoiceOver (Cmd+F5)
   - Navigate to catalog
   - ✅ Sidebar should announce as "dialog"
   - ✅ Close button should announce correctly
   - ✅ Filter options should be readable

2. **NVDA (Windows)**
   - Enable NVDA
   - Test similar to VoiceOver
   - ✅ All interactive elements should be announced

### Focus Management

1. **Open Sidebar**
   - ✅ Focus should move to first focusable element in sidebar
2. **Close Sidebar**
   - ✅ Focus should return to triggering element (or appropriate fallback)

## localStorage Persistence Testing

1. **Open State**

   - Close sidebar on desktop
   - Refresh page
   - ✅ Sidebar should stay closed

2. **Filter Mode**

   - Switch to Standard mode
   - Refresh page
   - ✅ Should stay in Standard mode

3. **Clear Storage**
   - Open browser DevTools
   - Clear localStorage for the site
   - Refresh page
   - ✅ Should return to default state (open on desktop, visual mode)

## URL Synchronization Testing

1. **Apply Filters**

   - Select cut: round
   - Select color: blue
   - ✅ URL should update with query parameters

2. **Share URL**

   - Copy URL with filters
   - Open in new tab
   - ✅ Filters should be pre-applied

3. **Browser Navigation**
   - Apply filters
   - Click a gemstone
   - Click back button
   - ✅ Filters should be restored

## Cross-Browser Testing

### Chrome/Chromium

- ✅ All features work
- ✅ Animations are smooth

### Firefox

- ✅ All features work
- ✅ Backdrop blur works correctly

### Safari

- ✅ All features work
- ✅ iOS Safari mobile testing

### Edge

- ✅ All features work

## Performance Testing

1. **Open/Close Speed**

   - ✅ Sidebar should animate smoothly (300ms)
   - ✅ No janky animations

2. **Filter Application**

   - Apply multiple filters quickly
   - ✅ Should debounce properly
   - ✅ No excessive API calls

3. **Large Filter Lists**
   - ✅ Scrolling should be smooth
   - ✅ No lag when selecting items

## Responsive Breakpoints

Test at these widths:

- **320px** (small mobile) - ✅ Bottom sheet works
- **375px** (iPhone SE) - ✅ Bottom sheet works
- **768px** (tablet) - ✅ Switches from bottom sheet to sidebar
- **1024px** (desktop) - ✅ Sidebar works perfectly
- **1920px** (large desktop) - ✅ Sidebar maintains 400px width

## Known Issues & Limitations

1. **Pre-existing Build Error**

   - `3d-visualizer-demo/page.tsx` has TypeScript errors
   - Unrelated to filter sidebar work
   - Does not affect runtime functionality

2. **ESLint Configuration**
   - Some deprecated options in ESLint config
   - Does not affect code quality
   - Should be addressed separately

## Bug Reporting

If you find any issues, please report with:

- Browser and version
- Device type (desktop/mobile/tablet)
- Screen width
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## Success Criteria

All tests should pass with ✅ checkmarks. The filter sidebar should:

- Work flawlessly on desktop and mobile
- Be fully localized in English and Russian
- Be fully accessible (keyboard + screen reader)
- Persist user preferences
- Integrate seamlessly with existing catalog
- Provide smooth, delightful user experience


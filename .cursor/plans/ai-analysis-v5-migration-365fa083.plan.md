<!-- 365fa083-fcd9-4f8e-81d4-9e137ae96e23 5d84629f-596f-4457-9c65-201a76698aba -->
# AI Color Detection & Image Quality Enhancement

## Overview
Add AI-powered color detection to cross-validate gemstone metadata, create a comprehensive colors reference table, add AI-specific color fields that override manual metadata, and improve primary image selection quality standards.

## Database Schema Changes

### 1. Create Colors Reference Table
**File:** `migrations/20251016_create_colors_table.sql`

Create a `colors` table with standard gemstone colors and multilingual translations:
- Primary colors: red, pink, orange, yellow, green, blue, purple, brown, black, white, gray, colorless, multi-color
- Include `color_code` (e.g., "brown"), `hex_value` (optional), `sort_order`
- Create `color_translations` table for EN/RU names
- Seed with standard gemstone colors

### 2. Add AI Color Fields to Gemstones Table
**File:** `migrations/20251016_add_ai_color_fields.sql`

Add AI-specific color fields to `gemstones` table (separate from manual metadata):
```sql
ALTER TABLE gemstones
ADD COLUMN ai_color TEXT,
ADD COLUMN ai_color_code TEXT,
ADD COLUMN ai_color_description TEXT;

CREATE INDEX idx_gemstones_ai_color ON gemstones(ai_color);
CREATE INDEX idx_gemstones_color ON gemstones(color);

COMMENT ON COLUMN gemstones.ai_color IS 'AI-detected primary color (overrides color field if present)';
COMMENT ON COLUMN gemstones.ai_color_code IS 'AI-detected color code (overrides color_code if present)';
COMMENT ON COLUMN gemstones.ai_color_description IS 'Detailed AI color description (e.g., smoky brown, light pink)';
```

**Rendering priority:** UI will use `ai_color` if present, fallback to `color` if not

### 3. Update AI v6 Table
**File:** `migrations/20251016_add_color_detection.sql`

Add color detection fields to `gemstones_ai_v6`:
```sql
detected_color TEXT -- Primary color detected by AI
color_detection_confidence NUMERIC(3,2)
color_matches_metadata BOOLEAN
color_detection_reasoning TEXT
detected_color_description TEXT -- Detailed description from AI
```

## AI Image Analysis Enhancement

### 4. Add Color Detection Function
**File:** `scripts/ai-analysis-v6/image-analyzer.mjs`

Add `detectGemstoneColor()` function similar to `detectGemstoneCut()`:
- Use GPT-4o-mini Vision to analyze images (cost-effective, same as current cut detection)
- Detect primary color from standard list
- Generate detailed color description
- Compare with metadata and flag mismatches
- Return confidence score and reasoning

Schema:
```javascript
{
  detected_color: "brown",
  confidence: 0.92,
  color_description: "smoky brown with amber undertones",
  matches_metadata: false,
  metadata_color: "colorless",
  reasoning: "The gemstones show clear brown coloration..."
}
```

### 5. Improve Primary Image Selection
**File:** `scripts/ai-analysis-v6/image-analyzer.mjs`

Update `selectPrimaryImage()` scoring criteria:
- **Strict tool rejection**: Images with scales, calipers, or measurement tools get maximum -0.4 penalty (up from -0.2)
- **Quality threshold**: Flag images with score < 0.7 as `needs_better_photo`
- Prefer clean shots even if lighting is slightly worse
- Update system prompt to emphasize tool-free images

### 6. Integrate Color Detection into Pipeline
**File:** `scripts/ai-analysis-v6/pipeline.mjs`

In `processGemstoneV6()`:
- Call `detectGemstoneColor()` after cut detection
- Store results in `imageAnalysis.colorDetection`
- Pass detected color to text generator
- Update `gemstones` table with AI color fields after successful generation
- Save to database with other AI analysis results

### 7. Update Database Operations
**File:** `scripts/ai-analysis-v6/database.mjs`

Update `saveTextGeneration()`:
- Save color detection fields to `gemstones_ai_v6`
- Update `shouldFlagForReview()` to flag color mismatches
- Flag if `color_matches_metadata === false`
- Flag if confidence < 0.6

Add new function `updateGemstoneAIColor()`:
```javascript
export async function updateGemstoneAIColor(gemstoneId, colorData) {
  const { error } = await supabase
    .from('gemstones')
    .update({
      ai_color: colorData.detected_color,
      ai_color_code: colorData.detected_color,
      ai_color_description: colorData.color_description,
    })
    .eq('id', gemstoneId);
  
  if (error) throw new Error(`Failed to update AI color: ${error.message}`);
}
```

## Data Migration & Seeding

### 8. Seed Colors Table
**File:** `scripts/seed-colors.mjs`

Create script to populate colors table:
- Insert standard colors with EN/RU translations
- Brown: { en: "Brown", ru: "Коричневый" }
- Smoky: { en: "Smoky", ru: "Дымчатый" }
- Include hex values for UI display

### 9. Update TypeScript Types
**File:** `src/shared/types/database.ts`

Regenerate types after migrations:
```bash
npx supabase gen types typescript --project-id dpqapyojcdtrjwuhybky > src/shared/types/database.ts
```

## UI Updates

### 10. Display AI-Detected Color
**File:** `src/features/gemstones/components/gemstone-detail.tsx`

Update color display to prioritize AI-detected color:
- Use `gemstone.ai_color || gemstone.color` for primary color
- Use `gemstone.ai_color_description` if available as tooltip/subtitle
- Similar pattern to cut display fix
- Show both AI and manual values in admin/debug view if they differ

Example:
```typescript
const displayColor = gemstone.ai_color || gemstone.color;
const colorDescription = gemstone.ai_color_description;
```

### 11. Update Color Translation Utility
**File:** `src/features/gemstones/utils/gemstone-translations.tsx`

Update `translateColor()` to handle AI colors:
- Look up `ai_color` or `color` in colors translations table
- Fall back to displaying raw value if translation not found

### 12. Admin Review Interface
**File:** (future enhancement, note in docs)

Document that admin can review flagged color mismatches in `gemstones_ai_v6` table where `color_matches_metadata = false`

## Testing

### 13. Test Color Detection
Run pipeline on test gemstone:
```bash
node -r dotenv/config scripts/test-single-gem.mjs 11b90b26-b4c0-406f-b614-0332779ebded dotenv_config_path=.env.local
```

Expected results:
- Detect "brown" color
- Flag mismatch with "colorless" metadata
- Generate description "smoky brown"
- Update `gemstones.ai_color` = 'brown'
- Update `gemstones.ai_color_description` = 'smoky brown'
- Manual `gemstones.color` = 'colorless' remains unchanged
- UI displays "brown" (from AI)
- Improved image quality score with stricter tool penalty

## Documentation

### 14. Update AI Pipeline Docs
**File:** `docs/ai-image-analysis-v6.md`

Add color detection section:
- How it works
- Schema details
- Quality thresholds
- Review workflow
- AI vs manual metadata priority explanation

## File Summary

**New files:**
- `migrations/20251016_create_colors_table.sql`
- `migrations/20251016_add_ai_color_fields.sql`
- `migrations/20251016_add_color_detection.sql`
- `scripts/seed-colors.mjs`

**Modified files:**
- `scripts/ai-analysis-v6/image-analyzer.mjs` (add color detection, stricter image scoring)
- `scripts/ai-analysis-v6/pipeline.mjs` (integrate color detection, update gemstones AI fields)
- `scripts/ai-analysis-v6/database.mjs` (save color fields, flag mismatches, update gemstones)
- `src/features/gemstones/components/gemstone-detail.tsx` (display AI color with fallback)
- `src/features/gemstones/utils/gemstone-translations.tsx` (handle AI colors)
- `src/shared/types/database.ts` (regenerated)

## Success Criteria

- Colors reference table created with EN/RU translations
- AI color fields added to gemstones table (separate from manual)
- AI detects primary color + detailed description
- Color mismatches automatically flagged for review
- AI color values automatically update gemstones table
- UI prioritizes AI color over manual (with fallback)
- Image scoring strictly penalizes measurement tools
- Test gemstone: AI detects brown, manual stays colorless, UI shows brown
- All migrations applied via Supabase MCP
- Full test passes with improved image quality scores

### To-dos

- [ ] Create colors reference table with translations (EN/RU)
- [ ] Add ai_color, ai_color_code, ai_color_description to gemstones table
- [ ] Add color detection fields to gemstones_ai_v6 table
- [ ] Implement detectGemstoneColor() in image-analyzer.mjs
- [ ] Update selectPrimaryImage() with stricter tool penalties
- [ ] Integrate color detection into pipeline.mjs and update gemstones AI fields
- [ ] Update database.mjs to save color detection and add updateGemstoneAIColor()
- [ ] Create and run seed-colors.mjs script
- [ ] Regenerate TypeScript types from updated schema
- [ ] Update UI to prioritize AI color with fallback to manual
- [ ] Update translateColor() utility to handle AI colors
- [ ] Run full test and verify AI color updates gemstones table
- [ ] Update AI pipeline documentation with color detection
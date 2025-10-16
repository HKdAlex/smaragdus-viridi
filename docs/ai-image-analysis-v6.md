# AI Image Analysis for Gemstone v6 Pipeline

## Overview

Added AI-powered image analysis capabilities to the v6 text generation pipeline to improve data accuracy and user experience through:

1. **Cut Detection with Metadata Validation** - Uses GPT-4 Vision to detect gemstone cut from images and cross-validates against database metadata
2. **AI-Powered Primary Image Selection** - Automatically selects the best product image based on quality, composition, clarity, and professional presentation

## Implementation Date

October 16, 2025

## Features

### 1. Cut Detection

**Purpose**: Cross-validate metadata cut field against actual gemstone appearance in images to catch data entry errors.

**How it works**:

- Uses GPT-4o (latest vision model) to analyze up to 3 gemstone images
- Detects cut type (round, princess, emerald, cushion, oval, etc.)
- Provides confidence score (0-1)
- Compares detected cut with metadata
- Flags mismatches automatically
- Provides detailed reasoning for detection

**Output**:

```javascript
{
  detected_cut: "emerald",
  confidence: 0.95,
  reasoning: "The gemstone appears to be rectangular with cut corners, typical of an emerald cut...",
  matches_metadata: false, // Metadata said "round"
  metadata_cut: "round",
  images_analyzed: 3,
  model: "gpt-4o"
}
```

**Example from Testing**:

```
🔍 Performing AI image analysis...
  • Detecting cut type...
    Detected: emerald (confidence: 0.95)
    ⚠️ MISMATCH: Metadata says "round" but detected "emerald"
    Reasoning: The gemstone appears to be rectangular with cut corners, typical of an emerald cut.
    The faceting pattern and the elongated rectangular shape with step cuts along the sides further
    support this identification.
```

### 2. Color Detection

**Purpose**: Cross-validate metadata color field against actual gemstone appearance in images to catch data entry errors.

**How it works**:

- Uses GPT-4o-mini (cost-effective vision model) to analyze up to 10 gemstone images
- Detects primary color from standard gemstone colors (red, pink, orange, yellow, green, blue, purple, brown, black, white, gray, colorless, smoky, amber, violet, teal, coral, peach, mint, multi-color)
- Provides confidence score (0-1)
- Compares detected color with metadata
- Flags mismatches automatically
- Provides detailed color description and reasoning

**Output**:

```javascript
{
  detected_color: "brown",
  confidence: 0.95,
  color_description: "smoky brown with deep amber undertones",
  matches_metadata: false, // Metadata said "colorless"
  metadata_color: "colorless",
  reasoning: "The gemstone exhibits a distinct smoky brown coloration...",
  images_analyzed: 10,
  model: "gpt-4o-mini"
}
```

**Example from Testing**:

```
  • Detecting color...
    Detected: brown (confidence: 0.95)
    Description: smoky brown with deep amber undertones, displaying noticeable color saturation and intensity
    ⚠️ MISMATCH: Metadata says "colorless" but detected "brown"
    Reasoning: The gemstone exhibits a distinct smoky brown coloration, which is clearly visible and dominates the appearance. This does not align with the 'colorless' metadata provided.
```

### 3. Primary Image Selection

**Purpose**: Automatically select the best product image for e-commerce display based on professional photography standards.

**Evaluation Criteria**:

1. **Visual Quality** (0-1): Resolution, lighting, color accuracy
2. **Composition** (0-1): Framing, background, angle, positioning
3. **Clarity** (0-1): Focus, sharpness, detail visibility
4. **Professional Presentation** (0-1): Product photography standards, appeal

**Output**:

```javascript
{
  selected_index: 4, // Index of best image (0-based)
  reasoning: "Image 4 is the best choice because it highlights the gemstone itself without distractions...",
  image_scores: [
    {
      index: 0,
      quality_score: 0.75,
      composition_score: 0.70,
      clarity_score: 0.80,
      professional_score: 0.72,
      overall_score: 0.74,
      issues: ["Background slightly cluttered", "Lighting uneven"]
    },
    // ... scores for each image
  ],
  images_analyzed: 5,
  model: "gpt-4o"
}
```

**Example from Testing**:

```
  • Selecting best primary image...
    Selected image 4 (score: 0.88)
    Reasoning: Image 4 is the best choice for the primary product image because it highlights the
    gemstone itself without any distractions. The gemstone is in focus, allowing the viewer to see
    the details of the cut and facets clearly. The lighting is adequate and shows off the color and
    clarity of the quartz effectively. The background is clean and simple, which keeps the focus on
    the gemstone, making it suitable for an e-commerce listing.
```

## Database Schema

Added new columns to `gemstones_ai_v6` table:

```sql
-- Cut detection fields
detected_cut TEXT,
cut_detection_confidence NUMERIC(3,2) CHECK (cut_detection_confidence >= 0 AND cut_detection_confidence <= 1),
cut_matches_metadata BOOLEAN,
cut_detection_reasoning TEXT,

-- Color detection fields
detected_color TEXT,
color_detection_confidence NUMERIC(3,2) CHECK (color_detection_confidence >= 0 AND color_detection_confidence <= 1),
color_matches_metadata BOOLEAN,
color_detection_reasoning TEXT,
detected_color_description TEXT,

-- Primary image selection fields
recommended_primary_image_index INTEGER,
primary_image_selection_reasoning TEXT,
image_quality_scores JSONB,

-- Indexes for finding problematic gems
CREATE INDEX idx_gemstones_ai_v6_cut_mismatch
  ON gemstones_ai_v6(cut_matches_metadata)
  WHERE cut_matches_metadata = false;

CREATE INDEX idx_gemstones_ai_v6_color_mismatch
  ON gemstones_ai_v6(color_matches_metadata)
  WHERE color_matches_metadata = false;

CREATE INDEX idx_gemstones_ai_v6_color_confidence
  ON gemstones_ai_v6(color_detection_confidence)
  WHERE color_detection_confidence < 0.6;
```

## Automatic Review Flagging

Gemstones are automatically flagged for review (`needs_review = true`) if:

1. ✅ **Cut mismatch detected** - AI-detected cut doesn't match metadata
2. ✅ **Low cut detection confidence** - Confidence < 0.6
3. ✅ **Color mismatch detected** - AI-detected color doesn't match metadata
4. ✅ **Low color detection confidence** - Confidence < 0.6
5. ✅ Low text generation confidence - Confidence < 0.7
6. ✅ Long generation time - > 30 seconds
7. ✅ Missing required fields
8. ✅ Placeholder text patterns detected

## Files Created/Modified

### New Files

- `scripts/ai-analysis-v6/image-analyzer.mjs` - Core image analysis logic
- `migrations/20251016_add_ai_image_analysis.sql` - Database schema update
- `docs/ai-image-analysis-v6.md` - This documentation

### Modified Files

- `scripts/ai-analysis-v6/pipeline.mjs` - Integrated image analysis into pipeline
- `scripts/ai-analysis-v6/database.mjs` - Added image analysis fields to database operations
- `scripts/ai-analysis-v6/text-generator.mjs` - Fixed `max_tokens` → `max_completion_tokens` for GPT-5 compatibility
- `scripts/ai-analysis-v6/config.mjs` - Added `TIMEOUT_MS.IMAGE_ANALYSIS` timeout

## Pipeline Flow

```
1. Fetch gemstone metadata from database
   ↓
2. Download images (up to 5)
   ↓
3. **[NEW]** Perform image analysis
   ├─ Detect cut type (uses up to 10 images)
   ├─ Detect color (uses up to 10 images)
   ├─ Validate against metadata
   ├─ Flag mismatches
   └─ Select best primary image (uses up to 10 images)
   ↓
4. Generate text content with AI
   ↓
5. Save to database
   ├─ Text content
   ├─ **[NEW]** Cut detection results
   ├─ **[NEW]** Color detection results
   ├─ **[NEW]** Primary image selection results
   ├─ **[NEW]** Update gemstones table with AI color
   └─ **[NEW]** Automatic review flagging
```

## Configuration

### Environment Variables

No additional environment variables required. Uses existing `OPENAI_API_KEY`.

### Model Selection

- **Cut Detection**: `gpt-4o-mini` (cost-effective vision model)
- **Color Detection**: `gpt-4o-mini` (cost-effective vision model)
- **Primary Image Selection**: `gpt-4o-mini` (cost-effective vision model)
- **Text Generation**: `gpt-4o-mini` (configurable via `V6_TEXT_MODEL` env var)

### Timeouts

```javascript
TIMEOUT_MS: {
  IMAGE_ANALYSIS: 30000, // 30 seconds for image analysis
  TEXT_GENERATION: 60000, // 60 seconds for text generation
  IMAGE_DOWNLOAD: 10000   // 10 seconds per image download
}
```

## Usage

### In Pipeline

Image analysis runs automatically when:

- Images are available for the gemstone
- `forceNoImages` option is not set to `true`

```javascript
// Automatic - runs in pipeline
const result = await generateTextForGemstone(gemstoneId);
console.log(result.imageAnalysis);
// {
//   cut_detected: "emerald",
//   cut_matches: false,
//   primary_image_index: 4
// }
```

### Standalone

```javascript
import {
  detectGemstoneCut,
  selectPrimaryImage,
} from "./scripts/ai-analysis-v6/image-analyzer.mjs";

// Detect cut
const cutDetection = await detectGemstoneCut({
  imageUrls: ["https://...", "https://..."],
  metadataCut: "round",
});

// Select primary image
const primarySelection = await selectPrimaryImage({
  imageUrls: ["https://...", "https://...", "https://..."],
  gemstoneInfo: {
    weight_carats: 14.29,
    color: "Colorless",
    name: "Quartz",
    cut: "round",
  },
});
```

## Query Examples

### Find Gems with Cut Mismatches

```sql
SELECT
  g.id,
  g.serial_number,
  g.name,
  g.cut as metadata_cut,
  v6.detected_cut,
  v6.cut_detection_confidence,
  v6.cut_detection_reasoning
FROM gemstones g
JOIN gemstones_ai_v6 v6 ON g.id = v6.gemstone_id
WHERE v6.cut_matches_metadata = false
ORDER BY v6.cut_detection_confidence DESC;
```

### Find Gems Needing Manual Review

```sql
SELECT
  g.id,
  g.serial_number,
  g.name,
  v6.needs_review,
  v6.cut_matches_metadata,
  v6.cut_detection_confidence,
  v6.confidence_score as text_confidence
FROM gemstones g
JOIN gemstones_ai_v6 v6 ON g.id = v6.gemstone_id
WHERE v6.needs_review = true
ORDER BY g.created_at DESC;
```

### View Primary Image Recommendations

```sql
SELECT
  g.id,
  g.serial_number,
  v6.recommended_primary_image_index,
  v6.primary_image_selection_reasoning,
  v6.image_quality_scores
FROM gemstones g
JOIN gemstones_ai_v6 v6 ON g.id = v6.gemstone_id
WHERE v6.recommended_primary_image_index IS NOT NULL;
```

## Testing

Tested on gemstone `11b90b26-b4c0-406f-b614-0332779ebded`:

- ✅ Cut detection successfully identified "emerald" cut (0.95 confidence)
- ✅ Correctly flagged mismatch with metadata ("round")
- ✅ Primary image selection chose image 4 (0.88 overall score)
- ✅ Automatic review flagging activated

## Benefits

1. **Data Quality Assurance**

   - Automatically catch metadata errors
   - Cross-validate cut types against actual images
   - Flag low-confidence detections for manual review

2. **Improved User Experience**

   - Best images automatically selected for product listings
   - Consistent high-quality product photography
   - Professional e-commerce presentation

3. **Operational Efficiency**

   - Reduce manual image selection work
   - Identify data quality issues automatically
   - Prioritize gems needing review with `needs_review` flag

4. **Marketing Accuracy**
   - Prevent generating incorrect marketing content
   - Ensure technical specifications match reality
   - Build customer trust with accurate descriptions

## Future Enhancements

1. **Color Validation** - Detect gemstone color from images and validate against metadata
2. **Quality Assessment** - Automatically assess gemstone quality grade from images
3. **Defect Detection** - Identify visible inclusions or flaws
4. **Size Estimation** - Estimate physical dimensions from images
5. **Certification Validation** - Cross-validate certification details visible in images

## API Costs

**Per Gemstone** (with 5 images):

- Cut detection: ~$0.01-0.02 (GPT-4o vision, 3 images)
- Primary image selection: ~$0.02-0.03 (GPT-4o vision, 5 images)
- Text generation: ~$0.02-0.04 (GPT-5-mini)
- **Total: ~$0.05-0.09 per gemstone**

## Rollback

To remove image analysis features:

```sql
ALTER TABLE gemstones_ai_v6
  DROP COLUMN IF EXISTS detected_cut,
  DROP COLUMN IF EXISTS cut_detection_confidence,
  DROP COLUMN IF EXISTS cut_matches_metadata,
  DROP COLUMN IF EXISTS cut_detection_reasoning,
  DROP COLUMN IF EXISTS recommended_primary_image_index,
  DROP COLUMN IF EXISTS primary_image_selection_reasoning,
  DROP COLUMN IF EXISTS image_quality_scores;

DROP INDEX IF EXISTS idx_gemstones_ai_v6_cut_mismatch;
```

Then revert code changes to `pipeline.mjs`, `database.mjs`, and remove `image-analyzer.mjs`.

## Support

For issues or questions, contact the development team or refer to:

- `/docs/ai-text-generation-v6-rollback.md` - v6 system rollback
- `/scripts/ai-analysis-v6/README.md` - v6 pipeline documentation

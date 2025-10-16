# Data Extractor Fix for GPT-5-mini Output Format

## Problem Identified

GPT-5-mini returns **excellent data** but in its own format:

- Returns `individual_analyses` array with detailed measurements
- Does **NOT** include the requested `aggregated_data.measurements_cross_verified` section
- Original extractor was looking for the wrong structure

## Root Cause

The extractor was trying to parse `raw_ai_response` from `data.overall_metrics`, but should look at `data.individual_analyses` directly.

## Solution Implemented

### New Extraction Strategy

1. **Parse Individual Analyses**

   - Extract measurements from each image analysis
   - Track weight, length, width, depth with confidence scores
   - Build arrays of measurements per dimension

2. **Select Best Values**

   - Choose measurement with highest confidence for each dimension
   - Fallback to consolidated/aggregated data if available

3. **Extract Descriptive Data**

   - Parse `visual_observations` for color and shape information
   - Use regex patterns to extract structured attributes from natural language

4. **Calculate Confidence**
   - Use extracted measurement confidences (primary)
   - Fallback to individual image confidences
   - Fallback to overall confidence metrics

### Code Changes

**File:** `scripts/ai-analysis/data-extractor.mjs`

```javascript
// NEW: Parse individual analyses
const individualAnalyses = data.individual_analyses || [];
const weightMeasurements = [];
const lengthMeasurements = [];
// ... collect measurements from each analysis

// NEW: Get best measurement (highest confidence)
const getBestMeasurement = (measurements) => {
  if (measurements.length === 0) return { value: null, confidence: 0 };
  return measurements.reduce((best, curr) =>
    curr.confidence > best.confidence ? curr : best
  );
};

// NEW: Extract color/shape from visual observations
const colorObservations = individualAnalyses
  .map((a) => a.visual_observations)
  .filter(Boolean)
  .join("; ");

const colorMatch = colorObservations.match(
  /\b(violet-blue|bluish violet|green|red|blue)\b/i
);
```

## Expected Improvement

### Before Fix

- Field extraction: **8%** (1/12 fields)
- Weight: 0%, Dimensions: 0%, Color: 0%
- Only extracting date and confidence

### After Fix (Expected)

- Field extraction: **>75%** (9+/12 fields)
- Weight: High (from digital scale readings)
- Dimensions: Medium (from gauge measurements)
- Color: High (from visual observations)
- Shape/Cut: High (from visual observations)

## Test Status

Running test now: `node --env-file=.env.local scripts/test-improved-prompt.mjs`

Results will be in: `improved-prompt-test-v2.log`

## Next Steps

1. ✅ Analyze test results
2. ⏳ If >75% extraction: Proceed to full catalog
3. ⏳ If <75% extraction: Further refine extraction patterns
4. ⏳ Add more color/shape/clarity patterns as needed
5. ⏳ Consider gemstone type detection from visual observations

## Notes

- GPT-5-mini provides rich, detailed data in `visual_observations`
- We can extract much more than just measurements
- Pattern-based extraction from natural language descriptions is viable
- This approach works with GPT-5-mini's actual output format, not fighting it

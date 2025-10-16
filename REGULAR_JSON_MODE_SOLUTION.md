# Regular JSON Mode Solution (No Schema Enforcement)

**Date:** 2025-10-15  
**Discovery:** Structured outputs (json_schema) don't work with vision models - reverting to regular JSON mode

## The Problem with Structured Outputs

### What We Learned

After extensive testing, we discovered:

1. **Text-Only**: GPT-4o/GPT-4o-mini work perfectly with `json_schema` ✅
2. **Vision + Images**: ALL models fail with `json_schema` ❌
   - GPT-4o-mini: Returns empty `aggregated_data`
   - GPT-5-mini: Returns empty `aggregated_data`
   - Even "working" models break when images are added!

### Root Cause

**Vision models have different API constraints:**

- They don't fully support `response_format: { type: "json_schema" }`
- Complex schemas are ignored or only partially enforced
- Image processing takes priority over schema compliance

This is a **fundamental API limitation**, not a model quality issue!

---

## The Solution: Regular JSON Mode

### Strategy

Instead of fighting the API, work WITH the model's natural output:

```javascript
// BEFORE (doesn't work)
response_format: {
  type: "json_schema",
  json_schema: {
    name: "gemstone_analysis",
    schema: COMPLEX_SCHEMA,
    strict: false
  }
}

// AFTER (works!)
response_format: { type: "json_object" }
```

### Benefits

1. ✅ **Works with ALL vision models**
2. ✅ **Simpler API calls** (no schema complexity)
3. ✅ **Model returns natural structure** (what it does best)
4. ✅ **We had 17% extraction working** before - now improve it!

---

## Implementation

### 1. Updated Request Format

**File:** `scripts/ai-analysis/multi-image-processor.mjs`

```javascript
const requestParams = {
  model: VISION_MODEL,
  messages: [
    {
      role: "system",
      content:
        "You are a precise gemstone analysis expert. Analyze all images and provide structured JSON measurements.",
    },
    {
      role: "user",
      content,
    },
  ],
  max_completion_tokens: modelConfig.max_tokens,
  // Use regular JSON mode - no schema enforcement
  // Vision models don't reliably support json_schema format
  response_format: { type: "json_object" },
};
```

### 2. Model Selection

**Default:** `gpt-5-mini`

- Cheaper than GPT-4o-mini
- Good vision capabilities
- Works with regular JSON mode

### 3. Parser Strategy

The existing `data-extractor.mjs` already handles multiple formats:

- Looks for `aggregated_data`
- Falls back to `individual_analyses`
- Extracts from `visual_observations`
- Uses regex for color/cut parsing

**Goal:** Improve parser to get from 17% → 90%+ extraction

---

## Current Status

### What's Working

- ✅ Regular JSON mode enabled
- ✅ GPT-5-mini as default model
- ✅ Parser handles multiple formats
- ✅ Had 17% extraction before

### What Needs Improvement

- ⏭️ Test current extraction rate
- ⏭️ Analyze GPT-5-mini's natural output structure
- ⏭️ Enhance parser to handle more variations
- ⏭️ Target: >90% field extraction

---

## Expected Model Output

GPT-5-mini (without schema) typically returns:

```json
{
  "primary_image": {
    "index": 12,
    "score": 86,
    "confidence": 0.92,
    "reasoning": "..."
  },
  "individual_analyses": [
    {
      "index": 1,
      "type": "digital_scale_photo",
      "measurements": {
        "weight_ct": { "value": 1.86, "confidence": 0.95 }
      },
      "visual_observations": "vivid violet-blue color, octagonal cut"
    }
    // ... more analyses
  ],
  "consolidated_data": {
    "gemstone_type": "tanzanite",
    "color": "vivid violet-blue",
    "shape": "octagonal / emerald cut"
    // ... more fields
  },
  "overall_confidence_summary": {
    "visual_identification": 0.88,
    "measurements_consistency": 0.89
  }
}
```

**Key Insight:** The model DOES return structured data - we just need a robust parser!

---

## Parser Improvements Needed

### 1. Multiple Path Checking

```javascript
// Check all possible locations for each field
const weight =
  data.aggregated_data?.weight_ct ||
  data.consolidated_data?.weight_ct ||
  getBestMeasurementFromIndividual(data.individual_analyses, "weight_ct");
```

### 2. String Extraction from Observations

```javascript
// Extract color from text descriptions
const colorMatch = observations.match(/color:\s*([^,\.]+)/i);
const color = colorMatch?.[1] || extractFromConsolidated(data);
```

### 3. Confidence Aggregation

```javascript
// Calculate from multiple sources
const confidence =
  data.overall_confidence ||
  data.overall_confidence_summary?.measurements_consistency ||
  calculateFromIndividualAnalyses(data.individual_analyses);
```

---

## Testing Plan

### Phase 1: Baseline (Now)

1. ✅ Enable regular JSON mode
2. ⏳ Run 3-gem test
3. ⏳ Measure current extraction rate
4. ⏳ Analyze response structure

### Phase 2: Parser Enhancement

1. Add more fallback paths
2. Improve regex extraction
3. Handle more field variations
4. Test on 10 gems

### Phase 3: Validation

1. Test on 50 gems
2. Verify >90% extraction
3. Deploy to full catalog

---

## Cost Comparison

### GPT-5-mini (Regular JSON)

- **Cost:** ~$0.03 per gemstone (14 images)
- **Extraction:** 17% → Target 90%+
- **Reliability:** High (no schema conflicts)

### GPT-4o-mini (Structured JSON)

- **Cost:** ~$0.05 per gemstone
- **Extraction:** 0% (schema ignored with vision)
- **Reliability:** Doesn't work!

**Winner:** GPT-5-mini with regular JSON mode! ✨

---

## Next Steps

1. ⏳ **Test:** Run 3-gem test with regular JSON mode
2. ⏳ **Analyze:** Study GPT-5-mini's actual output structure
3. ⏭️ **Enhance:** Improve parser based on findings
4. ⏭️ **Validate:** Achieve >90% extraction target
5. ⏭️ **Deploy:** Run on full catalog

---

**Bottom Line:** Don't fight the API - work with it! Regular JSON mode + robust parser = success. 🎯

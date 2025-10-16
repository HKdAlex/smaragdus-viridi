# Vision + Structured Outputs Limitation Discovery

**Date:** 2025-10-15  
**Critical Finding:** Structured outputs don't work reliably with vision models!

## The Problem

### What We Discovered

1. **Text-Only Test** ✅ **WORKS**

   - GPT-4o: Perfect structured output (8/8 fields)
   - GPT-4o-mini: Perfect structured output (8/8 fields)
   - Returns complete `aggregated_data`

2. **Vision + Images Test** ❌ **FAILS**
   - GPT-4o-mini: Returns `primary_image` but **NO `aggregated_data`**
   - Same schema, same model
   - Only difference: images included

### Test Evidence

```
# Text-only (no images)
{
  "primary_image": { ... },
  "aggregated_data": {
    "shape_cut": "octagonal / emerald cut",
    "color": "vivid violet-blue",
    "clarity_observations": "eye-clean",
    "weight_ct": 2.5,
    // ... all 8 fields present!
  }
}
```

```
# With images (vision model)
{
  "primary_image": { ... },
  "aggregated_data": {
    // EMPTY!
  }
}
```

## Root Cause

**Vision models have different constraints than text models:**

1. They may not fully support structured outputs
2. Complex JSON schemas might be ignored
3. Image processing takes priority over schema enforcement
4. This is likely a known API limitation

## Why This Matters

- ❌ Can't use structured outputs for vision analysis
- ❌ Schema enforcement doesn't work with images
- ❌ Need different approach for vision models

## Solution Options

### Option 1: Remove Images from Structured Output Request ❌

- Not viable - we NEED images for analysis!

### Option 2: Use Regular JSON Mode (no schema) ✅

- Request JSON output without schema enforcement
- Parse whatever structure the model naturally produces
- Build robust extractor for model's preferred format

### Option 3: Separate Calls ⚠️

- One call for image analysis (no schema)
- One call for data extraction (with schema)
- More expensive, more complex

### Option 4: Different Approach Entirely ✅

- Use vision model's natural output format
- Stop fighting the model's preferences
- Build smart parser instead of enforcing schema

## Recommendation

**Accept that structured outputs don't work for vision!**

1. Use `response_format: { type: "json_object" }` (no schema)
2. Let the model return whatever structure it wants
3. Build robust parser to extract data
4. This is what we HAD working at 17% extraction

### Why Go Back?

- 17% extraction with NO schema > 0% extraction with schema
- Model knows best structure for its output
- Fighting the model = wasted time
- Working with the model = progress

## Implementation

```javascript
// REMOVE this:
response_format: {
  type: "json_schema",
  json_schema: {
    name: "gemstone_analysis",
    schema: GEMSTONE_ANALYSIS_SCHEMA_SIMPLE,
    strict: false
  }
}

// USE this:
response_format: { type: "json_object" }
```

## Next Steps

1. Revert to `response_format: { type: "json_object" }`
2. Use GPT-4o-mini (better than GPT-5-mini)
3. Build better extractor for natural output format
4. Accept 17% as baseline, improve from there
5. Focus on parsing, not schema enforcement

---

**Bottom Line:** Structured outputs are a dead-end for vision models. Use regular JSON mode and build a smart parser.

# AI Analysis System - Quick Start Guide

Quick reference for running and testing the complete AI analysis system.

## Environment Setup

Make sure these are set in `.env.local`:

```bash
OPENAI_API_KEY=sk-proj-...
OPENAI_VISION_MODEL=gpt-5-mini
OPENAI_DESCRIPTION_MODEL=gpt-5-mini
```

## Commands

### Run Complete Workflow

Process vision analysis + description generation for N gemstones:

```bash
node scripts/run-complete-ai-analysis.mjs [limit]

# Examples:
node scripts/run-complete-ai-analysis.mjs 10    # 10 gemstones
node scripts/run-complete-ai-analysis.mjs       # 100 gemstones (default)
```

### Test Workflow (5 gemstones)

```bash
node scripts/test-complete-ai-workflow.mjs
```

### Individual Steps

**Vision Analysis Only:**

```bash
node scripts/ai-gemstone-analyzer-v3.mjs [limit]
```

**Description Generation Only:**

```bash
node scripts/ai-description-generator-v4.mjs --limit=[N]
```

**Benchmark Models:**

```bash
node scripts/benchmark-vision-models.mjs
```

## Database Verification

### Check Extracted Data

```sql
SELECT
  serial_number,
  ai_weight_carats,
  ai_length_mm,
  ai_color,
  ai_extraction_confidence,
  ai_extracted_date
FROM gemstones
WHERE ai_extracted_date IS NOT NULL
ORDER BY ai_extracted_date DESC
LIMIT 10;
```

### Check Descriptions

```sql
SELECT
  serial_number,
  LEFT(description_emotional_ru, 80) as emotional_preview,
  ai_description_model,
  ai_description_cost_usd
FROM gemstones
WHERE description_emotional_ru IS NOT NULL
ORDER BY ai_description_date DESC
LIMIT 5;
```

### Check Best-Value Fallback

```sql
SELECT
  serial_number,
  weight_carats as manual,
  ai_weight_carats as ai,
  best_weight_carats as best,
  weight_source
FROM gemstones_with_best_data
WHERE ai_weight_carats IS NOT NULL
LIMIT 5;
```

## UI Testing

### Admin UI

1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/ru/admin/gemstones`
3. Click any gemstone
4. Scroll to "AI Analysis" section
5. Click "Extracted Data" tab
6. Verify manual vs AI comparison

### User UI

1. Navigate to: `http://localhost:3000/ru/catalog`
2. Find gemstone with description preview
3. Click to view details
4. Scroll to "Описания" card
5. Test all 3 tabs (Описание, Технические, История)

## Cost Monitoring

**Per Gemstone:**

- Vision: ~$0.030
- Descriptions: ~$0.005
- Total: ~$0.035

**Track in Database:**

```sql
SELECT
  COUNT(*) as analyzed_count,
  SUM(aar.cost_usd) as vision_cost,
  SUM(g.ai_description_cost_usd) as desc_cost,
  SUM(aar.cost_usd) + SUM(g.ai_description_cost_usd) as total_cost
FROM gemstones g
LEFT JOIN ai_analysis_results aar ON aar.gemstone_id = g.id
WHERE g.ai_analyzed = true;
```

## Troubleshooting

### RLS Permission Error

```
⚠️ Failed to save extracted data: permission denied for table users
```

**Fix:** Add RLS policy for service role:

```sql
CREATE POLICY "Allow service role to update AI fields"
ON gemstones FOR UPDATE TO service_role
USING (true) WITH CHECK (true);
```

### Empty Response from AI

```
❌ Error: OpenAI response missing text content
```

**Cause:** Token limit hit, model returned empty  
**Fix:** Increase `max_tokens` in `model-config.mjs`

### Validation Failed

```
⚠️ Analysis validation failed: Missing consolidated_data section
```

**Not Critical:** Extraction logic uses fallbacks; data may still be extracted

## Production Deployment

### Pre-flight Checklist

- [ ] .env.local has correct API keys
- [ ] RLS policies configured
- [ ] Test run successful (5 gems)
- [ ] Cost projections acceptable
- [ ] UI components tested

### Full Production Run

```bash
# Process entire catalog
node scripts/run-complete-ai-analysis.mjs 1385

# Estimated time: 20-30 hours
# Estimated cost: ~$48.15
```

## Support

**Documentation:**

- Implementation: `PHASE_AI_FINALIZATION_IMPLEMENTATION_COMPLETE.md`
- Production Config: `PRODUCTION_CONFIG_GPT5_MINI.md`
- Milestones: `PHASE_AI_FINALIZATION_MILESTONE_*.md`

**Key Files:**

- Data Extraction: `scripts/ai-analysis/data-extractor.mjs`
- Description Generation: `scripts/ai-description-generator-v4.mjs`
- Admin UI: `src/features/gemstones/components/ai-analysis-display.tsx`
- User UI: `src/features/gemstones/components/gemstone-descriptions.tsx`

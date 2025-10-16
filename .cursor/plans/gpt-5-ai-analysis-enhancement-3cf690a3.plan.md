<!-- 3cf690a3-ed1a-4fd4-8492-13d3b1102e8f a66fd637-cc70-48f4-b429-ccb5a66346eb -->
# AI Analysis System Finalization Plan

## Overview

Finalize AI analysis by: (1) extracting structured data from AI responses to dedicated fields, (2) generating 3 types of multilingual descriptions, (3) creating admin/user dual UI display.

## Phase 1: Database Schema Enhancement (30 min)

### 1.1 Create Data Extraction Migration

**File: `migrations/20251015_add_ai_extracted_fields.sql`**

Add AI-prefixed fields to gemstones table for extracted data:

```sql
-- Physical properties from AI
ALTER TABLE gemstones
ADD COLUMN IF NOT EXISTS ai_weight_carats NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS ai_length_mm NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS ai_width_mm NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS ai_depth_mm NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS ai_color TEXT,
ADD COLUMN IF NOT EXISTS ai_clarity TEXT,
ADD COLUMN IF NOT EXISTS ai_cut TEXT,
ADD COLUMN IF NOT EXISTS ai_origin TEXT,
ADD COLUMN IF NOT EXISTS ai_treatment TEXT,
ADD COLUMN IF NOT EXISTS ai_quality_grade TEXT,
ADD COLUMN IF NOT EXISTS ai_extracted_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_extraction_confidence NUMERIC(4,3);

-- Metadata
COMMENT ON COLUMN gemstones.ai_weight_carats IS 'AI-extracted weight in carats from image analysis';
COMMENT ON COLUMN gemstones.ai_extraction_confidence IS 'Confidence score for AI-extracted data (0-1)';

-- Create view for best-value fallback (manual > AI)
CREATE OR REPLACE VIEW gemstones_with_best_data AS
SELECT 
  g.*,
  COALESCE(g.weight_carats, g.ai_weight_carats) as best_weight_carats,
  COALESCE(g.length_mm, g.ai_length_mm) as best_length_mm,
  COALESCE(g.width_mm, g.ai_width_mm) as best_width_mm,
  COALESCE(g.depth_mm, g.ai_depth_mm) as best_depth_mm,
  COALESCE(g.color, g.ai_color) as best_color,
  COALESCE(g.clarity, g.ai_clarity) as best_clarity,
  COALESCE(g.cut, g.ai_cut) as best_cut,
  COALESCE(g.origin, g.ai_origin) as best_origin,
  CASE 
    WHEN g.weight_carats IS NOT NULL THEN 'manual'
    WHEN g.ai_weight_carats IS NOT NULL THEN 'ai'
    ELSE NULL
  END as weight_source
FROM gemstones g;
```

**Why:** Allows parallel manual/AI data without overwriting, enables quality comparison, provides fallback logic.

---

## Phase 2: Data Extraction Logic (1.5 hours)

### 2.1 Create Data Extractor Service

**File: `scripts/ai-analysis/data-extractor.mjs`**

Extract structured data from AI analysis JSON:

```javascript
/**
 * Extract gemstone properties from AI analysis result
 */
export function extractGemstoneData(consolidatedAnalysis) {
  const data = consolidatedAnalysis;
  
  // Extract physical measurements from consolidated data
  const measurements = data.consolidated_data?.measurement_summary || {};
  const gaugeReadings = data.consolidated_data?.all_gauge_readings || [];
  
  // Find most confident measurements
  const weightReading = gaugeReadings
    .filter(r => r.measurement_type === 'weight')
    .sort((a, b) => b.confidence - a.confidence)[0];
    
  const dimensionData = measurements.dimensions || {};
  
  return {
    ai_weight_carats: weightReading?.reading_value || null,
    ai_length_mm: dimensionData.length_mm || null,
    ai_width_mm: dimensionData.width_mm || null,
    ai_depth_mm: dimensionData.depth_mm || null,
    ai_color: data.consolidated_data?.color_assessment?.primary_color || null,
    ai_clarity: data.consolidated_data?.clarity_grade || null,
    ai_cut: data.consolidated_data?.cut_quality?.cut_type || null,
    ai_origin: data.consolidated_data?.lot_metadata?.origin || null,
    ai_treatment: data.consolidated_data?.treatment_assessment || null,
    ai_quality_grade: data.overall_metrics?.quality_grade || null,
    ai_extraction_confidence: data.overall_confidence || 0,
    ai_extracted_date: new Date().toISOString()
  };
}

/**
 * Validate extracted data doesn't overwrite better manual data
 */
export function shouldUpdateField(manualValue, aiValue, aiConfidence) {
  // Never overwrite manual data
  if (manualValue !== null && manualValue !== undefined) {
    return false;
  }
  
  // Only use AI data if confidence > 0.7
  return aiValue !== null && aiConfidence > 0.7;
}
```

### 2.2 Update Database Operations

**File: `scripts/ai-analysis/database-operations.mjs`**

After line 95 (after saving analysis result), add extraction:

```javascript
// Extract and save structured data to gemstone fields
const { extractGemstoneData, shouldUpdateField } = await import('./data-extractor.mjs');
const extractedData = extractGemstoneData(consolidatedAnalysis);

// Fetch current gemstone data
const { data: currentGemstone } = await supabase
  .from('gemstones')
  .select('weight_carats, length_mm, width_mm, depth_mm, color, clarity, cut, origin')
  .eq('id', gemstoneId)
  .single();

// Build update object (only fields that should be updated)
const updateFields = {};
Object.entries(extractedData).forEach(([key, value]) => {
  const manualField = key.replace('ai_', '');
  const manualValue = currentGemstone?.[manualField];
  
  if (shouldUpdateField(manualValue, value, extractedData.ai_extraction_confidence)) {
    updateFields[key] = value;
  }
});

if (Object.keys(updateFields).length > 0) {
  const { error: extractError } = await supabase
    .from('gemstones')
    .update(updateFields)
    .eq('id', gemstoneId);
    
  if (extractError) {
    console.warn(`⚠️ Failed to save extracted data: ${extractError.message}`);
  } else {
    console.log(`✅ Saved ${Object.keys(updateFields).length} extracted fields to gemstone`);
  }
}
```

---

## Phase 3: Description Generation Enhancement (2 hours)

### 3.1 Update Prompt with Extracted Data Context

**File: `scripts/ai-analysis/prompts-v4.mjs`** (already exists)

Ensure prompt receives extracted data from previous analysis:

```javascript
// Add helper function at end of file
export function buildDescriptionPrompt(gemstoneData, analysisData) {
  const context = {
    type: gemstoneData.name,
    weight_carats: gemstoneData.ai_weight_carats || gemstoneData.weight_carats,
    dimensions: {
      length: gemstoneData.ai_length_mm || gemstoneData.length_mm,
      width: gemstoneData.ai_width_mm || gemstoneData.width_mm,
      depth: gemstoneData.ai_depth_mm || gemstoneData.depth_mm
    },
    color: gemstoneData.ai_color || gemstoneData.color,
    cut: gemstoneData.ai_cut || gemstoneData.cut,
    clarity: gemstoneData.ai_clarity || gemstoneData.clarity,
    origin: gemstoneData.ai_origin || gemstoneData.origin,
    quality_grade: gemstoneData.ai_quality_grade,
    confidence: analysisData?.confidence_score || 0
  };
  
  return `${DESCRIPTION_GENERATION_PROMPT}\n\n**GEMSTONE DATA:**\n${JSON.stringify(context, null, 2)}`;
}
```

### 3.2 Update Description Generator

**File: `scripts/ai-description-generator-v4.mjs`** (already exists)

Modify to use extracted data (around line 455):

```javascript
async function generateDescriptions(gemstone, analysisData) {
  console.log(`\n📝 Generating descriptions for: ${gemstone.serial_number}`);
  
  // Use buildDescriptionPrompt helper
  const { buildDescriptionPrompt } = await import('./ai-analysis/prompts-v4.mjs');
  const prompt = buildDescriptionPrompt(gemstone, analysisData);
  
  // ... rest of function
}
```

Update main() to fetch with ai_analysis_results join:

```javascript
const { data: gemstones, error } = await supabase
  .from('gemstones')
  .select(`
    *,
    ai_analysis_results (
      extracted_data,
      confidence_score
    )
  `)
  .eq('ai_analyzed', true)
  .is('description_technical_ru', null)
  .limit(limit);
```

---

## Phase 4: Admin UI - Enhanced AI Analysis Display (2 hours)

### 4.1 Add Extracted Data Tab

**File: `src/features/gemstones/components/ai-analysis-display.tsx`**

After line 50, add new tab state:

```typescript
const tabs = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'extracted', label: 'Extracted Data', icon: Database }, // NEW
  { id: 'measurements', label: 'Measurements', icon: Ruler },
  { id: 'images', label: 'Image Analysis', icon: Camera },
  { id: 'raw', label: 'Raw Data', icon: Code2 }
];
```

Add new tab content after line 300:

```typescript
{activeTab === 'extracted' && (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <DataComparisonCard
        label="Weight (carats)"
        manualValue={gemstone.weight_carats}
        aiValue={gemstone.ai_weight_carats}
        confidence={gemstone.ai_extraction_confidence}
      />
      <DataComparisonCard
        label="Dimensions (mm)"
        manualValue={gemstone.length_mm ? 
          `${gemstone.length_mm} × ${gemstone.width_mm} × ${gemstone.depth_mm}` : null}
        aiValue={gemstone.ai_length_mm ? 
          `${gemstone.ai_length_mm} × ${gemstone.ai_width_mm} × ${gemstone.ai_depth_mm}` : null}
        confidence={gemstone.ai_extraction_confidence}
      />
      <DataComparisonCard
        label="Color"
        manualValue={gemstone.color}
        aiValue={gemstone.ai_color}
        confidence={gemstone.ai_extraction_confidence}
      />
      <DataComparisonCard
        label="Clarity"
        manualValue={gemstone.clarity}
        aiValue={gemstone.ai_clarity}
        confidence={gemstone.ai_extraction_confidence}
      />
      <DataComparisonCard
        label="Cut"
        manualValue={gemstone.cut}
        aiValue={gemstone.ai_cut}
        confidence={gemstone.ai_extraction_confidence}
      />
      <DataComparisonCard
        label="Origin"
        manualValue={gemstone.origin}
        aiValue={gemstone.ai_origin}
        confidence={gemstone.ai_extraction_confidence}
      />
    </div>
    
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Data Quality Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Extraction Confidence:</span>
            <Badge variant={gemstone.ai_extraction_confidence > 0.8 ? 'default' : 'secondary'}>
              {(gemstone.ai_extraction_confidence * 100).toFixed(0)}%
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Fields with Manual Data:</span>
            <span>{/* count manual fields */}</span>
          </div>
          <div className="flex justify-between">
            <span>Fields with AI Data Only:</span>
            <span>{/* count AI-only fields */}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)}
```

### 4.2 Create Data Comparison Component

**File: `src/features/gemstones/components/data-comparison-card.tsx`**

```typescript
interface DataComparisonCardProps {
  label: string;
  manualValue: string | number | null;
  aiValue: string | number | null;
  confidence?: number;
}

export function DataComparisonCard({ label, manualValue, aiValue, confidence }: DataComparisonCardProps) {
  const hasManual = manualValue !== null && manualValue !== undefined;
  const hasAI = aiValue !== null && aiValue !== undefined;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {label}
          {confidence && (
            <Badge variant="outline" className="text-xs">
              {(confidence * 100).toFixed(0)}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasManual && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">Manual</Badge>
            <span className="font-semibold">{manualValue}</span>
          </div>
        )}
        {hasAI && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">AI</Badge>
            <span className={hasManual ? 'text-muted-foreground' : 'font-semibold'}>
              {aiValue}
            </span>
          </div>
        )}
        {!hasManual && !hasAI && (
          <span className="text-sm text-muted-foreground italic">No data</span>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Phase 5: User UI - Main Gemstone Detail View (2 hours)

### 5.1 Add Description Display Component

**File: `src/features/gemstones/components/gemstone-descriptions.tsx`**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Languages, Award, BookOpen } from 'lucide-react';

interface GemstoneDescriptionsProps {
  technicalRu: string | null;
  technicalEn: string | null;
  emotionalRu: string | null;
  emotionalEn: string | null;
  narrativeRu: string | null;
  narrativeEn: string | null;
  locale?: string;
}

export function GemstoneDescriptions({
  technicalRu, technicalEn, emotionalRu, emotionalEn,
  narrativeRu, narrativeEn, locale = 'ru'
}: GemstoneDescriptionsProps) {
  
  // Show nothing if no descriptions
  if (!technicalRu && !emotionalRu && !narrativeRu) {
    return null;
  }
  
  const isRussian = locale === 'ru';
  const technical = isRussian ? technicalRu : technicalEn;
  const emotional = isRussian ? emotionalRu : emotionalEn;
  const narrative = isRussian ? narrativeRu : narrativeEn;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5" />
          Описания
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="emotional" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="emotional" className="text-sm">
              <Award className="w-4 h-4 mr-2" />
              Описание
            </TabsTrigger>
            <TabsTrigger value="technical" className="text-sm">
              Технические
            </TabsTrigger>
            <TabsTrigger value="narrative" className="text-sm">
              <BookOpen className="w-4 h-4 mr-2" />
              История
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="emotional" className="mt-4">
            <div className="prose prose-sm max-w-none">
              {emotional ? (
                <p className="text-base leading-relaxed">{emotional}</p>
              ) : (
                <p className="text-muted-foreground italic">Описание скоро появится</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="technical" className="mt-4">
            <div className="prose prose-sm max-w-none">
              {technical ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{technical}</p>
              ) : (
                <p className="text-muted-foreground italic">Техническое описание скоро появится</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="narrative" className="mt-4">
            <div className="prose prose-sm max-w-none">
              {narrative ? (
                <div className="text-center py-6">
                  <p className="text-base leading-loose font-serif text-foreground/90">
                    {narrative}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">История камня скоро появится</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

### 5.2 Integrate into Gemstone Detail

**File: `src/features/gemstones/components/gemstone-detail.tsx`**

After line 636 (after Origin card, before AI Analysis), add:

```typescript
{/* Gemstone Descriptions - User-Friendly Display */}
<GemstoneDescriptions
  technicalRu={gemstone.description_technical_ru}
  technicalEn={gemstone.description_technical_en}
  emotionalRu={gemstone.description_emotional_ru}
  emotionalEn={gemstone.description_emotional_en}
  narrativeRu={gemstone.narrative_story_ru}
  narrativeEn={gemstone.narrative_story_en}
  locale={locale}
/>
```

Add import at top:

```typescript
import { GemstoneDescriptions } from './gemstone-descriptions';
```

### 5.3 Update Gemstone Card (List View)

**File: `src/features/gemstones/components/gemstone-card.tsx`**

Around line 150, add emotional description preview if available:

```typescript
{/* Show emotional description snippet if available */}
{gemstone.description_emotional_ru && (
  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
    {gemstone.description_emotional_ru}
  </p>
)}
```

---

## Phase 6: TypeScript Types Update (30 min)

### 6.1 Regenerate Database Types

Run after migration:

```bash
npm run types:generate
```

### 6.2 Update Gemstone Props Interface

**File: `src/features/gemstones/types/gemstone.types.ts`** (if exists)

Ensure interfaces include:

```typescript
interface GemstoneWithAIData extends Gemstone {
  ai_weight_carats?: number | null;
  ai_length_mm?: number | null;
  ai_width_mm?: number | null;
  ai_depth_mm?: number | null;
  ai_color?: string | null;
  ai_clarity?: string | null;
  ai_cut?: string | null;
  ai_origin?: string | null;
  ai_extraction_confidence?: number | null;
  description_technical_ru?: string | null;
  description_technical_en?: string | null;
  description_emotional_ru?: string | null;
  description_emotional_en?: string | null;
  narrative_story_ru?: string | null;
  narrative_story_en?: string | null;
}
```

---

## Phase 7: Testing & Validation (1.5 hours)

### 7.1 Create Test Script

**File: `scripts/test-complete-ai-workflow.mjs`**

```javascript
#!/usr/bin/env node
import { runMultiImageAnalysis } from './ai-gemstone-analyzer-v3.mjs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testCompleteWorkflow() {
  console.log('🧪 Complete AI Workflow Test\n');
  
  // Step 1: Vision analysis (5 gems)
  console.log('Step 1: Running vision analysis...');
  await runMultiImageAnalysis({ limit: 5 });
  
  // Step 2: Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 3: Description generation
  console.log('\nStep 2: Generating descriptions...');
  await execAsync('node scripts/ai-description-generator-v4.mjs --limit=5');
  
  // Step 4: Verify data in database
  console.log('\nStep 3: Verifying database...');
  // Add verification queries
  
  console.log('\n✅ Complete workflow test finished!');
}

testCompleteWorkflow().catch(console.error);
```

### 7.2 Testing Milestones with Evidence

#### Milestone 1: Database Schema Verification (After Phase 1)

**Via Supabase MCP:**

```
mcp_supabase_execute_sql({
  project_id: "dpqapyojcdtrjwuhybky",
  query: `
    -- Verify new columns exist
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'gemstones'
    AND column_name LIKE 'ai_%'
    ORDER BY column_name;
    
    -- Verify view exists
    SELECT table_name, view_definition
    FROM information_schema.views
    WHERE table_name = 'gemstones_with_best_data';
  `
})
```

**Expected Result:**

- 12 new ai_* columns visible
- gemstones_with_best_data view created
- All columns have correct data types (NUMERIC, TEXT, TIMESTAMPTZ)

**Document in:** `PHASE_AI_FINALIZATION_MILESTONE_1.md`

---

#### Milestone 2: Data Extraction Verification (After Phase 2)

**Test via Script:**

```bash
node scripts/test-gpt5-analysis.mjs
```

**Via Supabase MCP (check extraction results):**

```
mcp_supabase_execute_sql({
  project_id: "dpqapyojcdtrjwuhybky",
  query: `
    SELECT 
      serial_number,
      weight_carats as manual_weight,
      ai_weight_carats,
      length_mm as manual_length,
      ai_length_mm,
      ai_color,
      ai_clarity,
      ai_extraction_confidence,
      ai_extracted_date
    FROM gemstones
    WHERE ai_extracted_date IS NOT NULL
    ORDER BY ai_extracted_date DESC
    LIMIT 5;
  `
})
```

**Via API (test fallback view):**

```bash
curl -X POST 'https://dpqapyojcdtrjwuhybky.supabase.co/rest/v1/rpc/test_best_data_fallback' \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Or direct view query:

```
mcp_supabase_execute_sql({
  project_id: "dpqapyojcdtrjwuhybky",
  query: `
    SELECT 
      serial_number,
      weight_carats,
      ai_weight_carats,
      best_weight_carats,
      weight_source,
      best_color,
      best_clarity
    FROM gemstones_with_best_data
    WHERE ai_extraction_confidence IS NOT NULL
    LIMIT 5;
  `
})
```

**Expected Result:**

- ai_* fields populated with extracted data
- ai_extraction_confidence > 0.0
- best_* fields show manual data when available, AI otherwise
- weight_source correctly indicates 'manual' or 'ai'

**Document in:** `PHASE_AI_FINALIZATION_MILESTONE_2.md`

---

#### Milestone 3: Description Generation Verification (After Phase 3)

**Test via Script:**

```bash
node scripts/ai-description-generator-v4.mjs --limit=5
```

**Via Supabase MCP:**

```
mcp_supabase_execute_sql({
  project_id: "dpqapyojcdtrjwuhybky",
  query: `
    SELECT 
      serial_number,
      LEFT(description_technical_ru, 100) as tech_ru_preview,
      LEFT(description_emotional_ru, 100) as emot_ru_preview,
      LEFT(narrative_story_ru, 100) as story_ru_preview,
      ai_description_model,
      ai_description_cost_usd,
      ai_description_date
    FROM gemstones
    WHERE description_technical_ru IS NOT NULL
    ORDER BY ai_description_date DESC
    LIMIT 5;
  `
})
```

**Expected Result:**

- All 3 description types populated (technical, emotional, narrative)
- Both Russian and English versions present
- ai_description_model = 'gpt-5-mini'
- ai_description_cost_usd between $0.003-0.007
- Descriptions are unique and relevant to gemstone data

**Document in:** `PHASE_AI_FINALIZATION_MILESTONE_3.md`

---

#### Milestone 4: Admin UI Verification (After Phase 4)

**Via Browser MCP:**

```
mcp_cursor-playwright_browser_navigate({
  url: "http://localhost:3000/ru/admin/gemstones"
})
```

Then click on a gemstone with AI data:

```
mcp_cursor-playwright_browser_click({
  element: "First gemstone card with AI badge",
  ref: "[data-testid='gemstone-card-0']"
})
```

Navigate to AI Analysis section and Extracted Data tab:

```
mcp_cursor-playwright_browser_click({
  element: "Extracted Data tab",
  ref: "[data-tab='extracted']"
})
```

Take screenshot:

```
mcp_cursor-playwright_browser_take_screenshot({
  filename: "admin-ui-extracted-data-tab.png"
})
```

**Expected Result:**

- Extracted Data tab visible
- DataComparisonCard components showing manual vs AI values
- Confidence scores displayed
- Manual data marked with "Manual" badge
- AI data marked with "AI" badge
- Quality assessment section shows metrics

**Document in:** `PHASE_AI_FINALIZATION_MILESTONE_4.md` with screenshot

---

#### Milestone 5: User UI Verification (After Phase 5)

**Via Browser MCP:**

```
mcp_cursor-playwright_browser_navigate({
  url: "http://localhost:3000/ru/catalog"
})
```

Click on gemstone with descriptions:

```
mcp_cursor-playwright_browser_click({
  element: "Gemstone card",
  ref: "[data-gemstone-id='<id>']"
})
```

Take screenshot of descriptions section:

```
mcp_cursor-playwright_browser_take_screenshot({
  element: "Gemstone descriptions card",
  ref: "[data-testid='gemstone-descriptions']",
  filename: "user-ui-descriptions.png"
})
```

Test tab switching:

```
mcp_cursor-playwright_browser_click({
  element: "Technical description tab",
  ref: "[data-tab='technical']"
})
```

Screenshot technical tab:

```
mcp_cursor-playwright_browser_take_screenshot({
  filename: "user-ui-technical-tab.png"
})
```

**Expected Result:**

- GemstoneDescriptions component renders
- 3 tabs: Описание (emotional), Технические (technical), История (narrative)
- Default tab shows emotional description
- Tab switching works smoothly
- Text is properly formatted and readable
- Correct locale used (Russian/English based on route)

**Document in:** `PHASE_AI_FINALIZATION_MILESTONE_5.md` with screenshots

---

#### Milestone 6: List View Preview (After Phase 5.3)

**Via Browser MCP:**

```
mcp_cursor-playwright_browser_navigate({
  url: "http://localhost:3000/ru/catalog"
})
```

Take screenshot of catalog with description previews:

```
mcp_cursor-playwright_browser_take_screenshot({
  filename: "catalog-with-description-previews.png"
})
```

**Expected Result:**

- Gemstone cards show 2-line preview of emotional description
- Preview is properly truncated with ellipsis
- Only shows for gemstones with descriptions

**Document in:** `PHASE_AI_FINALIZATION_MILESTONE_6.md` with screenshot

---

#### Milestone 7: Complete Workflow Integration Test

**Run complete workflow:**

```bash
node scripts/test-complete-ai-workflow.mjs
```

**Via Supabase MCP (verify end-to-end):**

```
mcp_supabase_execute_sql({
  project_id: "dpqapyojcdtrjwuhybky",
  query: `
    SELECT 
      g.serial_number,
      g.ai_weight_carats,
      g.ai_extraction_confidence,
      g.description_emotional_ru IS NOT NULL as has_emotional,
      g.description_technical_ru IS NOT NULL as has_technical,
      g.narrative_story_ru IS NOT NULL as has_narrative,
      COUNT(aar.id) as analysis_count,
      g.ai_description_cost_usd + COALESCE(MAX(aar.cost_usd), 0) as total_cost
    FROM gemstones g
    LEFT JOIN ai_analysis_results aar ON aar.gemstone_id = g.id
    WHERE g.ai_extracted_date IS NOT NULL
    GROUP BY g.id, g.serial_number, g.ai_weight_carats, g.ai_extraction_confidence, 
             g.description_emotional_ru, g.description_technical_ru, g.narrative_story_ru,
             g.ai_description_cost_usd
    ORDER BY g.ai_extracted_date DESC
    LIMIT 5;
  `
})
```

**Expected Result:**

- Vision analysis completed
- Extracted data populated
- All 3 descriptions generated
- Total cost per gemstone ~$0.035
- No errors in workflow
- Processing time ~60s per gemstone

**Document in:** `PHASE_AI_FINALIZATION_COMPLETE.md`

---

### 7.3 Final Acceptance Testing Checklist

Before Phase 8 deployment:

1. ✅ Database schema correct (Milestone 1)
2. ✅ Data extraction working (Milestone 2)
3. ✅ Fallback logic correct (Milestone 2)
4. ✅ Descriptions generated (Milestone 3)
5. ✅ Admin UI displays extracted data (Milestone 4)
6. ✅ User UI displays descriptions (Milestone 5)
7. ✅ Catalog preview works (Milestone 6)
8. ✅ Complete workflow runs successfully (Milestone 7)
9. ✅ Cost per gemstone ~$0.035
10. ✅ No manual data overwritten
11. ✅ All screenshots captured and documented
12. ✅ All SQL verification queries pass

---

## Phase 8: Production Deployment (1 hour)

### 8.1 Update Main Scripts

**File: `scripts/ai-gemstone-analyzer-v3.mjs`**

Ensure it calls extraction after analysis (should be done in Phase 2.2)

### 8.2 Create Full Workflow Command

**File: `scripts/run-complete-ai-analysis.mjs`**

```javascript
#!/usr/bin/env node
// Run complete workflow: vision → extraction → descriptions

import { runMultiImageAnalysis } from './ai-gemstone-analyzer-v3.mjs';
import { execSync } from 'child_process';

async function main() {
  const limit = process.argv[2] || 100;
  
  console.log(`🚀 Running complete AI analysis for ${limit} gemstones\n`);
  
  // Phase 1: Vision analysis + extraction
  console.log('📍 Phase 1: Vision Analysis & Data Extraction');
  await runMultiImageAnalysis({ limit: parseInt(limit) });
  
  // Phase 2: Description generation
  console.log('\n📍 Phase 2: Description Generation');
  execSync(`node scripts/ai-description-generator-v4.mjs --limit=${limit}`, { 
    stdio: 'inherit' 
  });
  
  console.log('\n✅ Complete AI analysis finished!');
}

main().catch(console.error);
```

---

## Implementation Order

1. Phase 1: Database migration (run via Supabase MCP)
2. Phase 2: Data extraction logic
3. Phase 6: TypeScript type regeneration
4. Phase 4: Admin UI updates
5. Phase 5: User UI components
6. Phase 3: Description generation enhancement
7. Phase 7: Testing
8. Phase 8: Production deployment

## Success Criteria

- AI-extracted data saved to ai_* fields without overwriting manual data
- View provides best-value fallback (manual > AI)
- All 3 description types generated in Russian + English
- Admin UI shows data comparison (manual vs AI)
- User UI displays descriptions in user-friendly tabs
- Complete workflow runs: vision → extraction → descriptions
- Cost per gemstone: ~$0.03 (vision + descriptions with gpt-5-mini)
- Processing time: ~60s per gemstone total

## Cost Estimate

**Per Gemstone (gpt-5-mini for all):**

- Vision analysis: $0.030
- Description generation: ~$0.005
- **Total: ~$0.035/gemstone**

**Full Collection (1,385 gems):**

- Vision: $41.22
- Descriptions: $6.93
- **Total: ~$48.15**

## Files to Create

- `migrations/20251015_add_ai_extracted_fields.sql`
- `scripts/ai-analysis/data-extractor.mjs`
- `scripts/test-complete-ai-workflow.mjs`
- `scripts/run-complete-ai-analysis.mjs`
- `src/features/gemstones/components/gemstone-descriptions.tsx`
- `src/features/gemstones/components/data-comparison-card.tsx`

## Files to Modify

- `scripts/ai-analysis/database-operations.mjs` (add extraction after save)
- `scripts/ai-analysis/prompts-v4.mjs` (add buildDescriptionPrompt helper)
- `scripts/ai-description-generator-v4.mjs` (use extracted data)
- `src/features/gemstones/components/ai-analysis-display.tsx` (add extracted tab)
- `src/features/gemstones/components/gemstone-detail.tsx` (add descriptions)
- `src/features/gemstones/components/gemstone-card.tsx` (show description preview)

### To-dos

- [ ] Create model configuration system with pricing and capabilities in scripts/ai-analysis/model-config.mjs
- [ ] Add OPENAI_VISION_MODEL and OPENAI_DESCRIPTION_MODEL to .env.local.example (blocked by global ignore - user has values in .env.local)
- [ ] Update multi-image-processor.mjs to use configurable models and actual token accounting
- [ ] Add image optimization with sharp library in image-utils.mjs (downscale to 1536px, JPEG quality 82)
- [ ] Create prompts-v4.mjs with multilingual description generation prompts (technical, emotional, narrative)
- [ ] Create and run migration 20251015_add_ai_descriptions.sql to add description columns to gemstones table
- [ ] Implement ai-description-generator-v4.mjs script for generating three types of descriptions
- [ ] Create test-gpt5-analysis.mjs to validate GPT-5 analysis with 5 gemstones
- [x] Execute test suite with 5 gemstones and validate quality, cost, and OCR accuracy
- [x] Review test results: Russian OCR accuracy, primary image selection, description uniqueness, and cost per gemstone
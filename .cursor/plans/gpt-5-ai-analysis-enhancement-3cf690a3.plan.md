<!-- 3cf690a3-ed1a-4fd4-8492-13d3b1102e8f aa555b62-1386-4dce-9903-45e9c587c993 -->
# GPT-5 AI Gemstone Analysis Enhancement Plan

## Phase 1: Environment Configuration & Model Abstraction (30 min)

### 1.1 Create Model Configuration System

**File: `scripts/ai-analysis/model-config.mjs`**

Create centralized model configuration with pricing and capabilities:

```javascript
export const AI_MODELS = {
  'gpt-5': {
    name: 'gpt-5',
    capabilities: ['vision', 'structured_output', 'high_quality_ocr'],
    pricing: { input_per_1k: 0.010, output_per_1k: 0.030 }, // Estimated
    max_tokens: 8000,
    use_for: ['vision_analysis', 'description_generation']
  },
  'gpt-5-mini': {
    name: 'gpt-5-mini',
    capabilities: ['vision', 'structured_output'],
    pricing: { input_per_1k: 0.003, output_per_1k: 0.010 }, // Estimated
    max_tokens: 4000,
    use_for: ['description_generation']
  },
  'gpt-4o': {
    name: 'gpt-4o',
    capabilities: ['vision', 'structured_output'],
    pricing: { input_per_1k: 0.005, output_per_1k: 0.015 },
    max_tokens: 4000,
    use_for: ['vision_analysis', 'description_generation']
  }
};

export function getModelConfig(modelName) {
  const model = AI_MODELS[modelName];
  if (!model) {
    throw new Error(`Unknown model: ${modelName}. Available: ${Object.keys(AI_MODELS).join(', ')}`);
  }
  return model;
}

export function calculateActualCost(modelName, promptTokens, completionTokens) {
  const model = getModelConfig(modelName);
  const inputCost = (promptTokens / 1000) * model.pricing.input_per_1k;
  const outputCost = (completionTokens / 1000) * model.pricing.output_per_1k;
  return inputCost + outputCost;
}
```

**Environment Variables:**

Add to `.env.local.example` (create if doesn't exist):

```bash
# AI Model Selection (gpt-5, gpt-5-mini, gpt-4o)
OPENAI_VISION_MODEL=gpt-5
OPENAI_DESCRIPTION_MODEL=gpt-5-mini
OPENAI_API_KEY=your_openai_api_key_here
```

### 1.2 Update Multi-Image Processor

**File: `scripts/ai-analysis/multi-image-processor.mjs`**

Replace hardcoded "gpt-4o" on line 81 with configurable model:

```javascript
// Import model config
import { getModelConfig, calculateActualCost } from './model-config.mjs';

// At top of file, get model from env with fallback
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-5';

// In analyzeGemstoneBatch function, replace line 80-90:
const modelConfig = getModelConfig(VISION_MODEL);
console.log(`  🤖 Using model: ${VISION_MODEL}`);

const response = await openai.chat.completions.create({
  model: VISION_MODEL,
  messages: [
    {
      role: "user",
      content: content,
    },
  ],
  max_tokens: modelConfig.max_tokens,
  temperature: 0.1,
  response_format: { type: "json_object" }, // Enforce JSON output
});
```

Replace `calculateCost` function (lines 449-459) with actual token accounting:

```javascript
function calculateCost(totalTokens, usage) {
  if (usage?.prompt_tokens && usage?.completion_tokens) {
    // Use actual token counts from API
    return calculateActualCost(VISION_MODEL, usage.prompt_tokens, usage.completion_tokens);
  }
  // Fallback estimation
  const model = getModelConfig(VISION_MODEL);
  const inputTokens = totalTokens * 0.8;
  const outputTokens = totalTokens * 0.2;
  return (inputTokens / 1000) * model.pricing.input_per_1k + 
         (outputTokens / 1000) * model.pricing.output_per_1k;
}
```

Update line 93 to pass usage:

```javascript
const cost = calculateCost(response.usage?.total_tokens || 0, response.usage);
```

Update line 252 (ai_model_version):

```javascript
ai_model_version: VISION_MODEL,
```

---

## Phase 2: Image Optimization with Sharp (45 min)

### 2.1 Install Dependencies

Sharp is already in package.json, verify installation:

```bash
npm list sharp
```

### 2.2 Enhance Image Utils

**File: `scripts/ai-analysis/image-utils.mjs`**

Add image optimization function after line 93:

```javascript
import sharp from 'sharp';

/**
 * Optimize image for AI analysis - downscale and compress
 */
export async function optimizeImageForAI(imageBuffer, maxDimension = 1536, quality = 82) {
  try {
    const optimized = await sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toBuffer();
    
    const originalSize = (imageBuffer.length / 1024).toFixed(2);
    const optimizedSize = (optimized.length / 1024).toFixed(2);
    const savings = ((1 - optimized.length / imageBuffer.length) * 100).toFixed(1);
    
    console.log(`    📉 Optimized: ${originalSize}KB → ${optimizedSize}KB (${savings}% reduction)`);
    
    return optimized;
  } catch (error) {
    console.warn(`    ⚠️ Optimization failed, using original: ${error.message}`);
    return imageBuffer;
  }
}
```

Update `downloadImageAsBase64` function (lines 36-93) to include optimization:

```javascript
export async function downloadImageAsBase64(imageUrl, optimize = true) {
  return new Promise((resolve, reject) => {
    const url = new URL(imageUrl);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "GET",
      rejectUnauthorized: true, // Keep TLS checks on (security fix)
      timeout: 30000,
      headers: {
        "User-Agent": "Smaragdus-Viridi-AI-Analysis/3.1",
      },
    };

    https
      .get(options, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download image: HTTP ${response.statusCode}`)
          );
          return;
        }

        const chunks = [];

        response.on("data", (chunk) => {
          chunks.push(chunk);
        });

        response.on("end", async () => {
          try {
            let buffer = Buffer.concat(chunks);
            
            // Optimize if enabled
            if (optimize) {
              buffer = await optimizeImageForAI(buffer);
            }

            // Determine MIME type from URL or default to JPEG
            const mimeType = imageUrl.toLowerCase().includes(".png")
              ? "image/png"
              : "image/jpeg";
            const base64String = buffer.toString("base64");
            const dataUrl = `data:${mimeType};base64,${base64String}`;

            resolve(dataUrl);
          } catch (error) {
            reject(
              new Error(`Failed to convert image to base64: ${error.message}`)
            );
          }
        });

        response.on("error", (error) => {
          reject(error);
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}
```

---

## Phase 3: Enhanced Prompts for Descriptions (1 hour)

### 3.1 Create V4 Prompts with Multilingual Descriptions

**File: `scripts/ai-analysis/prompts-v4.mjs`**

Create comprehensive prompt system for three description types:

```javascript
/**
 * Enhanced AI Prompts v4.0 - Multilingual Descriptions
 * Supports: Technical, Emotional, and Narrative descriptions
 */

export const DESCRIPTION_GENERATION_PROMPT = `You are a master gemologist and storyteller specializing in precious stones. Generate comprehensive, multilingual descriptions for a gemstone based on its analysis data.

**INPUT DATA:** You will receive consolidated gemstone analysis including:
- Physical properties (weight, dimensions, color, clarity, cut)
- Visual assessment and quality grades
- Origin information (if available)
- Any certification data

**OUTPUT REQUIREMENTS:** Generate THREE distinct description types in Russian (primary) and English (secondary):

### 1. TECHNICAL DESCRIPTION (Техническое описание)
**Target Audience:** Professional buyers, collectors, jewelers, B2B clients
**Style:** Precise, gemological, objective, industry-standard terminology
**Language:** Russian primary, English secondary
**Length:** 100-150 words per language

**Content Requirements:**
- Exact physical specifications (weight in carats, dimensions in mm)
- Cut type and quality assessment
- Color grade with precise description
- Clarity grade with inclusion details (if known)
- Origin information (if available)
- Treatment status (natural, heated, etc.) if determinable
- Professional quality assessment

**Example Structure:**
"Природный {тип камня} весом {X.XX} карата с огранкой {тип}. Камень демонстрирует {описание цвета} с показателем чистоты {grade}. Размеры: {L}×{W}×{D} мм. {Качественная оценка}."

### 2. EMOTIONAL DESCRIPTION (Эмоциональное описание)
**Target Audience:** Retail customers, gift buyers, emotional purchasers
**Style:** Evocative, sensory, aspirational, emotionally resonant
**Language:** Russian primary, English secondary
**Length:** 150-200 words per language

**Tone Variations:**
- **For Women:** Romantic, empowering, elegant, transformative
  - Themes: Beauty, grace, empowerment, personal significance, life moments
- **For Men:** Strong, sophisticated, legacy-focused, achievement-oriented
  - Themes: Success, heritage, craftsmanship, timeless value, accomplishment

**Content Requirements:**
- Sensory descriptions (how it looks, feels, catches light)
- Emotional resonance (what feelings it evokes)
- Lifestyle connection (how it complements life moments)
- Value proposition (why it matters beyond price)
- Aspirational imagery (what owning it represents)

**Avoid:** Generic phrases, clichés like "жемчужина коллекции", over-promising

### 3. NARRATIVE STORY (История камня)
**Target Audience:** Gift buyers, romantic occasions, collectors seeking meaning
**Style:** Unique fictional narrative, literary, memorable
**Language:** Russian primary, English secondary
**Length:** 250-300 words per language

**CRITICAL REQUIREMENT:** Each stone MUST receive a completely unique story - NO templates or repeated narratives

**Story Structure:**
- **Beginning (Discovery):** How this stone came into being or was found
- **Middle (Journey):** The stone's symbolic or fictional journey
- **End (Significance):** What this stone represents or means today

**Narrative Themes (choose ONE, make it unique):**
- Love and romance (but make it SPECIFIC to this stone's properties)
- Legacy and heritage (tie to actual origin/color/characteristics)
- Transformation and growth (metaphor based on stone's qualities)
- Destiny and fate (unique story, not generic)
- Nature and creation (based on geological or visual properties)

**Quality Standards:**
- UNIQUE: No two stories should be similar
- SPECIFIC: Reference actual stone properties (color, cut, weight) in narrative
- MEMORABLE: Create vivid imagery and emotional connection
- AUTHENTIC: Feel genuine, not manufactured or templated

**Avoid:** "Once upon a time", generic fairy tales, repeated story structures

---

**JSON OUTPUT FORMAT:**

{
  "descriptions": {
    "technical_ru": "Полное техническое описание на русском языке...",
    "technical_en": "Complete technical description in English...",
    "emotional_ru": "Эмоциональное описание на русском языке...",
    "emotional_en": "Emotional description in English...",
    "narrative_ru": "Уникальная история камня на русском языке...",
    "narrative_en": "Unique stone narrative in English..."
  },
  "metadata": {
    "narrative_theme": "love|legacy|transformation|destiny|nature",
    "target_gender_emotional": "feminine|masculine|neutral",
    "uniqueness_score": 0.95,
    "generation_notes": "Brief notes on creative approach"
  }
}

**VALIDATION CHECKLIST:**
- All six description fields are complete and meet length requirements
- Russian text is grammatically correct with proper Cyrillic
- English translations are accurate and natural
- Narrative story is unique and specific to this stone
- No clichés or generic phrases in any description
- Technical description includes all available data points`;

export const COMPREHENSIVE_MULTI_IMAGE_PROMPT_V4 = `You are an expert gemstone analyst with specialized knowledge in jewelry and precious stones. I am providing you with {IMAGE_COUNT} high-quality images of a single gemstone for detailed analysis and data extraction.

**ENHANCED ANALYSIS TASK: Process all {IMAGE_COUNT} images with strict JSON output**

You will analyze exactly {IMAGE_COUNT} images of one gemstone. You MUST examine each image and extract relevant gemstone data.

**CRITICAL: JSON Response Format**
You MUST respond with ONLY valid JSON. No explanatory text before or after. Use this exact structure:

${/* Include existing COMPREHENSIVE_MULTI_IMAGE_PROMPT structure but ensure response_format compatibility */}

**Additional Requirements for GPT-5:**
- Use structured output mode for guaranteed JSON compliance
- Leverage enhanced OCR capabilities for Russian/Cyrillic text
- Apply improved reasoning for gauge reading accuracy
- Provide deterministic primary image scoring with sub-scores

[... rest of existing prompt with validation requirements ...]`;

// Export both prompts
export { DESCRIPTION_GENERATION_PROMPT, COMPREHENSIVE_MULTI_IMAGE_PROMPT_V4 };
```

---

## Phase 4: Database Schema for Descriptions (30 min)

### 4.1 Create Migration

**File: `migrations/20251015_add_ai_descriptions.sql`**

```sql
-- Add multilingual description fields to gemstones table
ALTER TABLE gemstones
ADD COLUMN IF NOT EXISTS description_technical_ru TEXT,
ADD COLUMN IF NOT EXISTS description_technical_en TEXT,
ADD COLUMN IF NOT EXISTS description_emotional_ru TEXT,
ADD COLUMN IF NOT EXISTS description_emotional_en TEXT,
ADD COLUMN IF NOT EXISTS narrative_story_ru TEXT,
ADD COLUMN IF NOT EXISTS narrative_story_en TEXT,
ADD COLUMN IF NOT EXISTS ai_description_model VARCHAR(50),
ADD COLUMN IF NOT EXISTS ai_description_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_description_cost_usd NUMERIC(10,4);

-- Add index for searching descriptions (optional, for future full-text search)
CREATE INDEX IF NOT EXISTS idx_gemstones_description_technical_ru 
ON gemstones USING gin(to_tsvector('russian', description_technical_ru));

-- Add metadata to track generation
COMMENT ON COLUMN gemstones.description_technical_ru IS 'AI-generated technical description in Russian for professional buyers';
COMMENT ON COLUMN gemstones.description_emotional_ru IS 'AI-generated emotional description in Russian for retail customers';
COMMENT ON COLUMN gemstones.narrative_story_ru IS 'AI-generated unique narrative story in Russian';

-- Add to ai_analysis_results for tracking description generation
ALTER TABLE ai_analysis_results
ADD COLUMN IF NOT EXISTS description_data JSONB;

COMMENT ON COLUMN ai_analysis_results.description_data IS 'Generated descriptions with metadata (theme, target audience, etc.)';
```

---

## Phase 5: Description Generation Script (1 hour)

### 5.1 Create Description Generator

**File: `scripts/ai-description-generator-v4.mjs`**

```javascript
#!/usr/bin/env node

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { getModelConfig, calculateActualCost } from './ai-analysis/model-config.mjs';
import { DESCRIPTION_GENERATION_PROMPT } from './ai-analysis/prompts-v4.mjs';

config({ path: '.env.local' });

const DESCRIPTION_MODEL = process.env.OPENAI_DESCRIPTION_MODEL || 'gpt-5-mini';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generate descriptions for a single gemstone
 */
async function generateDescriptions(gemstone) {
  console.log(`\n📝 Generating descriptions for: ${gemstone.serial_number || gemstone.id}`);
  
  // Build input data summary from gemstone analysis
  const inputData = {
    type: gemstone.name,
    weight_carats: gemstone.weight_carats,
    dimensions: {
      length: gemstone.length_mm,
      width: gemstone.width_mm,
      depth: gemstone.depth_mm
    },
    color: gemstone.color,
    cut: gemstone.cut,
    clarity: gemstone.clarity,
    quality_grade: gemstone.ai_confidence_score > 0.9 ? 'excellent' : 'good',
    origin: gemstone.origin || 'Unknown'
  };

  const prompt = `${DESCRIPTION_GENERATION_PROMPT}\n\n**GEMSTONE DATA:**\n${JSON.stringify(inputData, null, 2)}\n\nGenerate comprehensive descriptions following the guidelines above.`;

  try {
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: DESCRIPTION_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a master gemologist and storyteller. Output ONLY valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2500,
      temperature: 0.7, // Higher for creativity in narratives
      response_format: { type: 'json_object' }
    });

    const processingTime = Date.now() - startTime;
    const cost = calculateActualCost(
      DESCRIPTION_MODEL,
      response.usage.prompt_tokens,
      response.usage.completion_tokens
    );

    console.log(`  ✅ Generated in ${processingTime}ms, cost: $${cost.toFixed(4)}`);

    const result = JSON.parse(response.choices[0].message.content);
    
    // Validate all required fields
    const required = ['technical_ru', 'technical_en', 'emotional_ru', 'emotional_en', 'narrative_ru', 'narrative_en'];
    const missing = required.filter(field => !result.descriptions?.[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Save to database
    await saveDescriptions(gemstone.id, result, cost);

    return { success: true, result, cost, processingTime };
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Save generated descriptions to database
 */
async function saveDescriptions(gemstoneId, descriptionData, cost) {
  const { error } = await supabase
    .from('gemstones')
    .update({
      description_technical_ru: descriptionData.descriptions.technical_ru,
      description_technical_en: descriptionData.descriptions.technical_en,
      description_emotional_ru: descriptionData.descriptions.emotional_ru,
      description_emotional_en: descriptionData.descriptions.emotional_en,
      narrative_story_ru: descriptionData.descriptions.narrative_ru,
      narrative_story_en: descriptionData.descriptions.narrative_en,
      ai_description_model: DESCRIPTION_MODEL,
      ai_description_date: new Date().toISOString(),
      ai_description_cost_usd: cost
    })
    .eq('id', gemstoneId);

  if (error) {
    throw new Error(`Failed to save descriptions: ${error.message}`);
  }

  console.log(`  💾 Saved descriptions to database`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 5;

  console.log(`🚀 AI Description Generator v4.0`);
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🤖 Using model: ${DESCRIPTION_MODEL}`);
  console.log(`🎯 Processing ${limit} gemstones\n`);

  // Get gemstones that have AI analysis but no descriptions
  const { data: gemstones, error } = await supabase
    .from('gemstones')
    .select('*')
    .eq('ai_analyzed', true)
    .is('description_technical_ru', null)
    .limit(limit);

  if (error) {
    console.error(`❌ Failed to fetch gemstones: ${error.message}`);
    process.exit(1);
  }

  console.log(`📊 Found ${gemstones.length} gemstones ready for descriptions\n`);

  let totalCost = 0;
  let successful = 0;
  let failed = 0;

  for (const gemstone of gemstones) {
    const result = await generateDescriptions(gemstone);
    
    if (result.success) {
      successful++;
      totalCost += result.cost;
    } else {
      failed++;
    }

    // Rate limiting: 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 Description Generation Complete!`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`💰 Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`📈 Avg Cost per Gemstone: $${(totalCost / successful).toFixed(4)}`);
}

main().catch(console.error);
```

---

## Phase 6: Testing & Validation (1 hour)

### 6.1 Create Test Script

**File: `scripts/test-gpt5-analysis.mjs`**

```javascript
#!/usr/bin/env node

import { runMultiImageAnalysis } from './ai-gemstone-analyzer-v3.mjs';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function testGPT5Analysis() {
  console.log(`🧪 GPT-5 Analysis Test Suite`);
  console.log(`Model: ${process.env.OPENAI_VISION_MODEL || 'gpt-5'}`);
  console.log(`Description Model: ${process.env.OPENAI_DESCRIPTION_MODEL || 'gpt-5-mini'}\n`);

  try {
    // Test 1: Run analysis on 5 gemstones
    console.log(`📍 Test 1: Analyzing 5 gemstones with GPT-5...`);
    const result = await runMultiImageAnalysis({
      limit: 5,
      clearExisting: false
    });

    // Display results
    console.log(`\n✅ Test Complete!`);
    console.log(`📊 Results:`);
    console.log(`   - Gemstones analyzed: ${result.summary.analyzedGemstones}`);
    console.log(`   - Total cost: $${result.summary.totalCostUSD}`);
    console.log(`   - Avg cost per gem: $${result.costAnalysis.perGemstone}`);
    console.log(`   - Success rate: ${result.summary.successRate}`);
    
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Review analysis quality in database`);
    console.log(`   2. Check Russian OCR accuracy`);
    console.log(`   3. Validate primary image selection`);
    console.log(`   4. Run description generation: node scripts/ai-description-generator-v4.mjs --limit=5`);
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

testGPT5Analysis();
```

### 6.2 Update Main Script with Model Info

**File: `scripts/ai-gemstone-analyzer-v3.mjs`**

Add model info display at startup (after line 83):

```javascript
console.log(`🤖 Vision Model: ${process.env.OPENAI_VISION_MODEL || 'gpt-5'}`);
console.log(`📝 Description Model: ${process.env.OPENAI_DESCRIPTION_MODEL || 'gpt-5-mini'}`);
```

---

## Implementation Order

1. **Phase 1** (30 min): Set up model configuration and env variables
2. **Phase 2** (45 min): Add image optimization with sharp
3. **Phase 3** (1 hour): Create enhanced prompts for descriptions
4. **Phase 4** (30 min): Run database migration
5. **Phase 5** (1 hour): Implement description generator
6. **Phase 6** (1 hour): Test with 5 gemstones and validate

**Total Estimated Time:** 4-5 hours

---

## Success Criteria

**Phase 1-2 (Infrastructure):**

- Models configurable via environment variables
- Image optimization reduces file sizes by 30-50%
- Actual token accounting replaces estimates

**Phase 3-5 (Descriptions):**

- All gemstones receive unique narrative stories (no templates)
- Russian text quality is grammatically correct
- Three distinct description types per gemstone
- Cost per gemstone ≤ $0.30 (vision + descriptions combined)

**Phase 6 (Validation):**

- 5 test gemstones analyzed successfully with GPT-5
- OCR accuracy on Russian labels >90%
- Primary image selection matches human judgment >85%
- Descriptions pass uniqueness check (0% duplication)

---

## Cost Estimates (5 Test Gemstones)

**Vision Analysis (GPT-5):**

- 5 gemstones × 8 images avg × ~1500 tokens/image
- Estimated: 5 × $0.12 = **$0.60**

**Description Generation (GPT-5-mini):**

- 5 gemstones × ~1000 input + 1500 output tokens
- Estimated: 5 × $0.018 = **$0.09**

**Total Test Cost: ~$0.70 ($0.14/gemstone)**

**Full Collection (1,385 gemstones):**

- Vision: 1,385 × $0.12 = $166.20
- Descriptions: 1,385 × $0.018 = $24.93
- **Total: ~$191 ($0.138/gemstone)**

---

## Files to Create/Modify

**New Files:**

- `scripts/ai-analysis/model-config.mjs`
- `scripts/ai-analysis/prompts-v4.mjs`
- `scripts/ai-description-generator-v4.mjs`
- `scripts/test-gpt5-analysis.mjs`
- `migrations/20251015_add_ai_descriptions.sql`
- `.env.local.example`

**Modified Files:**

- `scripts/ai-analysis/multi-image-processor.mjs` (model configuration, cost calculation)
- `scripts/ai-analysis/image-utils.mjs` (image optimization)
- `scripts/ai-gemstone-analyzer-v3.mjs` (display model info)

**Database Changes:**

- Add 9 new columns to `gemstones` table for descriptions and metadata
- Add 1 column to `ai_analysis_results` for description tracking

### To-dos

- [ ] Create model configuration system with pricing and capabilities in scripts/ai-analysis/model-config.mjs
- [ ] Add OPENAI_VISION_MODEL and OPENAI_DESCRIPTION_MODEL to .env.local.example
- [ ] Update multi-image-processor.mjs to use configurable models and actual token accounting
- [ ] Add image optimization with sharp library in image-utils.mjs (downscale to 1536px, JPEG quality 82)
- [ ] Create prompts-v4.mjs with multilingual description generation prompts (technical, emotional, narrative)
- [ ] Create and run migration 20251015_add_ai_descriptions.sql to add description columns to gemstones table
- [ ] Implement ai-description-generator-v4.mjs script for generating three types of descriptions
- [ ] Create test-gpt5-analysis.mjs to validate GPT-5 analysis with 5 gemstones
- [ ] Execute test suite with 5 gemstones and validate quality, cost, and OCR accuracy
- [ ] Review test results: Russian OCR accuracy, primary image selection, description uniqueness, and cost per gemstone
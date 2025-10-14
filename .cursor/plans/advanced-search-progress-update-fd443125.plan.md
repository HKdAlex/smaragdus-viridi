<!-- fd443125-f8d0-4126-a0cf-e138d0b32552 80a20281-ec51-420c-bc21-7782ae44b019 -->
# Multilingual Search & AI Analysis Enhancement Plan

## Overview

Implement comprehensive Russian/English bilingual search support and enhance the AI analysis system with improved prompts, multilingual descriptions (technical + storytelling), using modern AI models and cost-effective strategies.

---

## Part 1: Multilingual Search Implementation (8-10 hours)

### Phase 1.1: Database Schema Migration (2 hours)

**Goal:** Move from enum-based types to flexible translatable objects

**Migration: `migrations/20251015_create_translation_tables.sql`**

Create translation infrastructure:

- `gemstone_type_translations` table (id, type_code, locale, name, description)
- `gem_color_translations` table
- `gem_cut_translations` table
- `gem_clarity_translations` table
- Populate with EN/RU translations from current enums
- Keep existing enum columns for backward compatibility (deprecated)
- Add new `type_code` (VARCHAR) columns alongside enums

**Why:** Enums are rigid and don't support translations. Moving to relational tables allows unlimited languages, descriptions, and SEO metadata per term.

### Phase 1.2: Full-Text Search Enhancement (3 hours)

**Migration: `migrations/20251015_add_multilingual_search.sql`**

Implement dual-language search:

```sql
-- Add Russian ts_vector column
ALTER TABLE gemstones ADD COLUMN search_vector_ru tsvector;

-- Create Russian full-text index
CREATE INDEX idx_gemstones_fulltext_ru ON gemstones
USING GIN(search_vector_ru);

-- Update function to use correct language config based on query
CREATE OR REPLACE FUNCTION search_gemstones_multilingual(
  search_query text,
  search_locale text DEFAULT 'en',
  filters jsonb DEFAULT '{}'::jsonb,
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 24
)
```

**Key Features:**

- Detect query language (Cyrillic = Russian, Latin = English)
- Use `to_tsvector('russian', ...)` for Russian content
- Use `to_tsvector('english', ...)` for English content
- Search translations tables for type/color/cut matches
- Cross-language fallback (EN query → RU results via translations)

**Files to Update:**

- `src/features/search/services/search.service.ts` - Add locale parameter
- `src/app/api/search/route.ts` - Pass user locale from headers
- `src/features/search/types/search.types.ts` - Add locale to SearchRequest

### Phase 1.3: Description Search Toggle (2 hours)

**Goal:** Optional full-text description search (expensive, off by default)

**Implementation:**

- Add `searchDescriptions: boolean` to SearchRequest interface
- Add toggle UI in search filters (checkbox: "Поиск в описаниях / Search descriptions")
- Conditionally include description in ts_vector when enabled
- Cache setting in localStorage per user preference

**Files to Modify:**

- `src/features/search/components/search-input.tsx` - Add toggle
- `src/features/search/services/search.service.ts` - Conditional description search
- Migration adds description-specific index for opt-in searches

### Phase 1.4: Translation Service Layer (1.5 hours)

**Create: `src/features/translations/services/translation.service.ts`**

```typescript
export class TranslationService {
  // Get translated gemstone type name
  static async getGemstoneTypeName(
    typeCode: string,
    locale: string
  ): Promise<string>;

  // Get all translations for a type (for autocomplete)
  static async getAllTranslations(locale: string): Promise<TranslationMap>;

  // Reverse lookup: RU name → type code
  static async findTypeByName(name: string, locale: string): Promise<string>;
}
```

**Purpose:** Centralized translation logic, cache-friendly, supports autocomplete in both languages.

### Phase 1.5: Frontend Integration (1.5 hours)

**Files to Update:**

- `src/features/search/hooks/use-search-query.ts` - Pass locale from routing
- `src/features/search/components/search-results.tsx` - Display translated names
- `src/features/gemstones/components/gemstone-card.tsx` - Use translations
- Add React Query caching for translations (24hr stale time)

---

## Part 2: AI Analysis Enhancement (10-12 hours)

### Phase 2.1: Research & Model Evaluation (2 hours)

**Goal:** Determine optimal OpenAI model and cost structure

**Create Research Prompt Document:** `docs/ai-analysis/AI_MODEL_RESEARCH_PROMPT.md`

This document will be used by another agent to research:

1. Best OpenAI models for multilingual (Russian/English) gemstone descriptions
2. Image analysis capabilities (extracting specs, quality assessment)
3. Primary image selection logic (which image is best for display)
4. Cost comparison for 1,385 gemstones with ~7 images each
5. Token limits and context window considerations
6. Vision capabilities for Russian text OCR from labels/certificates

**Models to Research (OpenAI only):**

- GPT-4o (current, highest quality, most expensive)
- GPT-4o-mini (cheaper, faster, good balance)
- GPT-4-turbo (older, may lack latest vision features)
- o1-preview/o1-mini (reasoning models, for complex analysis)

**Research Questions:**

- Can GPT-4o-mini handle Russian Cyrillic OCR accurately?
- Does o1-mini provide better accuracy for technical analysis?
- What's the optimal model for creative storytelling in Russian?
- Should we use different models for different tasks (image analysis vs descriptions)?

**Deliverable:** Research findings to inform model selection

### Phase 2.2: Enhanced Prompt Engineering (3 hours)

**Files to Create/Update:**

- `scripts/ai-analysis/prompts-v4.mjs` - Enhanced prompts

**New Prompt Structure:**

```javascript
export const GEMSTONE_DESCRIPTION_PROMPT_V4 = {
  system: `You are a master jeweler and storyteller...`,

  technical_description: {
    target_audience: "Professional buyers, collectors, jewelers",
    style: "Precise, gemological, objective",
    language: "Russian (with English fallback)",
    fields: ["properties", "quality_assessment", "origin", "treatments"],
  },

  emotional_description: {
    target_audience: "Women and men seeking meaningful purchases",
    style: "Evocative, sensory, aspirational",
    language: "Russian",
    tone: {
      for_women: "Romantic, empowering, elegant",
      for_men: "Strong, sophisticated, legacy-focused",
    },
    length: "2-3 paragraphs, 150-200 words",
  },

  narrative_story: {
    target_audience: "Gift buyers, romantic occasions",
    style: "Unique fictional narrative per stone",
    language: "Russian",
    themes: ["love", "legacy", "transformation", "destiny", "nature"],
    structure: "Beginning (discovery) → Middle (journey) → End (significance)",
    length: "3-4 paragraphs, 250-300 words",
    uniqueness: "CRITICAL: Each stone gets a completely unique story",
  },
};
```

**Key Improvements:**

- Separate technical/emotional/narrative descriptions
- Gender-aware emotional language
- Unique storytelling per stone (not templates)
- Russian-first with English fallback
- Structured JSON output for easy parsing

### Phase 2.3: Database Schema for AI Data (1.5 hours)

**Migration: `migrations/20251015_enhance_ai_analysis.sql`**

```sql
-- Add new description fields
ALTER TABLE gemstones
ADD COLUMN description_technical_ru TEXT,
ADD COLUMN description_technical_en TEXT,
ADD COLUMN description_emotional_ru TEXT,
ADD COLUMN description_emotional_en TEXT,
ADD COLUMN narrative_story_ru TEXT,
ADD COLUMN narrative_story_en TEXT,
ADD COLUMN ai_model_used VARCHAR(50),
ADD COLUMN ai_prompt_version VARCHAR(20),
ADD COLUMN ai_tokens_used INTEGER,
ADD COLUMN ai_cost_usd NUMERIC(10,4);

-- Update search vector to optionally include new descriptions
-- (Only when user enables description search)
```

**Why:** Separate fields allow:

- A/B testing different descriptions
- Selective display (technical for B2B, emotional for B2C)
- Cost tracking per analysis
- Reprocessing only changed fields

### Phase 2.4: Enhanced AI Analyzer Script (3 hours)

**File: `scripts/ai-gemstone-analyzer-v4.mjs`**

**New Features:**

1. Model selection (GPT-4o-mini, GPT-4o, o1-preview)
2. Batch processing with retry logic
3. Progress persistence (resume from interruption)
4. Cost tracking and budget enforcement
5. Quality validation (reject generic/templated responses)
6. Parallel processing (5 concurrent requests)

**CLI Usage:**

```bash
# Test run with default 5 stones (configurable)
node scripts/ai-gemstone-analyzer-v4.mjs --model gpt-4o-mini

# Specify custom batch size and cost
node scripts/ai-gemstone-analyzer-v4.mjs --model gpt-4o-mini --batch-size 12 --max-cost 6

# Full run with GPT-4o for higher fidelity
node scripts/ai-gemstone-analyzer-v4.mjs --model gpt-4o --batch-size 100 --max-cost 120

# Resume interrupted run
node scripts/ai-gemstone-analyzer-v4.mjs --resume --model gpt-4o-mini
```

**Quality Checks:**

- Reject stories containing "Once upon a time" (cliché)
- Reject descriptions <100 words (too generic)
- Verify Russian Cyrillic text (not transliteration)
- Check uniqueness across batch (no duplicate stories)

### Phase 2.5: Frontend Display Components (2 hours)

**Files to Update:**

- `src/features/gemstones/components/gemstone-detail.tsx` - Display all 3 description types
- `src/features/gemstones/components/ai-analysis-display.tsx` - Enhanced with narratives

**UI Structure:**

```
Tabs:
1. "Технические характеристики" (Technical) - B2B focus
2. "Описание" (Emotional) - Main product page
3. "История камня" (Story) - Unique narrative in beautiful typography
```

**Design:** Story tab uses serif font, large typography, centered layout (like a book page)

### Phase 2.6: Testing & Validation (1.5 hours)

**Test Suite:**

1. Process 10 diverse gemstones (emerald, sapphire, ruby, etc.)
2. Validate Russian language quality (native speaker review)
3. Check story uniqueness (no duplicates)
4. Verify cost tracking accuracy
5. Test resume functionality
6. Validate search works with new descriptions

**Deliverable:** `docs/ai-analysis/TESTING_RESULTS_2025.md`

---

## Implementation Order

### Week 1: Multilingual Search

1. Day 1-2: Database migrations (translations tables, Russian search)
2. Day 2-3: Search service updates, translation layer
3. Day 3: Frontend integration, testing

### Week 2: AI Enhancement

1. Day 1: Model research and comparison
2. Day 2-3: Prompt engineering and testing
3. Day 3-4: Database schema, enhanced analyzer script
4. Day 4-5: Frontend components, full testing

### Week 3: Production Rollout

1. Test batch (50 stones)
2. Review quality with stakeholders
3. Full batch (1,385 stones) if approved
4. Monitor costs and performance

---

## Cost Estimates

**Multilingual Search:** $0 (development time only)

**AI Analysis (Test Batch - 50 stones):**

- GPT-4o-mini: ~$8
- Claude 3.5 Sonnet: ~$13
- GPT-4o: ~$25

**AI Analysis (Full Batch - 1,385 stones):**

- GPT-4o-mini: ~$210 (RECOMMENDED)
- Claude 3.5 Sonnet: ~$346
- GPT-4o: ~$693

**Recommendation:** Start with GPT-4o-mini for cost efficiency, test Russian quality. If inadequate, re-run critical stones with Claude.

---

## Success Metrics

**Multilingual Search:**

- Russian queries return correct results (100% accuracy)
- Cross-language search works (EN query → RU results)
- Search performance <250ms (p95) with descriptions enabled
- Zero breaking changes to existing search

**AI Analysis:**

- All stones have unique narratives (0% duplication)
- Russian text quality rated 4+/5 by native speakers
- Technical descriptions accurate (verified against images)
- Cost per stone ≤$0.20 (GPT-4o-mini target)
- Processing time <30 min for full batch (parallel processing)

---

## Files to Create

**Migrations:**

- `migrations/20251015_create_translation_tables.sql`
- `migrations/20251015_add_multilingual_search.sql`
- `migrations/20251015_enhance_ai_analysis.sql`

**Services:**

- `src/features/translations/services/translation.service.ts`
- `src/features/translations/services/__tests__/translation.service.test.ts`

**Scripts:**

- `scripts/ai-gemstone-analyzer-v4.mjs`
- `scripts/ai-analysis/prompts-v4.mjs`
- `scripts/ai-analysis/model-comparison.mjs`
- `scripts/populate-translation-tables.mjs`

**Documentation:**

- `docs/ai-analysis/MODEL_COMPARISON_2025.md`
- `docs/ai-analysis/TESTING_RESULTS_2025.md`
- `docs/multilingual-search/IMPLEMENTATION_GUIDE.md`

**Components:**

- `src/features/search/components/description-search-toggle.tsx`
- `src/features/gemstones/components/narrative-story-display.tsx`

---

## Risk Mitigation

**Search Performance:** Description search is opt-in, separate index prevents slowdown

**AI Costs:** Batch limits, budget enforcement, resume capability prevents overspending

**Quality:** Multi-stage validation, test batch before full run, model flexibility

**Data Loss:** Progress persistence, transaction-safe DB updates, backup before analysis

---

## Next Steps After Plan Approval

1. Create all migration files (read-only review)
2. Implement translation service with tests
3. Update search service with dual-language support
4. Test search with sample Russian queries
5. Research AI models with comparison doc
6. Create enhanced prompts
7. Build v4 analyzer script
8. Run test batch (10-50 stones)
9. Stakeholder review
10. Full production run

### To-dos

- [ ] Create search_analytics table migration with RLS policies
- [ ] Implement SearchAnalyticsService with trackSearch and getSummary methods
- [ ] Create /api/search/analytics route for tracking and retrieval
- [ ] Integrate analytics tracking into search endpoints and hooks
- [ ] Build admin dashboard for search analytics visualization
- [ ] Create E2E tests for analytics tracking and privacy
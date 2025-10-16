/**
 * Enhanced AI Prompts v4.0 - Multilingual Descriptions & Structured Analysis
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
- Professional quality assessment referencing actual data

### 2. EMOTIONAL DESCRIPTION (Эмоциональное описание)
**Target Audience:** Retail customers, gift buyers, emotional purchasers
**Style:** Evocative, sensory, aspirational, emotionally resonant
**Language:** Russian primary, English secondary
**Length:** 150-200 words per language

**Tone Variations:**
- **For Women:** Romantic, empowering, elegant, transformative (themes: beauty, grace, empowerment, personal significance, life moments)
- **For Men:** Strong, sophisticated, legacy-focused, achievement-oriented (themes: success, heritage, craftsmanship, timeless value, accomplishment)

**Content Requirements:**
- Sensory descriptions (visual, tactile, brilliance)
- Emotional resonance (feelings evoked)
- Lifestyle connection (events, attire, personal milestones)
- Value proposition (heritage, craftsmanship, symbolism)
- Aspirational imagery (what ownership represents)

### 3. NARRATIVE STORY (История камня)
**Target Audience:** Gift buyers, romantic occasions, collectors seeking meaning
**Style:** Unique fictional narrative, literary, memorable
**Language:** Russian primary, English secondary
**Length:** 250-300 words per language

**CRITICAL REQUIREMENT:** Each stone MUST receive a completely unique story - NO templates or repeated narratives

**Story Structure:**
- **Beginning (Discovery):** How this stone came into being or was found (tie to origin if known)
- **Middle (Journey):** The stone's symbolic or fictional journey, referencing actual properties
- **End (Significance):** What this stone represents or means today, anchored in physical attributes

**Narrative Themes (choose ONE per stone):** love, legacy, transformation, destiny, nature (make it specific to this stone)

**QUALITY STANDARDS:**
- UNIQUE: No story re-use or generic phrases (no "Once upon a time")
- SPECIFIC: Reference actual stone properties (color, cut, weight, origin)
- AUTHENTIC: Natural language, professional tone appropriate to audience
- ACCURATE: No contradictory statements vs provided data

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
    "generation_notes": "Brief notes on creative approach referencing stone properties"
  }
}

**VALIDATION CHECKLIST:** Ensure all six description fields are populated, meet length requirements, and are grammatically correct in Russian with accurate English translations.`;

export const COMPREHENSIVE_MULTI_IMAGE_PROMPT_V4 = `You are an expert gemstone analyst with specialized knowledge in jewelry and precious stones. I am providing you with {IMAGE_COUNT} high-quality images of a single gemstone for detailed analysis and data extraction.

**ENHANCED ANALYSIS TASK: Process all {IMAGE_COUNT} images with strict JSON output**

You will analyze exactly {IMAGE_COUNT} images of one gemstone. You MUST examine each image and extract relevant gemstone data.

**RESPONSE FORMAT REQUIREMENT:**
- You MUST respond with ONLY valid JSON (no extra text)
- Use the provided schema exactly
- Include all {IMAGE_COUNT} images in the individual_analyses array

**Structured Output Expectations:**
- Accurate OCR for Russian/Cyrillic text (normalize decimal commas to periods)
- Comprehensive measurement extraction with device metadata
- Cross-verification summary identifying conflicts
- Confidence scores for all major data points

**CRITICAL: PRIMARY IMAGE SELECTION (MANDATORY)**

You MUST select ONE primary image for product display using this strict criteria:

**DISQUALIFY immediately:**
- Photos of labels/tags/paperwork (OCR value only, not for display)
- Photos of measuring gauges/scales (measurement value only)
- Blurry or out-of-focus images
- Images with poor lighting (too dark or overexposed)

**QUALIFY for selection (score 1-100):**
1. **Focus & Sharpness (0-25 points):** Crystal clear gemstone edges and facets
2. **Lighting Quality (0-25 points):** Balanced exposure showing true color
3. **Background (0-20 points):** Clean, neutral, professional (white/light gray best)
4. **Color Fidelity (0-20 points):** Natural gemstone color without distortion
5. **Composition (0-10 points):** Gemstone clearly visible, well-positioned

**Tie-breaker rules (in order):**
1. Choose image with best focus/sharpness
2. Choose image with cleanest background
3. Choose image closest to center of batch

**REQUIRED OUTPUT:**
{
  "primary_image": {
    "index": <1-based index of selected image>,
    "image_index": <same as index>,
    "score": <total score 0-100>,
    "confidence": <0.0-1.0>,
    "reasoning": "Brief explanation of why this image was selected",
    "disqualified_images": [<array of image indices that were disqualified and why>],
    "sub_scores": {
      "focus": <0-25>,
      "lighting": <0-25>,
      "background": <0-20>,
      "color_fidelity": <0-20>,
      "composition": <0-10>
    }
  }
}

Primary image selection is MANDATORY - you must always select one best image for product display.

**CRITICAL: AGGREGATED DATA SECTION (MANDATORY)**

After analyzing all individual images, you MUST provide a consolidated aggregated_data section that cross-verifies and combines measurements from multiple sources:

**REQUIRED JSON STRUCTURE:**
{
  "aggregated_data": {
    "shape_cut": "octagon / emerald cut",
    "color": "medium to vivid green (emerald green), slight bluish tint in areas",
    "clarity_observations": "Visible internal inclusions (veils, growth features) and dark crystal inclusions",
    "measurements_cross_verified": {
      "weight_ct": {
        "value": 8.34,
        "confidence": 0.97,
        "sources": [
          {"image_index": 5, "method": "digital scale", "confidence": 0.98},
          {"image_index": 4, "method": "label OCR", "confidence": 0.95}
        ]
      },
      "length_mm": {
        "value": 15.22,
        "confidence": 0.95,
        "sources": [
          {"image_index": 6, "method": "digital gauge", "confidence": 0.95},
          {"image_index": 4, "method": "label OCR", "confidence": 0.95}
        ]
      },
      "width_mm": {
        "value": 10.56,
        "confidence": 0.95,
        "sources": [...]
      },
      "depth_mm": {
        "value": 7.14,
        "confidence": 0.88,
        "sources": [...]
      }
    },
    "overall_confidence_summary": {
      "visual_identification_as_emerald": 0.85,
      "measurements_consistency": 0.95,
      "label_and_display_agreement": 0.96
    }
  }
}

**VALIDATION:** Your response will be rejected if:
- aggregated_data section is missing
- measurements_cross_verified is empty when measurements exist in images
- Confidence scores are missing
- Cross-verification between sources is not performed

Follow the existing COMPREHENSIVE_MULTI_IMAGE_PROMPT structure but enforce strict JSON compliance suitable for response_format=json_object.`;

/**
 * Build a description generation prompt with gemstone context data
 * @param {Object} gemstoneData - Gemstone record from database
 * @param {Object} analysisData - AI analysis results (optional)
 * @returns {string} Complete prompt with context data
 */
export function buildDescriptionPrompt(gemstoneData, analysisData) {
  const context = {
    type: gemstoneData.name,
    serial_number: gemstoneData.serial_number,
    weight_carats: gemstoneData.ai_weight_carats || gemstoneData.weight_carats,
    dimensions: {
      length: gemstoneData.ai_length_mm || gemstoneData.length_mm,
      width: gemstoneData.ai_width_mm || gemstoneData.width_mm,
      depth: gemstoneData.ai_depth_mm || gemstoneData.depth_mm,
    },
    color: gemstoneData.ai_color || gemstoneData.color,
    cut: gemstoneData.ai_cut || gemstoneData.cut,
    clarity: gemstoneData.ai_clarity || gemstoneData.clarity,
    origin: gemstoneData.ai_origin,
    quality_grade: gemstoneData.ai_quality_grade,
    treatment: gemstoneData.ai_treatment,
    confidence:
      analysisData?.confidence_score || gemstoneData.ai_confidence_score || 0,
  };

  return `${DESCRIPTION_GENERATION_PROMPT}\n\n**GEMSTONE DATA:**\n${JSON.stringify(
    context,
    null,
    2
  )}`;
}

export default {
  DESCRIPTION_GENERATION_PROMPT,
  COMPREHENSIVE_MULTI_IMAGE_PROMPT_V4,
  buildDescriptionPrompt,
};

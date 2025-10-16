/**
 * AI Text Generation Engine for v6
 * Uses OpenAI Structured Outputs for consistent content generation
 */

import {
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  MAX_TOKENS_OUTPUT,
  TIMEOUT_MS,
  withTimeout,
} from "./config.mjs";

import OpenAI from "openai";
import { TEXT_GENERATION_SCHEMA } from "./schemas.mjs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate rich textual content for a gemstone
 * @param {Object} options - Generation options
 * @param {Object} options.metadata - Gemstone metadata
 * @param {Array|null} options.images - Array of base64 encoded images (optional)
 * @param {string} options.model - OpenAI model to use
 * @param {string|null} options.detectedCut - AI-detected cut to override metadata (optional)
 * @returns {Promise<Object>} Generated content with metadata
 */
export async function generateGemstoneText(options) {
  const {
    metadata,
    images = null,
    model = DEFAULT_MODEL,
    detectedCut = null,
  } = options;

  const startTime = Date.now();

  // Build the user message with metadata (using detected cut if available)
  const userMessage = buildPromptMessage(metadata, images, detectedCut);

  try {
    const response = await withTimeout(
      openai.chat.completions.create({
        model,
        temperature: DEFAULT_TEMPERATURE,
        max_completion_tokens: MAX_TOKENS_OUTPUT, // Use max_completion_tokens for newer models
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          userMessage,
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "GemstoneTextGeneration",
            schema: TEXT_GENERATION_SCHEMA,
            strict: true,
          },
        },
      }),
      TIMEOUT_MS.TEXT_GENERATION
    );

    const generatedContent = JSON.parse(
      response.choices[0].message.content || "{}"
    );

    const endTime = Date.now();
    const usage = response.usage;

    return {
      content: generatedContent,
      metadata: {
        model_version: model,
        generation_time_ms: endTime - startTime,
        generation_cost_usd: calculateCost(usage, model),
        tokens_input: usage?.prompt_tokens || 0,
        tokens_output: usage?.completion_tokens || 0,
      },
    };
  } catch (error) {
    console.error("Text generation failed:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error(
        "Response data:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error(`Text generation failed: ${error.message}`);
  }
}

/**
 * Build the prompt message with metadata and optional images
 * @param {Object} metadata - Gemstone metadata
 * @param {Array|null} images - Base64 encoded images
 * @param {string|null} detectedCut - AI-detected cut to override metadata
 * @returns {Object} User message for OpenAI
 */
function buildPromptMessage(metadata, images, detectedCut = null) {
  const metadataText = formatMetadata(metadata, detectedCut);

  // If we have images, use multi-modal input
  if (images && images.length > 0) {
    return {
      role: "user",
      content: [
        {
          type: "text",
          text: `${USER_PROMPT_PREFIX}\n\n${metadataText}\n\n${USER_PROMPT_SUFFIX}`,
        },
        ...images.map((img) => ({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${img}`,
            detail: "low", // Lower cost, sufficient for inspiration
          },
        })),
      ],
    };
  }

  // Text-only generation
  return {
    role: "user",
    content: `${USER_PROMPT_PREFIX}\n\n${metadataText}\n\n${USER_PROMPT_SUFFIX_NO_IMAGES}`,
  };
}

/**
 * Format gemstone metadata into readable text
 * @param {Object} metadata - Gemstone metadata
 * @param {string|null} detectedCut - AI-detected cut to override metadata
 * @returns {string} Formatted metadata
 */
function formatMetadata(metadata, detectedCut = null) {
  // Use AI-detected cut if available and different from metadata
  const cutToUse = detectedCut || metadata.cut;
  const cutNote =
    detectedCut && detectedCut !== metadata.cut
      ? ` (AI-verified from images, metadata indicated "${metadata.cut}")`
      : "";

  return `
GEMSTONE METADATA:
- Type: ${metadata.name}
- Weight: ${metadata.weight_carats} carats
- Dimensions: ${metadata.length_mm} × ${metadata.width_mm} × ${
    metadata.depth_mm
  } mm
- Color: ${metadata.color} (${metadata.color_code})
- Clarity: ${metadata.clarity} (${metadata.clarity_code})
- Cut: ${cutToUse}${cutNote}
- Origin: ${metadata.origin_name || "Unknown"}${
    metadata.origin_country ? `, ${metadata.origin_country}` : ""
  }${metadata.origin_region ? ` (${metadata.origin_region})` : ""}
- Price: ${metadata.price_amount} ${metadata.price_currency}

IMPORTANT: Do NOT include the serial number in any generated descriptions. It is for internal reference only and should never appear in customer-facing content (technical description, emotional description, story, etc.).
`.trim();
}

/**
 * Calculate generation cost based on token usage
 * @param {Object} usage - Token usage from OpenAI
 * @param {string} model - Model used
 * @returns {number} Cost in USD
 */
function calculateCost(usage, model) {
  if (!usage) return 0;

  // Pricing for gpt-4o (as of Oct 2024)
  const pricing = {
    "gpt-4o": {
      input: 0.0025 / 1000, // $2.50 per 1M tokens
      output: 0.01 / 1000, // $10.00 per 1M tokens
    },
    "gpt-4o-mini": {
      input: 0.00015 / 1000, // $0.15 per 1M tokens
      output: 0.0006 / 1000, // $0.60 per 1M tokens
    },
  };

  const rates = pricing[model] || pricing["gpt-4o"];
  const inputCost = (usage.prompt_tokens || 0) * rates.input;
  const outputCost = (usage.completion_tokens || 0) * rates.output;

  return inputCost + outputCost;
}

// ============================================================================
// PROMPTS
// ============================================================================

const SYSTEM_PROMPT = `You are an expert gemologist and creative storyteller specializing in luxury gemstone descriptions. Your role is to generate rich, compelling, and accurate content for gemstones based on their technical specifications.

EXPERTISE:
- Deep knowledge of gemology, mineralogy, and gem history
- Understanding of luxury marketing and emotional storytelling
- Fluency in both English and Russian
- Ability to balance technical precision with evocative language

WRITING STYLE:
- Technical descriptions: Precise, professional, informative (200-300 words)
- Emotional descriptions: Evocative, sensory, poetic (150-200 words)
- Narrative stories: Engaging, imaginative yet plausible (300-400 words)
- Historical context: Educational, culturally rich (150-200 words)
- Care instructions: Clear, practical, reassuring (100-150 words)
- Marketing highlights: Concise, compelling, benefit-focused (3-5 points)
- Promotional text: Aspirational, occasion-focused (100-150 words)

BILINGUAL REQUIREMENTS:
- Russian translations must be natural, not literal
- Maintain cultural appropriateness for both markets
- Preserve meaning and emotional impact across languages
- Use proper gemological terminology in both languages

QUALITY STANDARDS:
- Ground all technical claims in the provided metadata
- Never fabricate specific measurements or properties
- Use conditional language for uncertain attributes ("likely", "appears to", "suggests")
- Flag lower confidence when images are unavailable
- Avoid generic templates; make each description unique`;

const USER_PROMPT_PREFIX = `Generate comprehensive textual content for this gemstone. Use the metadata as the primary source of truth. If images are provided, use them for visual inspiration (color nuances, brilliance, overall impression) but rely on metadata for all technical specifications.`;

const USER_PROMPT_SUFFIX = `IMPORTANT:
1. Technical description: Focus on factual specifications, cut quality, color characteristics, clarity details
2. Emotional description: Capture the visual beauty, play of light, emotional impact
3. Narrative story: Create a compelling journey from formation to discovery (fictional but plausible)
4. Historical context: Discuss the gemstone TYPE's history, cultural significance, famous examples
5. Care instructions: Practical advice for cleaning, storage, wear (specific to this gem type)
6. Marketing highlights: 3-5 bullet points emphasizing unique selling points
7. Promotional text: Suggest ideal occasions, gift scenarios, symbolic meanings

Use the images to enhance your descriptions with specific visual details (color depth, brilliance, inclusions if visible).

Provide confidence score based on:
- High (0.9-1.0): Complete metadata + clear images
- Medium (0.75-0.89): Complete metadata + partial/unclear images
- Lower (0.7-0.74): Complete metadata without images or incomplete data`;

const USER_PROMPT_SUFFIX_NO_IMAGES = `IMPORTANT:
1. Technical description: Focus on factual specifications, cut quality, color characteristics, clarity details
2. Emotional description: Capture the expected visual beauty based on gem type and specifications
3. Narrative story: Create a compelling journey from formation to discovery (fictional but plausible)
4. Historical context: Discuss the gemstone TYPE's history, cultural significance, famous examples
5. Care instructions: Practical advice for cleaning, storage, wear (specific to this gem type)
6. Marketing highlights: 3-5 bullet points emphasizing unique selling points
7. Promotional text: Suggest ideal occasions, gift scenarios, symbolic meanings

Since no images are provided, rely entirely on the metadata and your knowledge of this gemstone type. Use descriptive language typical for this type of gem.

Provide confidence score (typically 0.75-0.85 for metadata-only generation, as visual details cannot be confirmed).`;

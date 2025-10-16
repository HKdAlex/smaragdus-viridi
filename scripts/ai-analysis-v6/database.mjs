/**
 * Database operations for AI Text Generation v6
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch gemstone data for text generation
 * @param {string} gemstoneId - UUID of the gemstone
 * @returns {Promise<Object>} Gemstone data with metadata and images
 */
export async function getGemstoneForTextGeneration(gemstoneId) {
  // Fetch gemstone with its origin
  const { data: gemstone, error: gemError } = await supabase
    .from("gemstones")
    .select(
      `
      id,
      serial_number,
      name,
      weight_carats,
      length_mm,
      width_mm,
      depth_mm,
      color,
      color_code,
      clarity,
      clarity_code,
      cut,
      cut_code,
      price_amount,
      price_currency,
      origin_id,
      origins!gemstones_origin_id_fkey (
        name,
        country,
        region
      )
    `
    )
    .eq("id", gemstoneId)
    .single();

  if (gemError) {
    throw new Error(`Failed to fetch gemstone: ${gemError.message}`);
  }

  // Fetch associated images
  const { data: media, error: mediaError } = await supabase
    .from("gemstone_media")
    .select("id, file_path, url, media_type, display_order")
    .eq("gemstone_id", gemstoneId)
    .eq("media_type", "image")
    .order("display_order", { ascending: true })
    .limit(5); // Limit to first 5 images

  if (mediaError) {
    console.warn(`Failed to fetch media: ${mediaError.message}`);
  }

  const imageUrls = media?.map((m) => m.url).filter(Boolean) || [];

  return {
    ...gemstone,
    origin_name: gemstone.origins?.name || null,
    origin_country: gemstone.origins?.country || null,
    origin_region: gemstone.origins?.region || null,
    image_urls: imageUrls,
  };
}

/**
 * Save generated text to database
 * @param {string} gemstoneId - UUID of the gemstone
 * @param {Object} generatedContent - Generated text content
 * @param {Object} metadata - Generation metadata
 * @returns {Promise<void>}
 */
export async function saveTextGeneration(
  gemstoneId,
  generatedContent,
  metadata
) {
  const record = {
    gemstone_id: gemstoneId,
    technical_description_en: generatedContent.technical_description.en,
    technical_description_ru: generatedContent.technical_description.ru,
    emotional_description_en: generatedContent.emotional_description.en,
    emotional_description_ru: generatedContent.emotional_description.ru,
    narrative_story_en: generatedContent.narrative_story.en,
    narrative_story_ru: generatedContent.narrative_story.ru,
    historical_context_en: generatedContent.historical_context.en,
    historical_context_ru: generatedContent.historical_context.ru,
    care_instructions_en: generatedContent.care_instructions.en,
    care_instructions_ru: generatedContent.care_instructions.ru,
    marketing_highlights: generatedContent.marketing_highlights,
    promotional_text: generatedContent.promotional_text,
    model_version: metadata.model_version,
    used_images: metadata.used_images,
    image_urls: metadata.image_urls || [],
    confidence_score: generatedContent.confidence,
    generation_cost_usd: metadata.generation_cost_usd || null,
    generation_time_ms: metadata.generation_time_ms || null,
    needs_review: shouldFlagForReview(generatedContent, metadata),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("gemstones_ai_v6")
    .upsert(record, { onConflict: "gemstone_id" });

  if (error) {
    throw new Error(`Failed to save text generation: ${error.message}`);
  }
}

/**
 * Mark gemstone as having text generated
 * @param {string} gemstoneId - UUID of the gemstone
 * @returns {Promise<void>}
 */
export async function markGemstoneTextGenerated(gemstoneId) {
  const { error } = await supabase
    .from("gemstones")
    .update({
      ai_text_generated_v6: true,
      ai_text_generated_v6_date: new Date().toISOString(),
    })
    .eq("id", gemstoneId);

  if (error) {
    throw new Error(`Failed to mark gemstone: ${error.message}`);
  }
}

/**
 * Get gemstones needing text generation
 * @param {number} limit - Maximum number of gemstones to return
 * @returns {Promise<Array>} Array of gemstone IDs
 */
export async function getGemstonesNeedingText(limit = 10) {
  const { data, error } = await supabase
    .from("gemstones")
    .select("id, serial_number, name")
    .eq("ai_text_generated_v6", false)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch gemstones: ${error.message}`);
  }

  return data || [];
}

/**
 * Determine if generated content should be flagged for review
 * @param {Object} content - Generated content
 * @param {Object} metadata - Generation metadata
 * @returns {boolean} True if should be reviewed
 */
function shouldFlagForReview(content, metadata) {
  // Low confidence
  if (content.confidence < 0.7) {
    return true;
  }

  // Took too long
  if (metadata.generation_time_ms && metadata.generation_time_ms > 30000) {
    return true;
  }

  // Check for placeholder text patterns
  const allText = [
    content.technical_description.en,
    content.technical_description.ru,
    content.emotional_description.en,
    content.emotional_description.ru,
    content.narrative_story.en,
    content.narrative_story.ru,
    content.promotional_text,
  ].join(" ");

  const placeholderPatterns = [
    /\.\.\./g,
    /\bN\/A\b/gi,
    /\[.*?\]/g,
    /\{.*?\}/g,
    /TODO/gi,
    /PLACEHOLDER/gi,
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(allText)) {
      return true;
    }
  }

  // Check for missing required fields
  if (
    !content.marketing_highlights ||
    content.marketing_highlights.length < 3
  ) {
    return true;
  }

  return false;
}

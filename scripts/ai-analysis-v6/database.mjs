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
      quantity,
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

  // Fetch associated images (primary first) - get up to 20 images for analysis
  const { data: images, error: imagesError } = await supabase
    .from("gemstone_images")
    .select("id, image_url, image_order, is_primary")
    .eq("gemstone_id", gemstoneId)
    .order("is_primary", { ascending: false, nullsFirst: false })
    .order("image_order", { ascending: true })
    .limit(20);

  if (imagesError) {
    console.warn(`Failed to fetch images: ${imagesError.message}`);
  }

  const imageUrls = images?.map((m) => m.image_url).filter(Boolean) || [];
  const imageData = images?.filter((img) => img.image_url) || [];

  return {
    ...gemstone,
    origin_name: gemstone.origins?.name || null,
    origin_country: gemstone.origins?.country || null,
    origin_region: gemstone.origins?.region || null,
    image_urls: imageUrls,
    image_data: imageData, // Include full image metadata with UUIDs
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
    marketing_highlights: generatedContent.marketing_highlights.en,
    marketing_highlights_ru: generatedContent.marketing_highlights.ru,
    promotional_text: generatedContent.promotional_text.en,
    promotional_text_ru: generatedContent.promotional_text.ru,
    model_version: metadata.model_version,
    used_images: metadata.used_images,
    image_urls: metadata.image_urls || [],
    confidence_score: generatedContent.confidence,
    generation_cost_usd: metadata.generation_cost_usd || null,
    generation_time_ms: metadata.generation_time_ms || null,
    needs_review: shouldFlagForReview(generatedContent, metadata),
    // Image analysis results
    detected_cut: metadata.detected_cut || null,
    cut_detection_confidence: metadata.cut_detection_confidence || null,
    cut_matches_metadata: metadata.cut_matches_metadata ?? null,
    cut_detection_reasoning: metadata.cut_detection_reasoning || null,
    detected_color: metadata.detected_color || null,
    color_detection_confidence: metadata.color_detection_confidence || null,
    color_matches_metadata: metadata.color_matches_metadata ?? null,
    color_detection_reasoning: metadata.color_detection_reasoning || null,
    detected_color_description: metadata.detected_color_description || null,
    recommended_primary_image_index:
      metadata.recommended_primary_image_index ?? null,
    selected_image_uuid: metadata.selected_image_uuid || null,
    primary_image_selection_reasoning:
      metadata.primary_image_selection_reasoning || null,
    image_quality_scores: metadata.image_quality_scores || null,
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

  // Flag if cut detection found a mismatch
  if (metadata.cut_matches_metadata === false) {
    console.log("⚠️ Flagging for review: Cut mismatch detected");
    return true;
  }

  // Flag if cut detection confidence is low
  if (
    metadata.cut_detection_confidence !== null &&
    metadata.cut_detection_confidence !== undefined &&
    metadata.cut_detection_confidence < 0.6
  ) {
    console.log("⚠️ Flagging for review: Low cut detection confidence");
    return true;
  }

  // Flag if color detection found a mismatch
  if (metadata.color_matches_metadata === false) {
    console.log("⚠️ Flagging for review: Color mismatch detected");
    return true;
  }

  // Flag if color detection confidence is low
  if (
    metadata.color_detection_confidence !== null &&
    metadata.color_detection_confidence !== undefined &&
    metadata.color_detection_confidence < 0.6
  ) {
    console.log("⚠️ Flagging for review: Low color detection confidence");
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

/**
 * Update gemstones table with AI-detected color data
 * @param {string} gemstoneId - UUID of the gemstone
 * @param {Object} colorData - Color detection results
 * @returns {Promise<void>}
 */
export async function updateGemstoneAIColor(gemstoneId, colorData) {
  const { error } = await supabase
    .from("gemstones")
    .update({
      ai_color: colorData.detected_color,
      ai_color_code: colorData.detected_color,
      ai_color_description: colorData.color_description,
    })
    .eq("id", gemstoneId);

  if (error) {
    throw new Error(`Failed to update AI color: ${error.message}`);
  }
}

/**
 * Update gemstones table with AI-detected cut data
 * @param {string} gemstoneId - UUID of the gemstone
 * @param {Object} cutData - Cut detection results
 * @returns {Promise<void>}
 */
export async function updateGemstoneAICut(gemstoneId, cutData) {
  const { error } = await supabase
    .from("gemstones")
    .update({
      cut: cutData.detected_cut, // Update the main cut field with AI-detected value
    })
    .eq("id", gemstoneId);

  if (error) {
    throw new Error(`Failed to update AI cut: ${error.message}`);
  }
}

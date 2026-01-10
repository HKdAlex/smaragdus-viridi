import { AdminAuthError, requireAdmin } from "@/app/api/admin/_utils/require-admin";
import { NextRequest, NextResponse } from "next/server";

import type { Database } from "@/shared/types/database";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Server-side admin client
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
};

// Configuration
const DEFAULT_MODEL = process.env.OPENAI_DESCRIPTION_MODEL || "gpt-4o-mini";
const DEFAULT_TEMPERATURE = 1.0;
const MAX_TOKENS_OUTPUT = 6000;
const TIMEOUT_MS = 180000; // 3 minutes

// Text generation schema for structured output
const TEXT_GENERATION_SCHEMA = {
  type: "object" as const,
  properties: {
    technical_description: {
      type: "object" as const,
      properties: {
        en: { type: "string" as const },
        ru: { type: "string" as const },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    emotional_description: {
      type: "object" as const,
      properties: {
        en: { type: "string" as const },
        ru: { type: "string" as const },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    narrative_story: {
      type: "object" as const,
      properties: {
        en: { type: "string" as const },
        ru: { type: "string" as const },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    historical_context: {
      type: "object" as const,
      properties: {
        en: { type: "string" as const },
        ru: { type: "string" as const },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    care_instructions: {
      type: "object" as const,
      properties: {
        en: { type: "string" as const },
        ru: { type: "string" as const },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    marketing_highlights: {
      type: "object" as const,
      properties: {
        en: { type: "array" as const, items: { type: "string" as const } },
        ru: { type: "array" as const, items: { type: "string" as const } },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    promotional_text: {
      type: "object" as const,
      properties: {
        en: { type: "string" as const },
        ru: { type: "string" as const },
      },
      required: ["en", "ru"],
      additionalProperties: false,
    },
    confidence: { type: "number" as const },
  },
  required: [
    "technical_description",
    "emotional_description",
    "narrative_story",
    "historical_context",
    "care_instructions",
    "marketing_highlights",
    "promotional_text",
    "confidence",
  ],
  additionalProperties: false,
};

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

QUANTITY-AWARE LANGUAGE (CRITICAL):
Pay close attention to the QUANTITY field in the metadata:
- If quantity = 1: Use singular forms ("this gemstone", "it displays", "the stone")
- If quantity = 2: Use pair language ("this matched pair", "these two stones", "they display")
- If quantity = 3: Use trio language ("this trio", "these three gemstones", "they showcase")
- If quantity > 3: Use plural forms with count ("these [N] gemstones", "this collection of [N] stones")

BILINGUAL REQUIREMENTS:
- Russian translations must be natural, not literal
- Maintain cultural appropriateness for both markets
- Preserve meaning and emotional impact across languages
- Use proper gemological terminology in both languages
- Apply quantity-aware language in Russian too (этот камень / эта пара / эти три камня)

QUALITY STANDARDS:
- Ground all technical claims in the provided metadata
- Never fabricate specific measurements or properties
- Use conditional language for uncertain attributes ("likely", "appears to", "suggests")
- Flag lower confidence when images are unavailable
- Avoid generic templates; make each description unique`;

// Helper to download image as base64
async function downloadImageAsBase64(url: string, requestId?: string): Promise<string | null> {
  const downloadStart = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      console.warn(`⚠️ [AI Generation]${requestId ? ` [${requestId}]` : ''} Image download failed: ${response.status} ${response.statusText}`);
      return null;
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const downloadTime = Date.now() - downloadStart;
    const sizeKB = Math.round(buffer.byteLength / 1024);
    console.log(`✅ [AI Generation]${requestId ? ` [${requestId}]` : ''} Image downloaded: ${sizeKB}KB in ${downloadTime}ms`);
    return base64;
  } catch (error) {
    const downloadTime = Date.now() - downloadStart;
    console.warn(`⚠️ [AI Generation]${requestId ? ` [${requestId}]` : ''} Image download error after ${downloadTime}ms:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Format gemstone metadata for the prompt
function formatMetadata(gemstone: any): string {
  const quantity = gemstone.quantity || 1;
  const quantityText =
    quantity === 1
      ? "1 stone (use singular language)"
      : `${quantity} stones (use ${quantity === 2 ? "pair" : quantity === 3 ? "trio" : "plural"} language)`;

  const priceInDollars = ((gemstone.price_amount || 0) / 100).toFixed(2);

  // Include flexible fields if available
  const customFields = [];
  if (gemstone.name_custom) customFields.push(`- Custom Name: ${gemstone.name_custom}`);
  if (gemstone.color_custom) customFields.push(`- Custom Color: ${gemstone.color_custom}`);
  if (gemstone.cut_custom) customFields.push(`- Custom Cut: ${gemstone.cut_custom}`);
  if (gemstone.clarity_custom) customFields.push(`- Custom Clarity: ${gemstone.clarity_custom}`);
  if (gemstone.treatment_status) customFields.push(`- Treatment Status: ${gemstone.treatment_status}`);
  if (gemstone.color_change_description) customFields.push(`- Color Change: ${gemstone.color_change_description}`);
  if (gemstone.mining_country) customFields.push(`- Mining Country: ${gemstone.mining_country}`);
  if (gemstone.cutting_country) customFields.push(`- Cutting Country: ${gemstone.cutting_country}`);
  if (gemstone.quality_classification) customFields.push(`- Quality Classification: ${gemstone.quality_classification}`);
  if (gemstone.enhancement_notes) customFields.push(`- Enhancement Notes: ${gemstone.enhancement_notes}`);

  return `
GEMSTONE METADATA:
- Type: ${gemstone.name_custom || gemstone.name}
- Quantity: ${quantityText}
- Weight: ${gemstone.weight_carats} carats (${quantity > 1 ? "total weight for all stones" : "single stone"})
- Dimensions: ${gemstone.length_mm} × ${gemstone.width_mm} × ${gemstone.depth_mm} mm
- Color: ${gemstone.color_custom || gemstone.color} (${gemstone.color_code || gemstone.color})
- Clarity: ${gemstone.clarity_custom || gemstone.clarity} (${gemstone.clarity_code || gemstone.clarity})
- Cut: ${gemstone.cut_custom || gemstone.cut}
- Origin: ${gemstone.origin_name || "Unknown"}${gemstone.origin_country ? `, ${gemstone.origin_country}` : ""}${gemstone.origin_region ? ` (${gemstone.origin_region})` : ""}
- Price: $${priceInDollars} ${gemstone.price_currency}
${customFields.length > 0 ? "\nADDITIONAL DETAILS:\n" + customFields.join("\n") : ""}

IMPORTANT: 
1. Do NOT include the serial number in any generated descriptions. It is for internal reference only and should never appear in customer-facing content.
2. Use the correct singular/plural language based on the QUANTITY field above throughout ALL generated text.
`.trim();
}

// Calculate cost based on token usage
function calculateCost(usage: any, model: string): number {
  if (!usage) return 0;
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 0.0025 / 1000, output: 0.01 / 1000 },
    "gpt-4o-mini": { input: 0.00015 / 1000, output: 0.0006 / 1000 },
  };
  const rates = pricing[model] || pricing["gpt-4o-mini"];
  return (usage.prompt_tokens || 0) * rates.input + (usage.completion_tokens || 0) * rates.output;
}

// POST /api/admin/gemstones/[id]/generate-ai - Generate AI content for a gemstone
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { id } = await params;
    const supabase = getAdminClient();

    console.log(`🤖 [AI Generation] [${requestId}] Starting for gemstone: ${id}`);
    console.log(`📋 [AI Generation] [${requestId}] Model: ${DEFAULT_MODEL}, Timeout: ${TIMEOUT_MS}ms`);

    // Fetch gemstone with origin and cut (CUT-C3.1)
    const { data: gemstone, error: gemError } = await supabase
      .from("gemstones")
      .select(`
        id,
        serial_number,
        name,
        name_custom,
        weight_carats,
        length_mm,
        width_mm,
        depth_mm,
        color,
        color_custom,
        color_code,
        clarity,
        clarity_custom,
        clarity_code,
        cut_id,
        cut_custom,
        cut_code,
        quantity,
        price_amount,
        price_currency,
        origin_id,
        treatment_status,
        color_change_description,
        mining_country,
        cutting_country,
        quality_classification,
        enhancement_notes,
        origins!gemstones_origin_id_fkey (
          name,
          country,
          region
        ),
        cuts!gemstones_cut_id_fkey (
          code,
          name_en,
          name_ru
        )
      `)
      .eq("id", id)
      .single();

    if (gemError || !gemstone) {
      console.error(`❌ [AI Generation] [${requestId}] Failed to fetch gemstone:`, gemError);
      console.error(`❌ [AI Generation] [${requestId}] Error details:`, JSON.stringify(gemError, null, 2));
      return NextResponse.json(
        { error: "Gemstone not found", requestId },
        { status: 404 }
      );
    }

    console.log(`✅ [AI Generation] [${requestId}] Fetched gemstone: ${gemstone.serial_number || gemstone.id}`);
    console.log(`📊 [AI Generation] [${requestId}] Gemstone data:`, {
      name: gemstone.name_custom || gemstone.name,
      weight: gemstone.weight_carats,
      color: gemstone.color_custom || gemstone.color,
      cut: gemstone.cut_custom || gemstone.cut_code,
      clarity: gemstone.clarity_custom || gemstone.clarity,
      quantity: gemstone.quantity,
      hasCustomFields: !!(gemstone.name_custom || gemstone.color_custom || gemstone.cut_custom || gemstone.clarity_custom),
      hasDetailedProps: !!(gemstone.treatment_status || gemstone.mining_country || gemstone.cutting_country),
    });

    // Fetch images
    const { data: images } = await supabase
      .from("gemstone_images")
      .select("id, image_url, image_order, is_primary")
      .eq("gemstone_id", id)
      .order("is_primary", { ascending: false, nullsFirst: false })
      .order("image_order", { ascending: true })
      .limit(5);

    const imageUrls = images?.map((m) => m.image_url).filter(Boolean) || [];
    console.log(`📷 [AI Generation] [${requestId}] Found ${imageUrls.length} images`);
    if (imageUrls.length > 0) {
      console.log(`📷 [AI Generation] [${requestId}] Image URLs:`, imageUrls.slice(0, 3).map((url, i) => `${i + 1}. ${url.substring(0, 80)}...`));
    }

    // Download images as base64 (limit to 3 for efficiency)
    const imageDownloadStart = Date.now();
    const base64Images: string[] = [];
    for (let i = 0; i < imageUrls.slice(0, 3).length; i++) {
      const url = imageUrls[i];
      const imgStart = Date.now();
      console.log(`📥 [AI Generation] [${requestId}] Downloading image ${i + 1}/${Math.min(imageUrls.length, 3)}: ${url.substring(0, 80)}...`);
      const base64 = await downloadImageAsBase64(url, requestId);
      const imgTime = Date.now() - imgStart;
      if (base64) {
        base64Images.push(base64);
        console.log(`✅ [AI Generation] [${requestId}] Image ${i + 1} downloaded (${imgTime}ms, ${Math.round(base64.length / 1024)}KB base64)`);
      } else {
        console.warn(`⚠️ [AI Generation] [${requestId}] Failed to download image ${i + 1} (${imgTime}ms)`);
      }
    }
    const imageDownloadTime = Date.now() - imageDownloadStart;
    console.log(`📷 [AI Generation] [${requestId}] Downloaded ${base64Images.length}/${Math.min(imageUrls.length, 3)} images (${imageDownloadTime}ms total)`);

    // Prepare metadata (CUT-C3.1: get cut from cuts table)
    const origin = gemstone.origins as any;
    const cutData = gemstone.cuts as any;
    const metadata = {
      ...gemstone,
      cut: cutData?.code || gemstone.cut_code, // CUT-C3.1: derive cut from cuts table
      origin_name: origin?.name || null,
      origin_country: origin?.country || null,
      origin_region: origin?.region || null,
    };

    console.log(`📝 [AI Generation] [${requestId}] Preparing metadata...`);
    console.log(`📝 [AI Generation] [${requestId}] Cut data:`, {
      cut_id: gemstone.cut_id,
      cut_code: gemstone.cut_code,
      cut_custom: gemstone.cut_custom,
      cut_from_table: cutData?.code,
      cut_name_en: cutData?.name_en,
      cut_name_ru: cutData?.name_ru,
    });
    console.log(`📝 [AI Generation] [${requestId}] Origin data:`, {
      origin_id: gemstone.origin_id,
      origin_name: origin?.name,
      origin_country: origin?.country,
      origin_region: origin?.region,
    });

    const metadataText = formatMetadata(metadata);
    console.log(`📝 [AI Generation] [${requestId}] Metadata text length: ${metadataText.length} chars`);
    console.log(`📝 [AI Generation] [${requestId}] Metadata preview:\n${metadataText.substring(0, 500)}...`);

    // Build message content
    const hasImages = base64Images.length > 0;
    const userPromptSuffix = hasImages
      ? `Use the images to enhance your descriptions with specific visual details (color depth, brilliance, inclusions if visible).
Provide confidence score based on:
- High (0.9-1.0): Complete metadata + clear images
- Medium (0.75-0.89): Complete metadata + partial/unclear images
- Lower (0.7-0.74): Complete metadata without images or incomplete data`
      : `Since no images are provided, rely entirely on the metadata and your knowledge of this gemstone type. Use descriptive language typical for this type of gem.
Provide confidence score (typically 0.75-0.85 for metadata-only generation, as visual details cannot be confirmed).`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Generate comprehensive textual content for this gemstone. Use the metadata as the primary source of truth.

${metadataText}

${userPromptSuffix}`,
      },
    ];

    // Add images if available
    if (hasImages) {
      for (const img of base64Images) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${img}`,
            detail: "low",
          },
        });
      }
    }

    // Call OpenAI
    const openaiCallStart = Date.now();
    console.log(`🤖 [AI Generation] [${requestId}] Calling OpenAI with model: ${DEFAULT_MODEL}`);
    console.log(`🤖 [AI Generation] [${requestId}] Request config:`, {
      model: DEFAULT_MODEL,
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: MAX_TOKENS_OUTPUT,
      has_images: hasImages,
      num_images: base64Images.length,
      metadata_length: metadataText.length,
    });
    const openai = getOpenAIClient();

    const response = await Promise.race([
      openai.chat.completions.create({
        model: DEFAULT_MODEL,
        temperature: DEFAULT_TEMPERATURE,
        max_completion_tokens: MAX_TOKENS_OUTPUT,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
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
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), TIMEOUT_MS)
      ),
    ]);

    const openaiCallTime = Date.now() - openaiCallStart;
    console.log(`✅ [AI Generation] [${requestId}] OpenAI call completed in ${openaiCallTime}ms`);
    console.log(`📊 [AI Generation] [${requestId}] Token usage:`, {
      prompt_tokens: response.usage?.prompt_tokens,
      completion_tokens: response.usage?.completion_tokens,
      total_tokens: response.usage?.total_tokens,
    });

    const generatedContent = JSON.parse(
      response.choices[0].message.content || "{}"
    );

    const processingTime = Date.now() - startTime;
    const cost = calculateCost(response.usage, DEFAULT_MODEL);

    console.log(`✅ [AI Generation] [${requestId}] Generation completed in ${processingTime}ms, cost: $${cost.toFixed(4)}`);
    console.log(`📊 [AI Generation] [${requestId}] Generated content summary:`, {
      confidence: generatedContent.confidence,
      has_technical_en: !!generatedContent.technical_description?.en,
      has_technical_ru: !!generatedContent.technical_description?.ru,
      has_emotional_en: !!generatedContent.emotional_description?.en,
      has_emotional_ru: !!generatedContent.emotional_description?.ru,
      has_narrative_en: !!generatedContent.narrative_story?.en,
      has_narrative_ru: !!generatedContent.narrative_story?.ru,
      marketing_highlights_count: generatedContent.marketing_highlights?.en?.length || 0,
    });

    // Save to gemstones_ai_v6 table
    const aiRecord = {
      gemstone_id: id,
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
      model_version: DEFAULT_MODEL,
      used_images: hasImages,
      image_urls: imageUrls,
      confidence_score: generatedContent.confidence,
      generation_cost_usd: cost,
      generation_time_ms: processingTime,
      needs_review: generatedContent.confidence < 0.7,
      updated_at: new Date().toISOString(),
    };

    const saveStart = Date.now();
    console.log(`💾 [AI Generation] [${requestId}] Saving to database...`);
    const { error: upsertError } = await supabase
      .from("gemstones_ai_v6")
      .upsert(aiRecord, { onConflict: "gemstone_id" });

    if (upsertError) {
      console.error(`❌ [AI Generation] [${requestId}] Failed to save:`, upsertError);
      console.error(`❌ [AI Generation] [${requestId}] Error details:`, JSON.stringify(upsertError, null, 2));
      return NextResponse.json(
        { error: "Failed to save AI content", requestId, details: upsertError.message },
        { status: 500 }
      );
    }

    const saveTime = Date.now() - saveStart;
    console.log(`✅ [AI Generation] [${requestId}] Saved to gemstones_ai_v6 in ${saveTime}ms`);

    // Update gemstone flags
    const flagUpdateStart = Date.now();
    const { error: flagError } = await supabase
      .from("gemstones")
      .update({
        ai_text_generated_v6: true,
        ai_text_generated_v6_date: new Date().toISOString(),
      })
      .eq("id", id);

    if (flagError) {
      console.warn(`⚠️ [AI Generation] [${requestId}] Failed to update flags:`, flagError);
    } else {
      const flagUpdateTime = Date.now() - flagUpdateStart;
      console.log(`✅ [AI Generation] [${requestId}] Updated gemstone flags in ${flagUpdateTime}ms`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ [AI Generation] [${requestId}] Saved successfully. Total time: ${totalTime}ms`);
    console.log(`📊 [AI Generation] [${requestId}] Performance breakdown:`, {
      image_download: imageDownloadTime,
      openai_call: openaiCallTime,
      database_save: saveTime,
      total: totalTime,
    });

    return NextResponse.json({
      success: true,
      data: {
        confidence: generatedContent.confidence,
        processingTime,
        cost,
        usedImages: hasImages,
        numImages: base64Images.length,
      },
    });
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`❌ [AI Generation] [${requestId}] Error after ${errorTime}ms:`, error);
    if (error instanceof Error) {
      console.error(`❌ [AI Generation] [${requestId}] Error message:`, error.message);
      console.error(`❌ [AI Generation] [${requestId}] Error stack:`, error.stack);
    }
    if (error && typeof error === 'object' && 'response' in error) {
      console.error(`❌ [AI Generation] [${requestId}] OpenAI API error:`, JSON.stringify((error as any).response, null, 2));
    }
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "AI generation failed",
        requestId,
        timeElapsed: errorTime,
      },
      { status: 500 }
    );
  }
}

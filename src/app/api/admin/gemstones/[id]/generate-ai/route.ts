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
async function downloadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  } catch {
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
  
  try {
    const { id } = await params;
    const supabase = getAdminClient();

    console.log(`🤖 [AI Generation] Starting for gemstone: ${id}`);

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
      console.error(`❌ [AI Generation] Failed to fetch gemstone:`, gemError);
      return NextResponse.json(
        { error: "Gemstone not found" },
        { status: 404 }
      );
    }

    // Fetch images
    const { data: images } = await supabase
      .from("gemstone_images")
      .select("id, image_url, image_order, is_primary")
      .eq("gemstone_id", id)
      .order("is_primary", { ascending: false, nullsFirst: false })
      .order("image_order", { ascending: true })
      .limit(5);

    const imageUrls = images?.map((m) => m.image_url).filter(Boolean) || [];
    console.log(`📷 [AI Generation] Found ${imageUrls.length} images`);

    // Download images as base64 (limit to 3 for efficiency)
    const base64Images: string[] = [];
    for (const url of imageUrls.slice(0, 3)) {
      const base64 = await downloadImageAsBase64(url);
      if (base64) base64Images.push(base64);
    }
    console.log(`📷 [AI Generation] Downloaded ${base64Images.length} images`);

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

    const metadataText = formatMetadata(metadata);

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
    console.log(`🤖 [AI Generation] Calling OpenAI with model: ${DEFAULT_MODEL}`);
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

    const generatedContent = JSON.parse(
      response.choices[0].message.content || "{}"
    );

    const processingTime = Date.now() - startTime;
    const cost = calculateCost(response.usage, DEFAULT_MODEL);

    console.log(`✅ [AI Generation] Completed in ${processingTime}ms, cost: $${cost.toFixed(4)}`);

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

    const { error: upsertError } = await supabase
      .from("gemstones_ai_v6")
      .upsert(aiRecord, { onConflict: "gemstone_id" });

    if (upsertError) {
      console.error(`❌ [AI Generation] Failed to save:`, upsertError);
      return NextResponse.json(
        { error: "Failed to save AI content" },
        { status: 500 }
      );
    }

    // Update gemstone flags
    await supabase
      .from("gemstones")
      .update({
        ai_text_generated_v6: true,
        ai_text_generated_v6_date: new Date().toISOString(),
      })
      .eq("id", id);

    console.log(`✅ [AI Generation] Saved successfully`);

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
    console.error(`❌ [AI Generation] Error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI generation failed" },
      { status: 500 }
    );
  }
}

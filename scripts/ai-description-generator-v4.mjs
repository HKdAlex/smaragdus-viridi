#!/usr/bin/env node

import {
  calculateActualCost,
  getModelConfig,
} from "./ai-analysis/model-config.mjs";

import OpenAI from "openai";
import { buildDescriptionPrompt } from "./ai-analysis/prompts-v4.mjs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const DESCRIPTION_MODEL = process.env.OPENAI_DESCRIPTION_MODEL || "gpt-5-mini";
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  throw new Error("OPENAI_API_KEY is required");
}
const openai = new OpenAI({ apiKey: openaiKey });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase configuration missing (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)"
  );
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateDescriptions(gemstone, analysisData) {
  console.log(
    `\n📝 Generating descriptions for: ${gemstone.serial_number || gemstone.id}`
  );

  // Use buildDescriptionPrompt helper - it intelligently uses AI data or manual data
  const prompt = buildDescriptionPrompt(gemstone, analysisData);

  try {
    const startTime = Date.now();

    const response = await openai.chat.completions.create({
      model: DESCRIPTION_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a master gemologist and storyteller. Output ONLY valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: getModelConfig(DESCRIPTION_MODEL).max_tokens,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const processingTime = Date.now() - startTime;
    const cost = calculateActualCost(
      DESCRIPTION_MODEL,
      response.usage?.prompt_tokens,
      response.usage?.completion_tokens
    );

    console.log(
      `  ✅ Generated in ${processingTime}ms, cost: $${cost.toFixed(4)}`
    );

    const result = JSON.parse(response.choices[0].message.content);
    const required = [
      "technical_ru",
      "technical_en",
      "emotional_ru",
      "emotional_en",
      "narrative_ru",
      "narrative_en",
    ];

    const missing = required.filter((field) => !result.descriptions?.[field]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required description fields: ${missing.join(", ")}`
      );
    }

    await saveDescriptions(gemstone.id, result, cost);

    return { success: true, cost, processingTime };
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function saveDescriptions(gemstoneId, descriptionData, cost) {
  const timestamp = new Date().toISOString();

  const updateResult = await supabase
    .from("gemstones")
    .update({
      description_technical_ru: descriptionData.descriptions.technical_ru,
      description_technical_en: descriptionData.descriptions.technical_en,
      description_emotional_ru: descriptionData.descriptions.emotional_ru,
      description_emotional_en: descriptionData.descriptions.emotional_en,
      narrative_story_ru: descriptionData.descriptions.narrative_ru,
      narrative_story_en: descriptionData.descriptions.narrative_en,
      ai_description_model: DESCRIPTION_MODEL,
      ai_description_date: timestamp,
      ai_description_cost_usd: cost,
    })
    .eq("id", gemstoneId)
    .select("id")
    .single();

  if (updateResult.error) {
    throw new Error(
      `Failed to save descriptions: ${updateResult.error.message}`
    );
  }

  const insertResult = await supabase.from("ai_analysis_results").insert({
    gemstone_id: gemstoneId,
    analysis_type: "description_generation_v4",
    description_data: descriptionData,
    processing_cost_usd: cost,
    ai_model_version: DESCRIPTION_MODEL,
    created_at: timestamp,
  });

  if (insertResult.error) {
    console.warn(
      `⚠️ Failed to log description data: ${insertResult.error.message}`
    );
  }

  console.log("  💾 Saved descriptions to database");
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 5;

  console.log(`🚀 AI Description Generator v4.0`);
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🤖 Using model: ${DESCRIPTION_MODEL}`);
  console.log(`🎯 Processing ${limit} gemstones\n`);

  const { data: gemstones, error } = await supabase
    .from("gemstones")
    .select(
      `
      *,
      ai_analysis_results (
        extracted_data,
        confidence_score,
        overall_metrics
      )
    `
    )
    .eq("ai_analyzed", true)
    .is("description_technical_ru", null)
    .limit(limit);

  if (error) {
    console.error(`❌ Failed to fetch gemstones: ${error.message}`);
    process.exit(1);
  }

  console.log(
    `📊 Found ${gemstones.length} gemstones ready for descriptions\n`
  );

  let totalCost = 0;
  let successful = 0;

  for (const gemstone of gemstones) {
    // Extract analysis data if available (may be array, take first/latest)
    const analysisData = Array.isArray(gemstone.ai_analysis_results)
      ? gemstone.ai_analysis_results[0]
      : gemstone.ai_analysis_results;

    const result = await generateDescriptions(gemstone, analysisData);
    if (result.success) {
      successful += 1;
      totalCost += result.cost;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🎉 Description Generation Complete!`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`💰 Total Cost: $${totalCost.toFixed(4)}`);
  console.log(
    `📈 Avg Cost per Gemstone: $${
      successful ? (totalCost / successful).toFixed(4) : 0
    }`
  );
}

main().catch((error) => {
  console.error(`❌ Fatal error: ${error.message}`);
  process.exit(1);
});

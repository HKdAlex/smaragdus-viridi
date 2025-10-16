/**
 * Test different OpenAI models to see which ones properly support structured outputs
 * Tests: GPT-4o, GPT-4o-mini, GPT-5, GPT-5-mini, GPT-5-nano
 */

import "dotenv/config";

import { GEMSTONE_ANALYSIS_SCHEMA_SIMPLE } from "./ai-analysis/json-schema-simple.mjs";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Models to test
const MODELS_TO_TEST = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
];

// Simple test prompt
const TEST_PROMPT = `Analyze this gemstone description: "A 2.5 carat octagonal emerald cut tanzanite, measuring 10mm x 8mm x 6mm, with vivid violet-blue color and eye-clean clarity."

Provide a structured response following this format:
{
  "primary_image": { "index": 1, "score": 90, "reasoning": "Best image" },
  "aggregated_data": {
    "shape_cut": "octagonal / emerald cut",
    "color": "vivid violet-blue",
    "clarity_observations": "eye-clean",
    "weight_ct": 2.5,
    "length_mm": 10,
    "width_mm": 8,
    "depth_mm": 6,
    "overall_confidence": 0.95
  }
}`;

async function testModel(modelName) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🧪 Testing: ${modelName}`);
  console.log("=".repeat(60));

  try {
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content:
            "You are a gemstone analysis expert. Provide structured JSON responses.",
        },
        {
          role: "user",
          content: TEST_PROMPT,
        },
      ],
      max_completion_tokens: 500,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "gemstone_analysis",
          schema: GEMSTONE_ANALYSIS_SCHEMA_SIMPLE,
          strict: false, // Non-strict mode
        },
      },
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);

    console.log("\n✅ SUCCESS!");
    console.log(`📊 Response length: ${content.length} chars`);
    console.log(
      `💰 Cost: ${response.usage.prompt_tokens}p + ${response.usage.completion_tokens}c tokens`
    );

    // Check what fields we got
    const hasAggregatedData = !!parsed.aggregated_data;
    const hasPrimaryImage = !!parsed.primary_image;

    console.log(`\n📋 Structure Check:`);
    console.log(`   primary_image: ${hasPrimaryImage ? "✅" : "❌"}`);
    console.log(`   aggregated_data: ${hasAggregatedData ? "✅" : "❌"}`);

    if (hasAggregatedData) {
      const aggFields = Object.keys(parsed.aggregated_data);
      console.log(`   aggregated_data fields: ${aggFields.length}/8`);
      console.log(`   Fields: ${aggFields.join(", ")}`);

      // Check specific required fields
      const requiredFields = [
        "shape_cut",
        "color",
        "clarity_observations",
        "weight_ct",
        "overall_confidence",
      ];
      const missingRequired = requiredFields.filter(
        (f) => !aggFields.includes(f)
      );

      if (missingRequired.length === 0) {
        console.log(`   ✅ All required fields present!`);
      } else {
        console.log(`   ⚠️  Missing required: ${missingRequired.join(", ")}`);
      }

      // Check optional fields
      const optionalFields = ["length_mm", "width_mm", "depth_mm"];
      const presentOptional = optionalFields.filter((f) =>
        aggFields.includes(f)
      );
      console.log(
        `   📏 Optional dimensions: ${
          presentOptional.length
        }/3 (${presentOptional.join(", ")})`
      );
    } else {
      console.log(`   ❌ NO aggregated_data - schema ignored!`);
    }

    console.log(`\n📦 Sample of response:`);
    console.log(JSON.stringify(parsed, null, 2).substring(0, 500) + "...");

    return {
      model: modelName,
      success: true,
      hasAggregatedData,
      hasPrimaryImage,
      fieldCount: hasAggregatedData
        ? Object.keys(parsed.aggregated_data).length
        : 0,
    };
  } catch (error) {
    console.log(`\n❌ FAILED: ${error.message}`);

    return {
      model: modelName,
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log("🔬 STRUCTURED OUTPUT MODEL COMPARISON TEST");
  console.log("============================================================");
  console.log("Testing which models properly return aggregated_data");
  console.log("Schema: Simple flat structure with required + optional fields");
  console.log("Mode: strict=false (non-strict)");
  console.log("============================================================");

  const results = [];

  for (const model of MODELS_TO_TEST) {
    const result = await testModel(model);
    results.push(result);

    // Wait a bit between tests to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Summary
  console.log(`\n\n${"=".repeat(60)}`);
  console.log("📊 SUMMARY - Which models work with structured outputs?");
  console.log("=".repeat(60));

  console.log(`\n| Model | Success | Has aggregated_data | Fields |`);
  console.log(`|-------|---------|---------------------|--------|`);

  for (const result of results) {
    if (result.success) {
      const successIcon = result.hasAggregatedData ? "✅" : "❌";
      const fields = result.hasAggregatedData
        ? `${result.fieldCount}/8`
        : "N/A";
      console.log(
        `| ${result.model.padEnd(
          13
        )} | ✅      | ${successIcon}                 | ${fields.padEnd(6)} |`
      );
    } else {
      console.log(
        `| ${result.model.padEnd(
          13
        )} | ❌      | N/A                 | N/A    |`
      );
    }
  }

  // Recommendation
  const workingModels = results.filter((r) => r.success && r.hasAggregatedData);

  console.log(`\n${"=".repeat(60)}`);
  if (workingModels.length > 0) {
    console.log(`🎉 WORKING MODELS (${workingModels.length}):`);
    for (const model of workingModels) {
      console.log(`   ✅ ${model.model} - ${model.fieldCount}/8 fields`);
    }

    console.log(`\n💡 RECOMMENDATION:`);
    const bestModel = workingModels.sort(
      (a, b) => b.fieldCount - a.fieldCount
    )[0];
    console.log(`   Use: ${bestModel.model}`);
    console.log(`   Reason: Best field coverage (${bestModel.fieldCount}/8)`);
  } else {
    console.log(`❌ NO MODELS WORKING WITH STRUCTURED OUTPUTS!`);
    console.log(`\n💡 NEXT STEPS:`);
    console.log(`   1. Structured outputs may not work for vision models`);
    console.log(`   2. Consider using regular JSON mode without schema`);
    console.log(`   3. Build robust parser for model's natural output format`);
  }
  console.log("=".repeat(60));
}

main().catch(console.error);

#!/usr/bin/env node

/**
 * Test script for AI Text Generation v6
 * Tests text generation on a small batch of gemstones
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { generateTextBatch } from "./ai-analysis-v6/pipeline.mjs";

// Validate environment
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
];

const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingVars.join(", ")}`
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Fetch diverse sample of gemstones for testing
 * @param {number} count - Number of gemstones to fetch
 * @returns {Promise<Array>} Array of gemstone records
 */
async function fetchTestGemstones(count = 3) {
  console.log(`\n🔍 Fetching ${count} diverse gemstones for testing...`);

  // Get gemstones that haven't been processed yet, with variety
  const { data, error } = await supabase
    .from("gemstones")
    .select(
      `
      id,
      serial_number,
      name,
      weight_carats,
      color,
      origin_id,
      origins!gemstones_origin_id_fkey (name)
    `
    )
    .eq("ai_text_generated_v6", false)
    .order("weight_carats", { ascending: false })
    .limit(count * 3); // Fetch more to allow diversity selection

  if (error) {
    throw new Error(`Failed to fetch gemstones: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No gemstones found for testing");
  }

  // Select diverse sample (different types if possible)
  const diverse = [];
  const seenTypes = new Set();

  for (const gem of data) {
    if (diverse.length >= count) break;

    // Prefer gems of different types
    if (!seenTypes.has(gem.name) || diverse.length < count) {
      diverse.push(gem);
      seenTypes.add(gem.name);
    }
  }

  console.log("✓ Selected gemstones:");
  diverse.forEach((g, i) => {
    console.log(
      `  ${i + 1}. ${g.name} (${g.serial_number}) - ${g.weight_carats}ct - ${
        g.origins?.name || "Unknown origin"
      }`
    );
  });

  return diverse;
}

/**
 * Display generated content in a readable format
 * @param {Object} result - Generation result
 */
function displayGeneratedContent(result) {
  if (!result.success) {
    console.log(`\n❌ FAILED: ${result.error}`);
    return;
  }

  const { gemstone, generation, content } = result;

  console.log("\n" + "=".repeat(80));
  console.log(`GEMSTONE: ${gemstone.name} (${gemstone.serial_number})`);
  console.log("=".repeat(80));
  console.log(`Confidence: ${generation.confidence.toFixed(3)}`);
  console.log(
    `Used images: ${
      generation.used_images
        ? `Yes (${generation.num_images})`
        : "No (metadata only)"
    }`
  );
  console.log(`Cost: $${generation.cost_usd.toFixed(4)}`);
  console.log(`Time: ${(generation.time_ms / 1000).toFixed(1)}s`);
  console.log("-".repeat(80));

  console.log("\n📝 TECHNICAL DESCRIPTION (EN):");
  console.log(content.technical_description.en);

  console.log("\n💎 EMOTIONAL DESCRIPTION (EN):");
  console.log(content.emotional_description.en);

  console.log("\n📖 NARRATIVE STORY (EN):");
  console.log(content.narrative_story.en);

  console.log("\n🏛️  HISTORICAL CONTEXT (EN):");
  console.log(content.historical_context.en);

  console.log("\n🧼 CARE INSTRUCTIONS (EN):");
  console.log(content.care_instructions.en);

  console.log("\n⭐ MARKETING HIGHLIGHTS:");
  content.marketing_highlights.forEach((h, i) => {
    console.log(`  ${i + 1}. ${h}`);
  });

  console.log("\n🎁 PROMOTIONAL TEXT:");
  console.log(content.promotional_text);

  console.log("\n🔍 AI REASONING:");
  console.log(content.reasoning);

  console.log("\n" + "=".repeat(80) + "\n");
}

/**
 * Save results to log file
 * @param {Object} batchResult - Batch generation results
 * @param {Array} gemstones - Gemstone records
 */
function saveResultsToLog(batchResult, gemstones) {
  const logPath = "test-text-generation-v6.log";
  const timestamp = new Date().toISOString();

  let logContent = `
TEXT GENERATION V6 TEST RESULTS
Generated: ${timestamp}
${"=".repeat(80)}

SUMMARY:
- Total gemstones: ${batchResult.total}
- Successful: ${batchResult.successful}
- Failed: ${batchResult.failed}
- Total cost: $${batchResult.total_cost_usd.toFixed(4)}
- Total time: ${batchResult.total_time_sec.toFixed(1)}s
- Avg confidence: ${batchResult.avg_confidence.toFixed(3)}

${"=".repeat(80)}

DETAILED RESULTS:
`;

  batchResult.results.forEach((result, i) => {
    const gem = gemstones[i];
    logContent += `\n${"=".repeat(80)}\n`;
    logContent += `GEMSTONE ${i + 1}: ${gem.name} (${gem.serial_number})\n`;
    logContent += `${"=".repeat(80)}\n`;

    if (!result.success) {
      logContent += `STATUS: FAILED\nERROR: ${result.error}\n`;
      return;
    }

    const { generation, content } = result;
    logContent += `
STATUS: SUCCESS
Confidence: ${generation.confidence.toFixed(3)}
Used images: ${generation.used_images ? `Yes (${generation.num_images})` : "No"}
Cost: $${generation.cost_usd.toFixed(4)}
Time: ${(generation.time_ms / 1000).toFixed(1)}s

TECHNICAL DESCRIPTION (EN):
${content.technical_description.en}

TECHNICAL DESCRIPTION (RU):
${content.technical_description.ru}

EMOTIONAL DESCRIPTION (EN):
${content.emotional_description.en}

EMOTIONAL DESCRIPTION (RU):
${content.emotional_description.ru}

NARRATIVE STORY (EN):
${content.narrative_story.en}

NARRATIVE STORY (RU):
${content.narrative_story.ru}

HISTORICAL CONTEXT (EN):
${content.historical_context.en}

HISTORICAL CONTEXT (RU):
${content.historical_context.ru}

CARE INSTRUCTIONS (EN):
${content.care_instructions.en}

CARE INSTRUCTIONS (RU):
${content.care_instructions.ru}

MARKETING HIGHLIGHTS:
${content.marketing_highlights.map((h, i) => `${i + 1}. ${h}`).join("\n")}

PROMOTIONAL TEXT:
${content.promotional_text}

AI REASONING:
${content.reasoning}

`;
  });

  fs.writeFileSync(logPath, logContent);
  console.log(`\n📄 Full results saved to: ${logPath}\n`);
}

/**
 * Main test execution
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const countArg = args.find((arg) => arg.startsWith("--count="));
    const count = countArg ? parseInt(countArg.split("=")[1]) : 3;

    console.log("\n" + "=".repeat(80));
    console.log("AI TEXT GENERATION V6 - TEST RUN");
    console.log("=".repeat(80));

    // Fetch test gemstones
    const gemstones = await fetchTestGemstones(count);

    // Generate text for all gemstones
    const gemstoneIds = gemstones.map((g) => g.id);
    const batchResult = await generateTextBatch(gemstoneIds);

    // Display results
    console.log("\n📋 DETAILED GENERATION RESULTS:\n");
    batchResult.results.forEach((result) => {
      displayGeneratedContent(result);
    });

    // Save to log file
    saveResultsToLog(batchResult, gemstones);

    // Evaluation guidance
    console.log("✅ TEST COMPLETE");
    console.log("\n📊 EVALUATION CHECKLIST:");
    console.log("  [ ] Technical descriptions are accurate and professional");
    console.log("  [ ] Emotional descriptions are evocative and engaging");
    console.log("  [ ] Stories are compelling and believable");
    console.log("  [ ] Historical context is educational and relevant");
    console.log("  [ ] Care instructions are practical and clear");
    console.log("  [ ] Marketing highlights are concise and compelling");
    console.log("  [ ] Promotional text suggests appropriate occasions");
    console.log("  [ ] Bilingual content maintains consistency (EN/RU)");
    console.log("  [ ] No hallucinated technical specifications");
    console.log("  [ ] Confidence scores are reasonable (≥0.8 preferred)");
    console.log("\nReview the full log file for detailed content analysis.\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

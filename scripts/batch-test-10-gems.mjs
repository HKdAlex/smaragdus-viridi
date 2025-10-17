#!/usr/bin/env node
/**
 * Batch process 10 gemstones for AI v6 text generation
 */

import { generateTextForGemstone } from "./ai-analysis-v6/pipeline.mjs";

const gemstoneIds = [
  "c8ac7c5d-8f05-4eb5-b1d5-257fdb21d108", // agate 1.42ct
  "33895fc9-a3f5-4a67-aa08-157a869dbc51", // emerald 1.04ct
  "dd55657a-651c-435f-9576-a8a72300f72f", // emerald 1.29ct
  "d3d715a9-88c9-4dad-b746-ba64afa8c72d", // emerald 0.40ct
  "48edaac6-5db6-4448-aa04-3183bf8427d1", // emerald 0.27ct
  "a46a0c3b-a97d-4dea-8735-3088484eb8ef", // emerald 0.30ct
  "89c9e7cd-0425-49ea-94d7-cfc738c9bb53", // emerald 0.27ct
  "62c0fc25-9189-4ccc-abaa-6f6634e41a57", // emerald 0.56ct
  "df57fa9f-9f58-4f03-806c-4383bdc6df27", // emerald 0.64ct
  "baa18cdf-a227-45be-b9b9-10d2dd7d27e9", // emerald 0.35ct
];

console.log("=".repeat(80));
console.log("AI TEXT GENERATION V6 - BATCH TEST (10 GEMSTONES)");
console.log("=".repeat(80));
console.log(`\nProcessing ${gemstoneIds.length} gemstones...\n`);

const results = [];
let successCount = 0;
let failureCount = 0;
let totalCost = 0;
let totalTime = 0;

for (let i = 0; i < gemstoneIds.length; i++) {
  const gemstoneId = gemstoneIds[i];
  console.log(`\n[${i + 1}/${gemstoneIds.length}] Processing: ${gemstoneId}`);
  console.log("-".repeat(80));

  try {
    const startTime = Date.now();
    const result = await generateTextForGemstone(gemstoneId, {
      model: process.env.OPENAI_DESCRIPTION_MODEL || "gpt-4o-mini",
    });

    const elapsed = Date.now() - startTime;

    if (result.success) {
      successCount++;
      totalCost += result.generation.cost_usd || 0;
      totalTime += elapsed;

      console.log(
        `✅ SUCCESS - ${result.gemstone.name} (${result.gemstone.serial_number})`
      );
      console.log(`   Confidence: ${result.generation.confidence.toFixed(2)}`);
      console.log(`   Cost: $${(result.generation.cost_usd || 0).toFixed(4)}`);
      console.log(`   Time: ${(elapsed / 1000).toFixed(1)}s`);

      results.push({
        id: gemstoneId,
        name: result.gemstone.name,
        serial_number: result.gemstone.serial_number,
        success: true,
        confidence: result.generation.confidence,
        cost: result.generation.cost_usd,
        time: elapsed,
      });
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    failureCount++;
    console.error(`❌ FAILED: ${error.message}`);

    results.push({
      id: gemstoneId,
      success: false,
      error: error.message,
    });
  }
}

console.log("\n" + "=".repeat(80));
console.log("BATCH PROCESSING COMPLETE");
console.log("=".repeat(80));
console.log(`\n✅ Successful: ${successCount}/${gemstoneIds.length}`);
console.log(`❌ Failed: ${failureCount}/${gemstoneIds.length}`);

if (successCount > 0) {
  console.log(`\n💰 Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`💰 Average Cost: $${(totalCost / successCount).toFixed(4)}`);
  console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(1)}s`);
  console.log(
    `⏱️  Average Time: ${(totalTime / successCount / 1000).toFixed(1)}s`
  );

  const avgConfidence =
    results
      .filter((r) => r.success && r.confidence)
      .reduce((sum, r) => sum + r.confidence, 0) / successCount;
  console.log(`📊 Average Confidence: ${avgConfidence.toFixed(2)}`);
}

console.log("\n" + "=".repeat(80));
console.log("GEMSTONE LINKS");
console.log("=".repeat(80));
console.log("\nYou can view the results at:");
results.forEach((r, i) => {
  if (r.success) {
    console.log(`${i + 1}. http://localhost:3000/en/catalog/${r.id}`);
    console.log(`   ${r.name} - ${r.serial_number}`);
  }
});
console.log("\n");



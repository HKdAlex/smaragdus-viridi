#!/usr/bin/env node
/**
 * Batch process 10 gemstones WITH IMAGES for AI v6 text generation
 * This will test: cut detection, color detection, and primary image selection
 */

import { generateTextForGemstone } from "./ai-analysis-v6/pipeline.mjs";

const gemstoneIds = [
  "bc22729e-b621-4299-a4bb-69a60ff06357", // emerald 2.56ct (18 images)
  "1d5a748c-5d29-4d63-86ec-c529fbe6e0fa", // citrine 2.70ct (15 images)
  "9d6045a0-5696-4f92-bbde-3a45b91a8b1a", // apatite 1.09ct (15 images)
  "a05dec50-4210-4581-a6dd-9e65f2356f98", // apatite 0.92ct (15 images)
  "130b9f04-7bb1-41ef-8224-9450a2c00545", // sapphire 7.14ct (15 images)
  "34163c7f-b85d-4484-84ca-c5a5455dd50d", // quartz 8.90ct (15 images)
  "d45e1f46-edd9-47d1-beb5-f399ebec9c30", // emerald 1.33ct (15 images)
  "5a56b19c-dfb0-4fa4-ab34-6a99c782f9ec", // emerald 2.25ct (15 images)
  "b20562df-99ab-4070-a877-64b709f8eeb9", // garnet 1.47ct (15 images)
  "1ba06f16-a8b4-4a96-91cf-f89c60ec0ef5", // garnet 1.12ct (15 images)
];

console.log("=".repeat(80));
console.log("AI TEXT GENERATION V6 - BATCH TEST WITH IMAGES");
console.log("=".repeat(80));
console.log(`\nProcessing ${gemstoneIds.length} gemstones (with image analysis)...\n`);

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

      console.log(`✅ SUCCESS - ${result.gemstone.name} (${result.gemstone.serial_number})`);
      console.log(`   Confidence: ${result.generation.confidence.toFixed(2)}`);
      console.log(`   Cost: $${(result.generation.cost_usd || 0).toFixed(4)}`);
      console.log(`   Time: ${(elapsed / 1000).toFixed(1)}s`);

      // Show image analysis results
      if (result.imageAnalysis) {
        if (result.imageAnalysis.cutDetection) {
          console.log(`   Cut: ${result.imageAnalysis.cutDetection.detected_cut} (confidence: ${result.imageAnalysis.cutDetection.confidence.toFixed(2)})`);
        }
        if (result.imageAnalysis.colorDetection) {
          console.log(`   Color: ${result.imageAnalysis.colorDetection.detected_color} (confidence: ${result.imageAnalysis.colorDetection.confidence.toFixed(2)})`);
        }
        if (result.imageAnalysis.primaryImageSelection) {
          console.log(`   Primary Image: #${result.imageAnalysis.primaryImageSelection.selected_index} (score: ${result.imageAnalysis.primaryImageSelection.quality_score.toFixed(2)})`);
        }
      }

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
  console.log(`⏱️  Average Time: ${(totalTime / successCount / 1000).toFixed(1)}s`);

  const avgConfidence =
    results
      .filter((r) => r.success && r.confidence)
      .reduce((sum, r) => sum + r.confidence, 0) / successCount;
  console.log(`📊 Average Confidence: ${avgConfidence.toFixed(2)}`);
}

console.log("\n" + "=".repeat(80));
console.log("GEMSTONE LINKS (EN)");
console.log("=".repeat(80));
console.log("\nEnglish version:");
results.forEach((r, i) => {
  if (r.success) {
    console.log(`${i + 1}. http://localhost:3000/en/catalog/${r.id}`);
  }
});

console.log("\n" + "=".repeat(80));
console.log("GEMSTONE LINKS (RU)");
console.log("=".repeat(80));
console.log("\nRussian version:");
results.forEach((r, i) => {
  if (r.success) {
    console.log(`${i + 1}. http://localhost:3000/ru/catalog/${r.id}`);
  }
});

console.log("\n");



#!/usr/bin/env node
/**
 * Test text generation for a single specific gemstone
 */

import { generateTextForGemstone } from "./ai-analysis-v6/pipeline.mjs";

const gemstoneId = process.argv[2] || "11b90b26-b4c0-406f-b614-0332779ebded";

console.log("=".repeat(80));
console.log("AI TEXT GENERATION V6 - SINGLE GEMSTONE TEST");
console.log("=".repeat(80));
console.log(`\nTesting gemstone: ${gemstoneId}\n`);

try {
  const result = await generateTextForGemstone(gemstoneId, {
    model: process.env.V6_TEXT_MODEL || "gpt-5-mini",
  });

  if (result.success) {
    console.log("\n✅ SUCCESS!");
    console.log("\n" + "=".repeat(80));
    console.log("RESULTS SUMMARY");
    console.log("=".repeat(80));
    console.log(
      `Gemstone: ${result.gemstone.name} (${result.gemstone.serial_number})`
    );
    console.log(`Confidence: ${result.generation.confidence.toFixed(2)}`);
    console.log(`Used images: ${result.generation.used_images ? "Yes" : "No"}`);
    console.log(`Images analyzed: ${result.generation.num_images}`);
    console.log(`Cost: $${result.generation.cost_usd.toFixed(4)}`);
    console.log(`Time: ${(result.generation.time_ms / 1000).toFixed(1)}s`);

    if (result.imageAnalysis) {
      console.log("\n" + "-".repeat(80));
      console.log("IMAGE ANALYSIS");
      console.log("-".repeat(80));
      console.log(
        `Detected cut: ${result.imageAnalysis.cut_detected || "N/A"}`
      );
      console.log(
        `Matches metadata: ${
          result.imageAnalysis.cut_matches !== null
            ? result.imageAnalysis.cut_matches
              ? "✅ Yes"
              : "⚠️ No"
            : "N/A"
        }`
      );
      console.log(
        `Primary image index: ${
          result.imageAnalysis.primary_image_index !== null
            ? result.imageAnalysis.primary_image_index
            : "N/A"
        }`
      );
    }

    console.log("\n" + "-".repeat(80));
    console.log("GENERATED CONTENT PREVIEW");
    console.log("-".repeat(80));
    console.log("\nTechnical Description (EN):");
    console.log(
      result.content.technical_description.en.substring(0, 200) + "..."
    );
    console.log("\nMarketing Highlights:");
    result.content.marketing_highlights.forEach((h, i) => {
      console.log(`  ${i + 1}. ${h}`);
    });
    console.log("\n" + "=".repeat(80));
  } else {
    console.log(`\n❌ FAILED: ${result.error}`);
  }
} catch (error) {
  console.error(`\n❌ ERROR: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Full Batch Processing: Process ALL unprocessed gemstones with AI v6 text generation
 *
 * This script processes all gemstones that:
 * - Have at least one image
 * - Have price > 0
 * - Have ai_text_generated_v6 = false
 */

import { createClient } from "@supabase/supabase-js";
import { generateTextForGemstone } from "./ai-analysis-v6/pipeline.mjs";

const CONCURRENCY = 10;
const BATCH_DELAY_MS = 2000;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// FETCH ALL UNPROCESSED GEMSTONES
// ============================================================================

async function getAllUnprocessedGemstones() {
  console.log("🔍 Fetching all unprocessed gemstones...");

  // Query gemstones directly with images and price filters
  const { data, error } = await supabase
    .from("gemstones")
    .select(
      `
      id, 
      serial_number, 
      name, 
      quantity, 
      weight_carats, 
      price_amount, 
      ai_text_generated_v6,
      gemstone_images!inner(gemstone_id)
    `
    )
    .eq("ai_text_generated_v6", false)
    .gt("price_amount", 0)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Database error:", error);
    throw error;
  }

  console.log(`   Found ${data?.length || 0} unprocessed gemstones`);

  return data || [];
}

// ============================================================================
// PROCESS SINGLE GEMSTONE
// ============================================================================

async function processGemstone(gem, index, total) {
  try {
    const startTime = Date.now();
    const result = await generateTextForGemstone(gem.id, {
      model: process.env.OPENAI_DESCRIPTION_MODEL || "gpt-4o-mini",
    });

    const elapsed = Date.now() - startTime;

    if (result.success) {
      console.log(
        `  ✅ [${index}/${total}] ${gem.name} (${
          gem.serial_number
        }) - ${result.generation.confidence.toFixed(
          2
        )} conf, $${result.generation.cost_usd.toFixed(4)}`
      );
      return {
        id: gem.id,
        success: true,
        confidence: result.generation.confidence,
        cost: result.generation.cost_usd,
        time: elapsed,
      };
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    console.error(
      `  ❌ [${index}/${total}] FAILED: ${gem.name} - ${error.message}`
    );
    return { id: gem.id, success: false, error: error.message };
  }
}

// ============================================================================
// PROCESS BATCH
// ============================================================================

async function processBatch(gems, batchNum, totalBatches, stats) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`Batch ${batchNum}/${totalBatches} (${gems.length} gems)`);
  console.log("=".repeat(80));

  const startTime = Date.now();
  const results = await Promise.all(
    gems.map((gem, idx) =>
      processGemstone(gem, (batchNum - 1) * CONCURRENCY + idx + 1, stats.total)
    )
  );

  const elapsed = Date.now() - startTime;
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  stats.successCount += successful.length;
  stats.failureCount += failed.length;
  stats.totalCost += successful.reduce((sum, r) => sum + (r.cost || 0), 0);
  stats.totalTime += elapsed;

  console.log(
    `\n✅ Batch Complete: ${successful.length} succeeded, ${failed.length} failed`
  );
  console.log(`   Time: ${(elapsed / 1000).toFixed(1)}s`);
  console.log(
    `   Cost: $${successful
      .reduce((sum, r) => sum + (r.cost || 0), 0)
      .toFixed(4)}`
  );

  return results;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("=".repeat(80));
  console.log("AI V6 FULL BATCH PROCESSING - ALL UNPROCESSED GEMSTONES");
  console.log("=".repeat(80));

  console.log("\n🔍 Fetching all unprocessed gemstones...");
  const gems = await getAllUnprocessedGemstones();

  if (gems.length === 0) {
    console.log("\n✅ All gemstones have been processed!");
    console.log("No unprocessed gemstones found.");
    return;
  }

  console.log(`\n📊 Found ${gems.length} unprocessed gemstones`);
  console.log(`🚀 Processing with ${CONCURRENCY} concurrent workers`);
  console.log(
    `⏱️  Estimated time: ${((gems.length * 45) / CONCURRENCY / 60).toFixed(
      1
    )} minutes\n`
  );

  const stats = {
    total: gems.length,
    successCount: 0,
    failureCount: 0,
    totalCost: 0,
    totalTime: 0,
    startTime: Date.now(),
  };

  // Split into batches
  const batches = [];
  for (let i = 0; i < gems.length; i += CONCURRENCY) {
    batches.push(gems.slice(i, i + CONCURRENCY));
  }

  console.log(
    `📦 Processing ${batches.length} batches of ${CONCURRENCY} gems each`
  );

  // Process batches
  const allResults = [];
  for (let i = 0; i < batches.length; i++) {
    const results = await processBatch(
      batches[i],
      i + 1,
      batches.length,
      stats
    );
    allResults.push(...results);

    // Show progress every 10 batches
    if ((i + 1) % 10 === 0) {
      const progress = (((i + 1) / batches.length) * 100).toFixed(1);
      const elapsed = (Date.now() - stats.startTime) / 1000 / 60;
      const remaining = (elapsed / (i + 1)) * (batches.length - i - 1);
      console.log(
        `\n📈 Progress: ${progress}% (${i + 1}/${batches.length} batches)`
      );
      console.log(
        `⏱️  Elapsed: ${elapsed.toFixed(1)}min, Remaining: ${remaining.toFixed(
          1
        )}min`
      );
      console.log(`💰 Total Cost So Far: $${stats.totalCost.toFixed(2)}`);
    }

    if (i < batches.length - 1) {
      console.log(
        `⏳ Waiting ${BATCH_DELAY_MS / 1000}s before next batch...\n`
      );
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  // Final summary
  console.log("\n" + "=".repeat(80));
  console.log("PROCESSING COMPLETE");
  console.log("=".repeat(80));
  console.log(`\n✅ Successful: ${stats.successCount}/${stats.total}`);
  console.log(`❌ Failed: ${stats.failureCount}/${stats.total}`);

  if (stats.successCount > 0) {
    console.log(`\n💰 Total Cost: $${stats.totalCost.toFixed(2)}`);
    console.log(
      `💰 Average Cost: $${(stats.totalCost / stats.successCount).toFixed(4)}`
    );
    console.log(
      `⏱️  Total Time: ${(stats.totalTime / 1000 / 60).toFixed(1)} minutes`
    );
    console.log(
      `⏱️  Average Time: ${(
        stats.totalTime /
        stats.successCount /
        1000
      ).toFixed(1)}s per gem`
    );

    const avgConfidence =
      allResults
        .filter((r) => r.success && r.confidence)
        .reduce((sum, r) => sum + r.confidence, 0) / stats.successCount;
    console.log(`📊 Average Confidence: ${avgConfidence.toFixed(2)}`);
  }

  // Success rate check
  const successRate = (stats.successCount / stats.total) * 100;
  console.log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`);

  if (successRate >= 95) {
    console.log("✨ Excellent! All gemstones processed successfully.");
  } else if (successRate >= 90) {
    console.log("⚠️  Good success rate, but some gems failed.");
  } else {
    console.log("🚨 Low success rate - investigate failed gems!");
  }

  // Show failed gems if any
  const failedGems = allResults.filter((r) => !r.success);
  if (failedGems.length > 0) {
    console.log("\n" + "=".repeat(80));
    console.log("FAILED GEMSTONES");
    console.log("=".repeat(80));
    failedGems.forEach((result, i) => {
      const gem = gems.find((g) => g.id === result.id);
      console.log(`${i + 1}. ${gem?.name} (${gem?.serial_number})`);
      console.log(`   Error: ${result.error}`);
    });
  }

  console.log("\n" + "=".repeat(80));
  console.log("VIEW RESULTS");
  console.log("=".repeat(80));
  console.log("\nCatalog: http://localhost:3000/en/catalog");
  console.log("Catalog (RU): http://localhost:3000/ru/catalog");

  console.log("\n✨ Processing complete!\n");

  if (successRate >= 95) {
    console.log(
      "🎉 All gemstones have been successfully processed with AI v6 text!"
    );
  } else {
    console.log("⚠️  Some gemstones failed. Check the failed list above.");
  }
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});

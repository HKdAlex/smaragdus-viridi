#!/usr/bin/env node
/**
 * Test batch: Process 100 gemstones with 10 concurrent workers
 */

import { createClient } from "@supabase/supabase-js";
import { generateTextForGemstone } from "./ai-analysis-v6/pipeline.mjs";

const CONCURRENCY = 10;
const TEST_SIZE = 100;
const BATCH_DELAY_MS = 2000;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// FETCH 100 GEMSTONES TO TEST
// ============================================================================

async function getTestGemstones() {
  // Get ALL gemstones WITH images (paginated fetch to get all ~11k images)
  console.log("   Fetching all gemstone images (paginated)...");
  let allImages = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data: pageData, error: imgError } = await supabase
      .from("gemstone_images")
      .select("gemstone_id")
      .order("gemstone_id")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (imgError) throw imgError;
    if (!pageData || pageData.length === 0) break;

    allImages = allImages.concat(pageData);
    page++;

    if (pageData.length < pageSize) break; // Last page
  }

  console.log(
    `   Fetched ${allImages.length} total images across ${page} pages`
  );

  // Count images per gemstone
  const imageCounts = allImages.reduce((acc, { gemstone_id }) => {
    acc[gemstone_id] = (acc[gemstone_id] || 0) + 1;
    return acc;
  }, {});

  // Get gemstone IDs with 3+ images
  const gemstoneIdsWithImages = Object.entries(imageCounts)
    .filter(([_, count]) => count >= 1)
    .map(([id]) => id);

  console.log(
    `   Found ${gemstoneIdsWithImages.length} gemstones with 1+ images`
  );

  // Get gemstone details for those IDs
  const { data, error } = await supabase
    .from("gemstones")
    .select("id, serial_number, name, quantity, weight_carats, price_amount")
    .in("id", gemstoneIdsWithImages.slice(0, TEST_SIZE * 2))
    .gt("price_amount", 0)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Filter out already processed
  const { data: processedIds } = await supabase
    .from("gemstones_ai_v6")
    .select("gemstone_id");

  const processedSet = new Set((processedIds || []).map((p) => p.gemstone_id));
  return data.filter((g) => !processedSet.has(g.id)).slice(0, TEST_SIZE);
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
  console.log("AI V6 TEST BATCH - 100 GEMSTONES WITH 10 WORKERS");
  console.log("=".repeat(80));

  console.log("\n🔍 Fetching 100 gemstones to test...");
  const gems = await getTestGemstones();

  if (gems.length === 0) {
    console.log("\n⚠️  No unprocessed gemstones found!");
    console.log("All gemstones may already have AI v6 text.");
    return;
  }

  console.log(`\n📊 Found ${gems.length} unprocessed gemstones`);
  console.log(`🚀 Processing with ${CONCURRENCY} concurrent workers`);
  console.log(
    `⏱️  Estimated time: ${((gems.length * 110) / CONCURRENCY / 60).toFixed(
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

    if (i < batches.length - 1) {
      console.log(
        `⏳ Waiting ${BATCH_DELAY_MS / 1000}s before next batch...\n`
      );
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  // Final summary
  console.log("\n" + "=".repeat(80));
  console.log("TEST COMPLETE");
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
    console.log("✨ Excellent! Ready to process full catalog.");
  } else if (successRate >= 90) {
    console.log("⚠️  Good, but check failed gems before full run.");
  } else {
    console.log("🚨 Low success rate - investigate errors before full run!");
  }

  console.log("\n" + "=".repeat(80));
  console.log("VIEW RESULTS");
  console.log("=".repeat(80));
  console.log("\nCatalog: http://localhost:3000/en/catalog");
  console.log("Catalog (RU): http://localhost:3000/ru/catalog");

  console.log("\nSample links (first 5):");
  const successful = allResults.filter((r) => r.success).slice(0, 5);
  successful.forEach((r, i) => {
    const gem = gems.find((g) => g.id === r.id);
    console.log(`${i + 1}. http://localhost:3000/en/catalog/${r.id}`);
    console.log(`   ${gem.name} (${gem.serial_number})`);
  });

  console.log("\n✨ Test complete!\n");

  if (successRate >= 95 && stats.successCount >= 80) {
    console.log("🚀 Everything looks great! Ready to run full batch:");
    console.log(
      "   node -r dotenv/config scripts/batch-process-all-parallel.mjs dotenv_config_path=.env.local\n"
    );
  }
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});

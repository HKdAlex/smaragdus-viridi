#!/usr/bin/env node
/**
 * Parallel AI v6 text generation with 10 concurrent workers
 * Features: Error handling, progress tracking, resumable, cost monitoring
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { generateTextForGemstone } from "./ai-analysis-v6/pipeline.mjs";

const CONCURRENCY = 10; // Number of parallel workers
const BATCH_DELAY_MS = 2000; // Delay between batches (rate limit protection)
const PROGRESS_FILE = ".ai-v6-progress.json";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn("Could not load progress file:", error.message);
  }
  return { completed: [], failed: [], lastBatch: 0 };
}

function saveProgress(progress) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (error) {
    console.warn("Could not save progress:", error.message);
  }
}

// ============================================================================
// FETCH GEMSTONES TO PROCESS
// ============================================================================

async function getGemstonesToProcess() {
  const { data, error } = await supabase
    .from("gemstones")
    .select(
      `
      id,
      serial_number,
      name,
      quantity,
      price_amount
    `
    )
    .gt("price_amount", 0)
    .is("ai_v6_processed", null); // Use a flag if available, or check via LEFT JOIN

  if (error) throw error;

  // Filter out already processed (check gemstones_ai_v6 table)
  const { data: processedIds } = await supabase
    .from("gemstones_ai_v6")
    .select("gemstone_id");

  const processedSet = new Set((processedIds || []).map((p) => p.gemstone_id));

  return data.filter((g) => !processedSet.has(g.id));
}

// ============================================================================
// PROCESS SINGLE GEMSTONE WITH ERROR HANDLING
// ============================================================================

async function processSingleGemstone(gemstone, index, total) {
  const { id, serial_number, name, quantity } = gemstone;

  try {
    const startTime = Date.now();
    const result = await generateTextForGemstone(id, {
      model: process.env.OPENAI_DESCRIPTION_MODEL || "gpt-4o-mini",
    });

    const elapsed = Date.now() - startTime;

    if (result.success) {
      return {
        id,
        serial_number,
        name,
        quantity: quantity || 1,
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
      `  ❌ [${index}/${total}] FAILED: ${name} (${serial_number})`
    );
    console.error(`     Error: ${error.message}`);

    return {
      id,
      serial_number,
      name,
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// PROCESS BATCH (UP TO 10 CONCURRENT)
// ============================================================================

async function processBatch(gemstones, batchNum, totalBatches, progress) {
  console.log(
    `\n${"=".repeat(80)}\nBatch ${batchNum}/${totalBatches} (${
      gemstones.length
    } gemstones)\n${"=".repeat(80)}`
  );

  const startTime = Date.now();

  // Process all gemstones in this batch concurrently
  const results = await Promise.all(
    gemstones.map((gem, idx) =>
      processSingleGemstone(
        gem,
        (batchNum - 1) * CONCURRENCY + idx + 1,
        progress.total
      )
    )
  );

  const elapsed = Date.now() - startTime;
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  // Update progress
  progress.completed.push(...successful.map((r) => r.id));
  progress.failed.push(...failed.map((r) => ({ id: r.id, error: r.error })));
  progress.lastBatch = batchNum;
  progress.successCount += successful.length;
  progress.failureCount += failed.length;
  progress.totalCost += successful.reduce((sum, r) => sum + (r.cost || 0), 0);
  progress.totalTime += elapsed;

  saveProgress(progress);

  // Print batch summary
  console.log(
    `\n✅ Batch Complete: ${successful.length} succeeded, ${failed.length} failed`
  );
  console.log(`   Time: ${(elapsed / 1000).toFixed(1)}s`);
  console.log(
    `   Cost: $${successful
      .reduce((sum, r) => sum + (r.cost || 0), 0)
      .toFixed(4)}`
  );
  console.log(
    `\n📊 Overall Progress: ${progress.successCount + progress.failureCount}/${
      progress.total
    } (${(
      (100 * (progress.successCount + progress.failureCount)) /
      progress.total
    ).toFixed(1)}%)`
  );

  return results;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("=".repeat(80));
  console.log("AI TEXT GENERATION V6 - PARALLEL PROCESSING (10 WORKERS)");
  console.log("=".repeat(80));

  // Load progress
  let progress = loadProgress();

  // Fetch gemstones to process
  console.log("\n🔍 Fetching gemstones to process...");
  const allGemstones = await getGemstonesToProcess();

  // Filter out already completed
  const remainingGemstones = allGemstones.filter(
    (g) => !progress.completed.includes(g.id)
  );

  if (remainingGemstones.length === 0) {
    console.log("\n✅ All gemstones already processed!");
    return;
  }

  console.log(`\n📊 Status:`);
  console.log(`   Total gemstones: ${allGemstones.length}`);
  console.log(`   Already completed: ${progress.completed.length}`);
  console.log(`   Remaining: ${remainingGemstones.length}`);

  // Initialize progress tracking
  if (!progress.total) {
    progress = {
      completed: progress.completed || [],
      failed: progress.failed || [],
      lastBatch: 0,
      total: allGemstones.length,
      successCount: progress.completed.length,
      failureCount: progress.failed.length,
      totalCost: 0,
      totalTime: 0,
      startTime: Date.now(),
    };
    saveProgress(progress);
  }

  // Split into batches
  const batches = [];
  for (let i = 0; i < remainingGemstones.length; i += CONCURRENCY) {
    batches.push(remainingGemstones.slice(i, i + CONCURRENCY));
  }

  console.log(
    `\n🚀 Processing ${batches.length} batches with ${CONCURRENCY} workers each`
  );
  console.log(
    `⏱️  Estimated time: ${(
      (remainingGemstones.length * 110) /
      CONCURRENCY /
      60
    ).toFixed(1)} minutes\n`
  );

  // Process batches
  for (let i = 0; i < batches.length; i++) {
    await processBatch(batches[i], i + 1, batches.length, progress);

    // Delay between batches (rate limit protection)
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
  console.log(`\n✅ Successful: ${progress.successCount}/${progress.total}`);
  console.log(`❌ Failed: ${progress.failureCount}/${progress.total}`);

  if (progress.successCount > 0) {
    console.log(`\n💰 Total Cost: $${progress.totalCost.toFixed(2)}`);
    console.log(
      `💰 Average Cost: $${(progress.totalCost / progress.successCount).toFixed(
        4
      )}`
    );
    console.log(
      `⏱️  Total Time: ${(progress.totalTime / 1000 / 60).toFixed(1)} minutes`
    );
    console.log(
      `⏱️  Average Time: ${(
        progress.totalTime /
        progress.successCount /
        1000
      ).toFixed(1)}s per gemstone`
    );
  }

  if (progress.failureCount > 0) {
    console.log(`\n⚠️  Failed Gemstones (${progress.failureCount}):`);
    progress.failed.forEach((f, i) => {
      console.log(`   ${i + 1}. ${f.id}: ${f.error}`);
    });
  }

  console.log("\n" + "=".repeat(80));
  console.log("VIEW RESULTS");
  console.log("=".repeat(80));
  console.log("\nCatalog: http://localhost:3000/en/catalog");
  console.log("Catalog (RU): http://localhost:3000/ru/catalog");

  // Clean up progress file
  console.log(`\n🗑️  Cleaning up progress file: ${PROGRESS_FILE}`);
  try {
    fs.unlinkSync(PROGRESS_FILE);
  } catch (error) {
    // Ignore
  }

  console.log("\n✨ Done!\n");
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});

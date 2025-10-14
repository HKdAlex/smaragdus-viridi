#!/usr/bin/env node

/**
 * Vision Model Benchmark Script
 * Tests GPT-5, GPT-5-mini, GPT-5-nano, GPT-4o, GPT-4o-mini
 *
 * Compares:
 * - Cost per gemstone
 * - Processing time
 * - OCR accuracy (Russian text)
 * - Measurement extraction
 * - Primary image selection
 * - Overall quality score
 */

import {
  analyzeGemstoneBatch,
  initializeOpenAI,
} from "./ai-analysis/multi-image-processor.mjs";

import { AI_MODELS } from "./ai-analysis/model-config.mjs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test configuration
const TEST_GEMSTONE_IDS = [
  "00e9b38c-fdcc-49cc-b19d-8badd61105bf", // First successful test
];

const MODELS_TO_TEST = [
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-4o",
  "gpt-4o-mini",
];

/**
 * Run analysis with specific model
 */
async function runModelTest(modelName, gemstoneId) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🧪 Testing Model: ${modelName}`);
  console.log(`📊 ${AI_MODELS[modelName].notes}`);
  console.log(`${"=".repeat(60)}\n`);

  // Temporarily override env variable
  const originalModel = process.env.OPENAI_VISION_MODEL;
  process.env.OPENAI_VISION_MODEL = modelName;

  try {
    // Fetch gemstone with images
    const { data: gemstone, error: gemError } = await supabase
      .from("gemstones")
      .select(
        `
        *,
        images:gemstone_images(id, image_url, image_order)
      `
      )
      .eq("id", gemstoneId)
      .single();

    if (gemError || !gemstone) {
      throw new Error(`Failed to fetch gemstone: ${gemError?.message}`);
    }

    const startTime = Date.now();

    // Initialize OpenAI with API key
    initializeOpenAI(process.env.OPENAI_API_KEY);

    // Run analysis with correct parameters: images, gemstoneId, supabase
    const result = await analyzeGemstoneBatch(
      gemstone.images || [],
      gemstoneId,
      supabase
    );

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    // Extract metrics
    return {
      model: modelName,
      success: result.success,
      time_seconds: totalTime,
      cost_usd: result.cost || 0,
      tokens_used:
        result.consolidatedAnalysis?.processing_metadata?.total_tokens || 0,
      images_analyzed: result.imageCount || 0,
      validation_passed: result.validationPassed || false,
      validation_issues: result.validationIssues || [],

      // Quality metrics (if available)
      ocr_accuracy: calculateOCRAccuracy(result.consolidatedAnalysis),
      measurements_found: countMeasurements(result.consolidatedAnalysis),
      primary_image_confidence:
        result.consolidatedAnalysis?.primary_image_selection?.confidence || 0,
      overall_confidence:
        result.consolidatedAnalysis?.overall_metrics?.confidence_score || 0,

      raw_response_length:
        result.consolidatedAnalysis?.raw_ai_response?.length || 0,
    };
  } catch (error) {
    console.error(`  ❌ Error testing ${modelName}: ${error.message}`);
    console.error(
      `  📋 Stack trace:`,
      error.stack?.split("\n").slice(0, 3).join("\n")
    );

    return {
      model: modelName,
      success: false,
      error: error.message,
      time_seconds: 0,
      cost_usd: 0,
      tokens_used: 0,
      images_analyzed: 0,
      validation_passed: false,
      validation_issues: [],
      ocr_accuracy: 0,
      measurements_found: 0,
      primary_image_confidence: 0,
      overall_confidence: 0,
      raw_response_length: 0,
    };
  } finally {
    // Restore original model
    process.env.OPENAI_VISION_MODEL = originalModel;
  }
}

/**
 * Calculate OCR accuracy (simple check for Russian text)
 */
function calculateOCRAccuracy(analysis) {
  if (!analysis?.individual_analyses) return 0;

  let foundRussian = 0;
  let totalOCR = 0;

  for (const imgAnalysis of analysis.individual_analyses) {
    if (imgAnalysis.ocr?.raw_text) {
      totalOCR++;
      // Check if contains Cyrillic characters
      if (/[а-яА-ЯёЁ]/.test(imgAnalysis.ocr.raw_text)) {
        foundRussian++;
      }
    }
  }

  return totalOCR > 0 ? (foundRussian / totalOCR) * 100 : 0;
}

/**
 * Count extracted measurements
 */
function countMeasurements(analysis) {
  if (!analysis?.consolidated_data?.all_gauge_readings) return 0;
  return analysis.consolidated_data.all_gauge_readings.length;
}

/**
 * Generate comparison report
 */
function generateReport(results) {
  console.log(`\n\n${"=".repeat(80)}`);
  console.log(`📊 VISION MODEL BENCHMARK REPORT`);
  console.log(`${"=".repeat(80)}\n`);

  // Sort by cost
  const sorted = results
    .filter((r) => r.success)
    .sort((a, b) => a.cost_usd - b.cost_usd);
  const failed = results.filter((r) => !r.success);

  // Summary table
  console.log(`\n🏆 PERFORMANCE COMPARISON:\n`);
  console.log(
    `| Model         | Time (s) | Cost ($) | Tokens | Quality | Status    |`
  );
  console.log(
    `|---------------|----------|----------|--------|---------|-----------|`
  );

  // Check if we have any successful tests
  if (sorted.length === 0) {
    console.log(
      `\n⚠️  ALL TESTS FAILED - No successful model tests to compare`
    );
    console.log(`\n❌ Failed Tests:\n`);
    for (const r of failed) {
      console.log(`  ${r.model}: ${r.error}`);
    }
    return;
  }

  for (const r of sorted) {
    const quality = r.overall_confidence
      ? `${(r.overall_confidence * 100).toFixed(0)}%`
      : "N/A";
    console.log(
      `| ${r.model.padEnd(13)} | ${r.time_seconds
        .toFixed(1)
        .padStart(8)} | ${r.cost_usd.toFixed(4).padStart(8)} | ${r.tokens_used
        .toString()
        .padStart(6)} | ${quality.padStart(7)} | ✅ Success |`
    );
  }

  for (const r of failed) {
    console.log(
      `| ${r.model.padEnd(13)} | ${"—".padStart(8)} | ${"—".padStart(
        8
      )} | ${"—".padStart(6)} | ${"—".padStart(7)} | ❌ Failed  |`
    );
  }

  // Detailed analysis
  console.log(`\n\n📈 DETAILED METRICS:\n`);

  for (const r of sorted) {
    console.log(`\n${r.model.toUpperCase()}:`);
    console.log(`  ⏱️  Processing Time: ${r.time_seconds.toFixed(2)}s`);
    console.log(`  💰 Cost: $${r.cost_usd.toFixed(4)}`);
    console.log(
      `  🎯 Cost per Image: $${(r.cost_usd / r.images_analyzed).toFixed(4)}`
    );
    console.log(`  📝 Tokens Used: ${r.tokens_used.toLocaleString()}`);
    console.log(`  🔍 OCR Accuracy: ${r.ocr_accuracy.toFixed(1)}%`);
    console.log(`  📏 Measurements Found: ${r.measurements_found}`);
    console.log(
      `  🖼️  Primary Image Confidence: ${(
        r.primary_image_confidence * 100
      ).toFixed(1)}%`
    );
    console.log(
      `  ✅ Validation: ${r.validation_passed ? "PASSED" : "FAILED"}`
    );
    if (r.validation_issues.length > 0) {
      console.log(`  ⚠️  Issues: ${r.validation_issues.join(", ")}`);
    }
    console.log(
      `  📄 Response Length: ${r.raw_response_length.toLocaleString()} chars`
    );
  }

  // Cost projections
  console.log(`\n\n💰 COST PROJECTIONS (1,385 gemstones):\n`);

  for (const r of sorted) {
    const fullCost = r.cost_usd * 1385;
    const savingsVsGPT5 =
      sorted[0].model === "gpt-5"
        ? ((sorted[0].cost_usd * 1385 - fullCost) /
            (sorted[0].cost_usd * 1385)) *
          100
        : 0;

    console.log(
      `  ${r.model}: $${fullCost.toFixed(2)} ${
        savingsVsGPT5 > 0 ? `(${savingsVsGPT5.toFixed(0)}% savings)` : ""
      }`
    );
  }

  // Recommendations
  console.log(`\n\n💡 RECOMMENDATIONS:\n`);

  const cheapest = sorted[0];
  const fastest = sorted.reduce((min, r) =>
    r.time_seconds < min.time_seconds ? r : min
  );
  const bestQuality = sorted.reduce((max, r) =>
    r.overall_confidence > max.overall_confidence ? r : max
  );

  console.log(`  🏆 Best Value: ${cheapest.model} (cheapest)`);
  console.log(
    `  ⚡ Fastest: ${fastest.model} (${fastest.time_seconds.toFixed(1)}s)`
  );
  console.log(
    `  ✨ Best Quality: ${bestQuality.model} (${(
      bestQuality.overall_confidence * 100
    ).toFixed(0)}% confidence)`
  );

  // Calculate quality-to-cost ratio
  const bestRatio = sorted.reduce((best, r) => {
    const ratio = r.overall_confidence / r.cost_usd;
    return ratio > best.overall_confidence / best.cost_usd ? r : best;
  });

  console.log(`  📊 Best Quality/Cost Ratio: ${bestRatio.model}`);

  console.log(`\n${"=".repeat(80)}\n`);
}

/**
 * Main execution
 */
async function main() {
  console.log(`🚀 Vision Model Benchmark Suite`);
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🎯 Testing ${MODELS_TO_TEST.length} models`);
  console.log(`💎 Test gemstone: ${TEST_GEMSTONE_IDS[0]}\n`);

  const results = [];

  for (const model of MODELS_TO_TEST) {
    const result = await runModelTest(model, TEST_GEMSTONE_IDS[0]);
    results.push(result);

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  generateReport(results);
}

main().catch((error) => {
  console.error(`❌ Benchmark failed: ${error.message}`);
  process.exit(1);
});

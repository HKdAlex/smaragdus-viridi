#!/usr/bin/env node

/**
 * 🔍 Multi-Image AI Gemstone Analyzer v3.0
 *
 * Revolutionary multi-image analysis system that processes all images for each
 * gemstone in a single API request, providing comprehensive data consolidation,
 * cross-verification, and significant cost savings.
 *
 * Key Improvements:
 * - 70-80% cost reduction through multi-image batching
 * - Comprehensive data consolidation across all images
 * - Cross-verification for accuracy using OpenAI o3 model
 * - Intelligent primary image selection
 * - Modular, maintainable codebase
 *
 * @author Smaragdus Viridi Team
 * @version 3.0.0
 * @date 2025-01-19
 */

import {
  MultiImageAnalysisStats,
  generateAnalysisReport,
} from "./ai-analysis/statistics.mjs";
import {
  analyzeGemstoneBatch,
  initializeOpenAI,
} from "./ai-analysis/multi-image-processor.mjs";
import {
  clearExistingAnalysis,
  getAnalysisStatistics,
  getGemstonesForAnalysis,
} from "./ai-analysis/database-operations.mjs";

import OpenAI from "openai";
import { cleanupTempDirectory } from "./ai-analysis/image-utils.mjs";
import { config } from "dotenv";
// Import our modular components
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: ".env.local" });

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
function validateEnvironment() {
  const missing = [];
  if (!OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(", ")}`);
    console.error("Please check your .env file");
    process.exit(1);
  }
}

// Initialize services
function initializeServices() {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return { openai, supabase };
}

/**
 * Main analysis workflow
 */
async function runMultiImageAnalysis(options = {}) {
  const {
    limit = null,
    clearExisting = false,
    specificGemstones = null,
  } = options;

  console.log(`\n🚀 Starting Multi-Image AI Gemstone Analysis v3.0`);
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`${"=".repeat(60)}`);

  try {
    // Initialize services
    const { openai, supabase } = initializeServices();

    // Initialize OpenAI for multi-image processor
    initializeOpenAI(OPENAI_API_KEY);

    // Initialize statistics tracker
    const stats = new MultiImageAnalysisStats();

    // Clear existing analysis if requested
    if (clearExisting) {
      console.log(`\n🧹 Clearing existing analysis data...`);
      await clearExistingAnalysis(supabase, specificGemstones);
    }

    // Get current statistics
    const currentStats = await getAnalysisStatistics(supabase);
    console.log(`\n📊 Current Database Status:`);
    console.log(`   Total Gemstones: ${currentStats.totalGemstones}`);
    console.log(
      `   Analyzed: ${currentStats.analyzedGemstones} (${currentStats.successRate}%)`
    );
    console.log(`   Total Images: ${currentStats.totalImages}`);
    console.log(`   Previous Cost: $${currentStats.totalCostUSD.toFixed(4)}`);

    // Get gemstones for analysis
    console.log(`\n🔍 Fetching gemstones for analysis...`);
    const gemstones = await getGemstonesForAnalysis(
      supabase,
      limit,
      specificGemstones
    );

    if (gemstones.length === 0) {
      console.log(`✅ No gemstones need analysis. All caught up!`);
      return;
    }

    console.log(`\n🎯 Analysis Plan:`);
    console.log(`   Gemstones to analyze: ${gemstones.length}`);
    console.log(
      `   Total images to process: ${gemstones.reduce(
        (sum, g) => sum + g.gemstone_images.length,
        0
      )}`
    );
    console.log(`   Multi-image batching: ✅ ENABLED`);
    console.log(`   Cost savings expected: ~70-80%`);

    // Process each gemstone with all its images in one batch
    for (let i = 0; i < gemstones.length; i++) {
      const gemstone = gemstones[i];

      console.log(`\n${"─".repeat(50)}`);
      console.log(
        `📍 Processing ${i + 1}/${gemstones.length}: ${
          gemstone.serial_number || gemstone.id
        }`
      );
      console.log(`📸 Images: ${gemstone.gemstone_images.length}`);

      stats.addGemstone();

      try {
        // Analyze all images for this gemstone in a single batch
        const result = await analyzeGemstoneBatch(
          gemstone.gemstone_images,
          gemstone.id,
          supabase
        );

        if (result.success) {
          stats.addAnalyzedGemstone(
            gemstone.id,
            gemstone.gemstone_images.length,
            result.cost,
            result.processingTime,
            result.consolidatedAnalysis.primary_image_selection
          );

          console.log(`✅ Analysis complete:`);
          console.log(
            `   Confidence: ${
              result.consolidatedAnalysis.overall_metrics?.confidence_score || 0
            }%`
          );
          console.log(`   Cost: $${result.cost.toFixed(4)}`);
          console.log(`   Time: ${result.processingTime}ms`);
          console.log(
            `   Primary Image: Index ${
              result.consolidatedAnalysis.primary_image_selection
                ?.selected_image_index || "N/A"
            }`
          );
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error(
          `❌ Error analyzing gemstone ${gemstone.id}: ${error.message}`
        );
        stats.addError(
          error,
          `Gemstone ${gemstone.serial_number || gemstone.id}`
        );
        continue;
      }

      // Show progress every 5 gemstones
      if ((i + 1) % 5 === 0) {
        stats.displayProgress();
      }
    }

    // Generate final report
    console.log(`\n🎉 Analysis Complete!`);
    const finalReport = generateAnalysisReport(stats);

    // Show cost comparison
    if (finalReport.costAnalysis.costSavingsVsSingleImage !== "N/A") {
      console.log(`\n💡 COST SAVINGS ACHIEVED:`);
      console.log(
        `   Old System (estimated): $${finalReport.costAnalysis.costSavingsVsSingleImage.estimatedOldSystemCost}`
      );
      console.log(
        `   New Multi-Image System: $${finalReport.costAnalysis.costSavingsVsSingleImage.actualMultiImageCost}`
      );
      console.log(
        `   Savings: $${finalReport.costAnalysis.costSavingsVsSingleImage.savingsUSD} (${finalReport.costAnalysis.costSavingsVsSingleImage.savingsPercent})`
      );
    }

    // Cleanup
    await cleanupTempDirectory();

    return finalReport;
  } catch (error) {
    console.error(`\n❌ Fatal error in analysis workflow: ${error.message}`);
    console.error(error.stack);
    await cleanupTempDirectory();
    throw error;
  }
}

/**
 * Command line interface
 */
async function main() {
  validateEnvironment();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {};

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--limit":
        options.limit = parseInt(args[++i]);
        break;
      case "--clear":
        options.clearExisting = true;
        break;
      case "--gems":
        // Specific gemstones: --gems gem1,gem2,gem3
        options.specificGemstones = args[++i].split(",");
        break;
      case "--help":
        showHelp();
        process.exit(0);
      default:
        if (args[i].startsWith("--")) {
          console.error(`❌ Unknown option: ${args[i]}`);
          showHelp();
          process.exit(1);
        }
    }
  }

  try {
    const startTime = Date.now();
    const report = await runMultiImageAnalysis(options);
    const totalTime = Date.now() - startTime;

    console.log(`\n🏁 Total Execution Time: ${Math.round(totalTime / 1000)}s`);
    console.log(`🚀 Multi-Image Analysis v3.0 Complete!`);
  } catch (error) {
    console.error(`\n💥 Analysis failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
🔍 Multi-Image AI Gemstone Analyzer v3.0

USAGE:
  node ai-gemstone-analyzer-v3.mjs [OPTIONS]

OPTIONS:
  --limit <number>     Limit number of gemstones to analyze
  --clear              Clear existing analysis data before starting
  --gems <ids>         Analyze specific gemstones (comma-separated IDs)
  --help               Show this help message

EXAMPLES:
  # Analyze 5 gemstones with multi-image batching
  node ai-gemstone-analyzer-v3.mjs --limit 5

  # Clear all data and analyze first 10 gemstones
  node ai-gemstone-analyzer-v3.mjs --clear --limit 10

  # Analyze specific gemstones
  node ai-gemstone-analyzer-v3.mjs --gems abc123,def456,ghi789

FEATURES:
  ✅ Multi-image batching (all images per gemstone in one API call)
  ✅ 70-80% cost reduction vs single-image analysis
  ✅ Comprehensive data consolidation and cross-verification
  ✅ Intelligent primary image selection
  ✅ Modular, maintainable codebase
  ✅ Detailed statistics and reporting

ENVIRONMENT VARIABLES:
  OPENAI_API_KEY                   Your OpenAI API key
  NEXT_PUBLIC_SUPABASE_URL         Supabase project URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY    Supabase anonymous key
`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runMultiImageAnalysis };

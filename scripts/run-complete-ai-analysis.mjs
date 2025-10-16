#!/usr/bin/env node

/**
 * Complete AI Analysis Workflow
 * Run complete workflow: vision → extraction → descriptions
 *
 * Usage:
 *   node scripts/run-complete-ai-analysis.mjs [limit]
 *
 * Examples:
 *   node scripts/run-complete-ai-analysis.mjs 10    # Process 10 gemstones
 *   node scripts/run-complete-ai-analysis.mjs       # Process 100 gemstones (default)
 */

import { config } from "dotenv";
import { execSync } from "child_process";

config({ path: ".env.local" });

async function main() {
  const limit = process.argv[2] || 100;

  console.log(`🚀 Running complete AI analysis for ${limit} gemstones\n`);
  console.log(`📅 Started: ${new Date().toISOString()}`);
  console.log(
    `🤖 Vision Model: ${process.env.OPENAI_VISION_MODEL || "gpt-5-mini"}`
  );
  console.log(
    `📝 Description Model: ${
      process.env.OPENAI_DESCRIPTION_MODEL || "gpt-5-mini"
    }`
  );
  console.log("");

  try {
    // Phase 1: Vision analysis + extraction
    console.log("=".repeat(60));
    console.log("📍 Phase 1: Vision Analysis & Data Extraction");
    console.log("=".repeat(60));
    console.log("This will:");
    console.log("  - Analyze images with GPT-5-mini");
    console.log(
      "  - Extract structured data (weight, dimensions, color, etc.)"
    );
    console.log("  - Save to ai_* fields in database");
    console.log("  - Select primary images");
    console.log("");

    execSync(`node scripts/ai-gemstone-analyzer-v3.mjs ${limit}`, {
      stdio: "inherit",
    });

    console.log("\n⏳ Waiting 5 seconds before starting descriptions...\n");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Phase 2: Description generation
    console.log("=".repeat(60));
    console.log("📍 Phase 2: Description Generation");
    console.log("=".repeat(60));
    console.log("This will:");
    console.log("  - Generate technical descriptions (Russian + English)");
    console.log("  - Generate emotional descriptions (Russian + English)");
    console.log("  - Generate narrative stories (Russian + English)");
    console.log("  - Save to description_* fields in database");
    console.log("");

    execSync(`node scripts/ai-description-generator-v4.mjs --limit=${limit}`, {
      stdio: "inherit",
    });

    console.log("\n" + "=".repeat(60));
    console.log("✅ Complete AI analysis finished!");
    console.log("=".repeat(60));
    console.log(`📅 Completed: ${new Date().toISOString()}`);
    console.log("\n📊 Summary:");
    console.log(`  - Processed ${limit} gemstones`);
    console.log(`  - Vision analysis complete (ai_* fields populated)`);
    console.log(`  - Descriptions generated (description_* fields populated)`);
    console.log(`  - Ready for UI display`);
    console.log("");
  } catch (error) {
    console.error("\n❌ Error during AI analysis:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);

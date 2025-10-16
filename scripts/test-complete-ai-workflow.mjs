#!/usr/bin/env node

/**
 * Complete AI Workflow Test
 * Tests the full pipeline: vision analysis → data extraction → description generation
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function testCompleteWorkflow() {
  console.log("🧪 Complete AI Workflow Test\n");
  console.log("This will test:");
  console.log("  1. Vision analysis with multi-image processing");
  console.log("  2. Data extraction to ai_* fields");
  console.log("  3. Description generation (technical/emotional/narrative)");
  console.log("");

  const testLimit = 5;

  try {
    // Step 1: Vision analysis
    console.log("──────────────────────────────────────────────────");
    console.log("📍 Step 1: Running vision analysis...");
    console.log("──────────────────────────────────────────────────");
    const { stdout: visionOutput } = await execAsync(
      `node scripts/test-gpt5-analysis.mjs`
    );
    console.log(visionOutput);

    // Step 2: Wait for data to settle
    console.log("\n⏳ Waiting 2 seconds for data to settle...\n");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 3: Description generation
    console.log("──────────────────────────────────────────────────");
    console.log("📍 Step 2: Generating descriptions...");
    console.log("──────────────────────────────────────────────────");
    const { stdout: descOutput } = await execAsync(
      `node scripts/ai-description-generator-v4.mjs --limit=${testLimit}`
    );
    console.log(descOutput);

    // Step 4: Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ Complete workflow test finished!");
    console.log("=".repeat(60));
    console.log("\n📊 Next Steps:");
    console.log("  1. Check database for ai_* fields in gemstones table");
    console.log(
      "  2. Verify descriptions were generated (description_*_ru/en fields)"
    );
    console.log("  3. Test UI components with these gemstones");
    console.log("  4. Run Milestone 7 verification queries\n");
  } catch (error) {
    console.error("\n❌ Workflow test failed:", error.message);
    if (error.stdout) {
      console.log("\n📋 Last output before failure:");
      console.log(error.stdout);
    }
    process.exit(1);
  }
}

testCompleteWorkflow().catch(console.error);

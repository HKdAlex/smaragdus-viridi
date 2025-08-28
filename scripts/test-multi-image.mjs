#!/usr/bin/env node

/**
 * 🧪 Multi-Image Analysis Test Script
 *
 * Simple test to validate the new multi-image analysis system.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMultiImageSystem() {
  console.log("\n🧪 Testing Multi-Image Analysis System");
  console.log("=====================================");

  try {
    // Test 1: Get gemstones for analysis
    console.log("\n📊 Test 1: Fetching gemstones...");
    const { data: gemstones, error } = await supabase
      .from("gemstones")
      .select(
        `
        id,
        serial_number,
        name,
        gemstone_images!inner (
          id,
          image_url,
          original_filename,
          image_order
        )
      `
      )
      .eq("ai_analyzed", false)
      .limit(2);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`✅ Found ${gemstones.length} gemstones ready for analysis`);

    gemstones.forEach((gem, index) => {
      console.log(
        `   ${index + 1}. ${gem.serial_number || gem.id} - ${
          gem.gemstone_images.length
        } images`
      );
    });

    // Test 2: Check module imports
    console.log("\n🔧 Test 2: Checking module structure...");

    try {
      const { COMPREHENSIVE_MULTI_IMAGE_PROMPT } = await import(
        "./ai-analysis/prompts.mjs"
      );
      console.log("✅ Prompts module loaded");
      console.log(
        `   Prompt length: ${COMPREHENSIVE_MULTI_IMAGE_PROMPT.length} characters`
      );
    } catch (error) {
      console.error("❌ Prompts module failed:", error.message);
    }

    try {
      const { downloadImageAsBase64 } = await import(
        "./ai-analysis/image-utils.mjs"
      );
      console.log("✅ Image utils module loaded");
    } catch (error) {
      console.error("❌ Image utils module failed:", error.message);
    }

    try {
      const { saveMultiImageAnalysis } = await import(
        "./ai-analysis/database-operations.mjs"
      );
      console.log("✅ Database operations module loaded");
    } catch (error) {
      console.error("❌ Database operations module failed:", error.message);
    }

    try {
      const { MultiImageAnalysisStats } = await import(
        "./ai-analysis/statistics.mjs"
      );
      const stats = new MultiImageAnalysisStats();
      console.log("✅ Statistics module loaded");
    } catch (error) {
      console.error("❌ Statistics module failed:", error.message);
    }

    // Test 3: Check environment variables
    console.log("\n🔑 Test 3: Environment variables...");

    const requiredVars = [
      "OPENAI_API_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];

    let allVarsPresent = true;
    requiredVars.forEach((varName) => {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: Present`);
      } else {
        console.log(`❌ ${varName}: Missing`);
        allVarsPresent = false;
      }
    });

    if (allVarsPresent) {
      console.log("✅ All required environment variables present");
    } else {
      console.log("❌ Some environment variables missing");
    }

    // Test 4: Database schema validation
    console.log("\n🗄️ Test 4: Database schema validation...");

    try {
      const { data: analysisResults } = await supabase
        .from("ai_analysis_results")
        .select("*")
        .limit(1);
      console.log("✅ ai_analysis_results table accessible");
    } catch (error) {
      console.error("❌ ai_analysis_results table error:", error.message);
    }

    console.log("\n🎉 Multi-Image System Test Complete!");
    console.log("\nNext Steps:");
    console.log("1. Run: node scripts/ai-gemstone-analyzer-v3.mjs --limit 1");
    console.log("2. Check results in database");
    console.log("3. Verify cost savings vs old system");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
  }
}

// Run test
testMultiImageSystem().catch(console.error);

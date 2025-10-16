#!/usr/bin/env node
/**
 * Test improved prompt with mandatory aggregated_data
 * Tests on only 3 gemstones to verify system before full run
 */

import "dotenv/config";

import {
  analyzeGemstoneBatch,
  initializeOpenAI,
} from "./ai-analysis/multi-image-processor.mjs";

import { createClient } from "@supabase/supabase-js";
import { extractGemstoneData } from "./ai-analysis/data-extractor.mjs";
import { saveMultiImageAnalysis } from "./ai-analysis/database-operations.mjs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testImprovedPrompt() {
  console.log("🧪 Testing Improved Prompt with Mandatory aggregated_data");
  console.log("📊 Test Size: 3 gemstones");
  console.log("🤖 Model: gpt-5-mini");
  console.log("=".repeat(60) + "\n");

  // Initialize OpenAI client
  initializeOpenAI(process.env.OPENAI_API_KEY);

  // Get 3 gemstones with images
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
        image_order
      )
    `
    )
    .eq("ai_analyzed", false)
    .limit(3);

  if (error || !gemstones || gemstones.length === 0) {
    console.error("❌ Error fetching gemstones:", error);
    return;
  }

  console.log(`✅ Found ${gemstones.length} gemstones for testing\n`);

  let totalCost = 0;
  let successCount = 0;
  let fieldStats = [];

  for (let i = 0; i < gemstones.length; i++) {
    const gemstone = gemstones[i];
    const images = gemstone.gemstone_images
      .sort((a, b) => a.image_order - b.image_order)
      .map((img) => ({
        id: img.id,
        image_url: img.image_url,
        image_order: img.image_order,
        original_filename: img.image_url.split("/").pop(),
      }));

    console.log(`\n${"─".repeat(60)}`);
    console.log(`📍 Testing ${i + 1}/3: ${gemstone.serial_number}`);
    console.log(`📸 Images: ${images.length}`);

    try {
      // Run AI analysis
      const result = await analyzeGemstoneBatch(images, gemstone.id, supabase);

      totalCost += result.cost;

      // Save to database
      await saveMultiImageAnalysis(
        supabase,
        gemstone.id,
        result.consolidatedAnalysis,
        images
      );

      // Extract data
      const extractedData = extractGemstoneData(result.consolidatedAnalysis);

      // Count populated fields
      const populatedFields = Object.entries(extractedData).filter(
        ([key, value]) =>
          value !== null &&
          value !== undefined &&
          !key.includes("extracted_date")
      ).length;

      // Update gemstone
      await supabase
        .from("gemstones")
        .update(extractedData)
        .eq("id", gemstone.id);

      await supabase
        .from("gemstones")
        .update({
          ai_analyzed: true,
          ai_analysis_date: new Date().toISOString(),
        })
        .eq("id", gemstone.id);

      successCount++;
      fieldStats.push({
        serial: gemstone.serial_number,
        fields: populatedFields,
        confidence: extractedData.ai_extraction_confidence,
        weight: extractedData.ai_weight_carats,
        length: extractedData.ai_length_mm,
        color: extractedData.ai_color,
      });

      console.log(`\n✅ Analysis Complete:`);
      console.log(`   💰 Cost: $${result.cost.toFixed(4)}`);
      console.log(`   ⏱️  Time: ${Math.round(result.processingTime / 1000)}s`);
      console.log(
        `   📊 Fields: ${populatedFields}/12 (${Math.round(
          (populatedFields / 12) * 100
        )}%)`
      );
      console.log(
        `   🎯 Confidence: ${Math.round(
          extractedData.ai_extraction_confidence * 100
        )}%`
      );

      if (extractedData.ai_weight_carats) {
        console.log(`   💎 Weight: ${extractedData.ai_weight_carats} ct`);
      }
      if (extractedData.ai_length_mm && extractedData.ai_width_mm) {
        console.log(
          `   📏 Dimensions: ${extractedData.ai_length_mm} × ${extractedData.ai_width_mm} mm`
        );
      }
      if (extractedData.ai_color) {
        console.log(
          `   🎨 Color: ${extractedData.ai_color.substring(0, 50)}...`
        );
      }
    } catch (error) {
      console.error(`❌ Error analyzing gemstone:`, error.message);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Success: ${successCount}/3`);
  console.log(`💰 Total Cost: $${totalCost.toFixed(4)}`);

  if (fieldStats.length > 0) {
    const avgFields =
      fieldStats.reduce((sum, s) => sum + s.fields, 0) / fieldStats.length;
    const avgConfidence =
      fieldStats.reduce((sum, s) => sum + s.confidence, 0) / fieldStats.length;

    console.log(`\n📈 FIELD EXTRACTION:`);
    console.log(`   Average: ${avgFields.toFixed(1)}/12 fields`);
    console.log(`   Coverage: ${Math.round((avgFields / 12) * 100)}%`);
    console.log(`   Confidence: ${Math.round(avgConfidence * 100)}%`);

    const withWeight = fieldStats.filter((s) => s.weight).length;
    const withDimensions = fieldStats.filter((s) => s.length).length;
    const withColor = fieldStats.filter((s) => s.color).length;

    console.log(`\n✅ SPECIFIC FIELDS:`);
    console.log(
      `   Weight: ${withWeight}/3 (${Math.round((withWeight / 3) * 100)}%)`
    );
    console.log(
      `   Dimensions: ${withDimensions}/3 (${Math.round(
        (withDimensions / 3) * 100
      )}%)`
    );
    console.log(
      `   Color: ${withColor}/3 (${Math.round((withColor / 3) * 100)}%)`
    );

    if (avgFields >= 8) {
      console.log(
        `\n🎉 SUCCESS! Field extraction is working well (${Math.round(
          (avgFields / 12) * 100
        )}%)`
      );
      console.log(`💡 Ready to proceed with full catalog analysis`);
    } else {
      console.log(
        `\n⚠️  Field extraction needs improvement (${Math.round(
          (avgFields / 12) * 100
        )}%)`
      );
      console.log(
        `💡 Expected: 8-10 fields, Got: ${avgFields.toFixed(1)} fields`
      );
    }
  }

  console.log("=".repeat(60));
}

testImprovedPrompt().catch(console.error);

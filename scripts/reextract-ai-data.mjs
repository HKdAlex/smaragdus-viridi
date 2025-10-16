#!/usr/bin/env node
/**
 * Re-extract AI data from already-analyzed gemstones
 * Uses improved data extractor to populate ai_* fields from existing analysis results
 */

import "dotenv/config";

import { createClient } from "@supabase/supabase-js";
import { extractGemstoneData } from "./ai-analysis/data-extractor.mjs";

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

async function reextractData() {
  console.log("🔄 Re-extracting AI data from analyzed gemstones...\n");

  // Get all gemstones with AI analysis results
  const { data: results, error } = await supabase
    .from("ai_analysis_results")
    .select("id, gemstone_id, extracted_data")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching analysis results:", error);
    return;
  }

  console.log(`📊 Found ${results.length} analysis results to process\n`);

  let successCount = 0;
  let errorCount = 0;
  const details = [];

  for (const result of results) {
    try {
      // Extract data using improved extractor
      const extractedData = extractGemstoneData(result.extracted_data);

      // Count non-null fields
      const populatedFields = Object.entries(extractedData).filter(
        ([key, value]) =>
          value !== null &&
          value !== undefined &&
          !key.includes("extracted_date")
      ).length;

      // Update gemstone with extracted data
      const { error: updateError } = await supabase
        .from("gemstones")
        .update(extractedData)
        .eq("id", result.gemstone_id);

      if (updateError) {
        console.error(
          `❌ Error updating gemstone ${result.gemstone_id}:`,
          updateError
        );
        errorCount++;
      } else {
        successCount++;
        details.push({
          gemstone_id: result.gemstone_id,
          fields: populatedFields,
          confidence: extractedData.ai_extraction_confidence,
        });

        console.log(
          `✅ ${successCount}/${results.length}: Updated gemstone ${result.gemstone_id}`
        );
        console.log(
          `   📊 ${populatedFields} fields populated, confidence: ${Math.round(
            extractedData.ai_extraction_confidence * 100
          )}%`
        );
        if (extractedData.ai_weight_carats) {
          console.log(`   💎 Weight: ${extractedData.ai_weight_carats} ct`);
        }
        if (extractedData.ai_length_mm && extractedData.ai_width_mm) {
          console.log(
            `   📏 Dimensions: ${extractedData.ai_length_mm} x ${extractedData.ai_width_mm} mm`
          );
        }
        if (extractedData.ai_color) {
          console.log(`   🎨 Color: ${extractedData.ai_color}`);
        }
        console.log();
      }
    } catch (err) {
      console.error(`❌ Error processing result ${result.id}:`, err.message);
      errorCount++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 RE-EXTRACTION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Success: ${successCount}/${results.length}`);
  console.log(`❌ Errors: ${errorCount}/${results.length}`);

  if (details.length > 0) {
    const avgFields =
      details.reduce((sum, d) => sum + d.fields, 0) / details.length;
    const avgConfidence =
      details.reduce((sum, d) => sum + d.confidence, 0) / details.length;

    console.log(`\n📈 STATISTICS:`);
    console.log(`   Average fields populated: ${avgFields.toFixed(1)}/12`);
    console.log(`   Average confidence: ${Math.round(avgConfidence * 100)}%`);
    console.log(`   Field coverage: ${Math.round((avgFields / 12) * 100)}%`);
  }

  console.log("=".repeat(60));
}

reextractData().catch(console.error);

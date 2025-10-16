#!/usr/bin/env node
/**
 * Clean up old AI analyses before re-running with improved system
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

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

async function cleanup() {
  console.log("🧹 Cleaning up old AI analyses...\n");

  // Get count of existing analyses
  const { count: analysisCount } = await supabase
    .from("ai_analysis_results")
    .select("*", { count: "exact", head: true });

  const { count: analyzedGemsCount } = await supabase
    .from("gemstones")
    .select("*", { count: "exact", head: true })
    .eq("ai_analyzed", true);

  console.log(`📊 Current Status:`);
  console.log(`   AI Analysis Results: ${analysisCount}`);
  console.log(`   Gemstones marked as analyzed: ${analyzedGemsCount}`);
  console.log();

  // Delete all AI analysis results
  console.log("🗑️  Deleting AI analysis results...");
  const { error: deleteError } = await supabase
    .from("ai_analysis_results")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (deleteError) {
    console.error("❌ Error deleting analyses:", deleteError);
    return;
  }

  console.log("✅ Deleted all AI analysis results");

  // Reset gemstone flags and clear AI fields
  console.log("\n🔄 Resetting gemstone AI flags and fields...");
  const { error: updateError } = await supabase
    .from("gemstones")
    .update({
      ai_analyzed: false,
      ai_analysis_date: null,
      ai_confidence_score: null,
      // Clear all ai_* extracted fields
      ai_weight_carats: null,
      ai_length_mm: null,
      ai_width_mm: null,
      ai_depth_mm: null,
      ai_color: null,
      ai_clarity: null,
      ai_cut: null,
      ai_origin: null,
      ai_treatment: null,
      ai_quality_grade: null,
      ai_extraction_confidence: null,
      ai_extracted_date: null,
      // Clear description fields
      description_technical_ru: null,
      description_technical_en: null,
      description_emotional_ru: null,
      description_emotional_en: null,
      narrative_story_ru: null,
      narrative_story_en: null,
    })
    .eq("ai_analyzed", true);

  if (updateError) {
    console.error("❌ Error resetting gemstones:", updateError);
    return;
  }

  console.log("✅ Reset all gemstone AI flags and fields");

  // Reset primary image flags (optional - you might want to keep these)
  console.log("\n🖼️  Resetting primary image flags...");
  const { error: imageError } = await supabase
    .from("gemstone_images")
    .update({ is_primary: false })
    .eq("is_primary", true);

  if (imageError) {
    console.error("❌ Error resetting images:", imageError);
    return;
  }

  console.log("✅ Reset all primary image flags");

  // Final status
  const { count: finalAnalysisCount } = await supabase
    .from("ai_analysis_results")
    .select("*", { count: "exact", head: true });

  const { count: finalGemsCount } = await supabase
    .from("gemstones")
    .select("*", { count: "exact", head: true })
    .eq("ai_analyzed", true);

  console.log("\n" + "=".repeat(60));
  console.log("🎉 CLEANUP COMPLETE");
  console.log("=".repeat(60));
  console.log(`✅ AI Analysis Results: ${finalAnalysisCount} (was ${analysisCount})`);
  console.log(`✅ Analyzed Gemstones: ${finalGemsCount} (was ${analyzedGemsCount})`);
  console.log("\n💡 Ready for fresh analysis run:");
  console.log("   node scripts/test-gpt5-analysis.mjs  # Test with 5 gems");
  console.log("   node scripts/ai-gemstone-analyzer-v3.mjs --limit=100  # First 100");
  console.log("   node scripts/ai-gemstone-analyzer-v3.mjs --limit=1385  # Full catalog");
  console.log("=".repeat(60));
}

cleanup().catch(console.error);


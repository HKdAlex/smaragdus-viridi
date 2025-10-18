#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAIDisplay() {
  const gemstoneId = "38ed8d53-e4b8-4fb4-ad2a-0c17e86441d4";

  console.log("🧪 Testing AI analysis display for gemstone:", gemstoneId);

  // Simulate the same query as the page component
  const { data: gemstone, error: gemstoneError } = await supabase
    .from("gemstones")
    .select(
      `
      id,
      name,
      serial_number,
      weight_carats,
      color,
      cut,
      clarity,
      price_amount,
      price_currency,
      ai_analyzed,
      ai_confidence_score,
      ai_analysis_date
    `
    )
    .eq("id", gemstoneId)
    .single();

  if (gemstoneError) {
    console.error("❌ Error fetching gemstone:", gemstoneError);
    return;
  }

  // Fetch AI analysis results
  const { data: aiAnalysisResults, error: aiError } = await supabase
    .from("ai_analysis_results")
    .select("*")
    .eq("gemstone_id", gemstoneId)
    .order("created_at", { ascending: false });

  if (aiError) {
    console.error("❌ Error fetching AI analysis:", aiError);
    return;
  }

  console.log("📊 Test Results:");
  console.log("  Gemstone AI flags:");
  console.log("    ai_analyzed:", gemstone.ai_analyzed);
  console.log("    ai_confidence_score:", gemstone.ai_confidence_score);
  console.log("    ai_analysis_date:", gemstone.ai_analysis_date);

  console.log("  AI Analysis Results:");
  console.log("    count:", aiAnalysisResults?.length || 0);

  if (aiAnalysisResults && aiAnalysisResults.length > 0) {
    const latest = aiAnalysisResults[0];
    console.log("    latest analysis:");
    console.log("      confidence_score:", latest.confidence_score);
    console.log("      analysis_type:", latest.analysis_type);
    console.log("      has_extracted_data:", !!latest.extracted_data);
  }

  // Simulate the component logic
  const aiAnalyzed = gemstone.ai_text_generated_v6 || false;
  const analysisData = aiAnalysisResults || [];

  console.log("  Component Logic:");
  console.log("    aiAnalyzed:", aiAnalyzed);
  console.log("    analysisData.length:", analysisData.length);
  console.log(
    "    should_show_analysis:",
    aiAnalyzed && analysisData.length > 0
  );

  if (aiAnalyzed && analysisData.length > 0) {
    console.log("✅ AI Analysis should be displayed!");
  } else {
    console.log('❌ AI Analysis will show "Not Available"');
  }
}

testAIDisplay();

#!/usr/bin/env node

/**
 * Check AI Analysis Quality
 * Analyzes the results in ai_analysis_results table
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAnalysisQuality() {
  console.log("✅ CHECKING AI ANALYSIS QUALITY\n");

  try {
    const { data: analyses, error } = await supabase
      .from("ai_analysis_results")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching analyses:", error.message);
      return;
    }

    console.log("📊 ANALYSIS STATUS SUMMARY:");

    let successful = 0;
    let failed = 0;
    let incomplete = 0;

    analyses.forEach((analysis, i) => {
      const hasValidData =
        analysis.extracted_data &&
        (typeof analysis.extracted_data === "object" ||
          (typeof analysis.extracted_data === "string" &&
            !analysis.extracted_data.includes("Unexpected non-whitespace")));

      if (
        hasValidData &&
        analysis.confidence_score &&
        analysis.confidence_score > 0
      ) {
        successful++;
        console.log(
          `   ✅ Analysis ${i + 1}: SUCCESSFUL (${(
            analysis.confidence_score * 100
          ).toFixed(1)}% confidence)`
        );
      } else if (
        analysis.extracted_data &&
        typeof analysis.extracted_data === "string" &&
        analysis.extracted_data.includes("Unexpected non-whitespace")
      ) {
        failed++;
        console.log(`   ❌ Analysis ${i + 1}: JSON PARSING FAILED`);
      } else {
        incomplete++;
        console.log(`   ⚠️  Analysis ${i + 1}: INCOMPLETE DATA`);
      }
    });

    console.log("\n📈 SUMMARY:");
    console.log(`   Successful: ${successful}/${analyses.length}`);
    console.log(`   Failed: ${failed}/${analyses.length}`);
    console.log(`   Incomplete: ${incomplete}/${analyses.length}`);

    // Check for successful analyses with actual data
    const successfulAnalyses = analyses.filter(
      (a) =>
        a.extracted_data &&
        a.confidence_score &&
        a.confidence_score > 0 &&
        typeof a.extracted_data === "object"
    );

    if (successfulAnalyses.length > 0) {
      console.log("\n🎯 SUCCESSFUL ANALYSIS DETAILS:");

      successfulAnalyses.forEach((analysis, i) => {
        console.log(`\n--- Successful Analysis ${i + 1} ---`);
        console.log(`   Gemstone: ${analysis.gemstone_id.slice(0, 8)}...`);
        console.log(
          `   Confidence: ${(analysis.confidence_score * 100).toFixed(1)}%`
        );
        console.log(
          `   Cost: $${(analysis.processing_cost_usd || 0).toFixed(4)}`
        );

        const extractedData = analysis.extracted_data;

        if (extractedData.consolidated_data) {
          console.log("   ✅ Consolidated Data:");
          if (extractedData.consolidated_data.text_extraction) {
            console.log("      - Text extraction found");
          }
          if (extractedData.consolidated_data.gemstone_code) {
            console.log("      - Gemstone code found");
          }
          if (extractedData.consolidated_data.weight) {
            console.log("      - Weight data found");
          }
        }

        if (extractedData.primary_image_selection) {
          console.log("   🎯 Primary image selected");
        }

        if (extractedData.individual_analyses) {
          console.log(
            `   📸 Individual analyses: ${extractedData.individual_analyses.length} images`
          );
        }
      });
    }
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

checkAnalysisQuality();

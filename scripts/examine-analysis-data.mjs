#!/usr/bin/env node

/**
 * Examine AI Analysis Data
 * Shows detailed data from successful analyses
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function examineAnalysisData() {
  console.log("🔬 EXAMINING SUCCESSFUL AI ANALYSIS DATA\n");

  try {
    const { data: analyses, error } = await supabase
      .from("ai_analysis_results")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching analyses:", error.message);
      return;
    }

    // Find the first successful analysis
    const successfulAnalysis = analyses.find(
      (a) =>
        a.extracted_data &&
        a.confidence_score &&
        a.confidence_score > 0 &&
        typeof a.extracted_data === "object"
    );

    if (!successfulAnalysis) {
      console.log("❌ No successful analyses found");
      return;
    }

    console.log("📋 SUCCESSFUL ANALYSIS DETAILS:");
    console.log("   ID:", successfulAnalysis.id);
    console.log(
      "   Gemstone:",
      successfulAnalysis.gemstone_id.slice(0, 8) + "..."
    );
    console.log(
      "   Confidence:",
      (successfulAnalysis.confidence_score * 100).toFixed(1) + "%"
    );
    console.log(
      "   Cost:",
      "$" + (successfulAnalysis.processing_cost_usd || 0).toFixed(4)
    );

    const extractedData = successfulAnalysis.extracted_data;

    console.log("\n📊 EXTRACTED DATA STRUCTURE:");

    // Show consolidated data
    if (extractedData.consolidated_data) {
      console.log("   ✅ CONSOLIDATED DATA:");

      if (extractedData.consolidated_data.text_extraction) {
        const textExt = extractedData.consolidated_data.text_extraction;
        console.log("      📝 Text Extraction:");
        console.log(
          "         - Raw Text:",
          textExt.raw_text ? textExt.raw_text.substring(0, 80) + "..." : "NONE"
        );
        console.log(
          "         - Translated:",
          textExt.translated_text
            ? textExt.translated_text.substring(0, 80) + "..."
            : "NONE"
        );
        console.log("         - Language:", textExt.language || "NONE");
        console.log(
          "         - Confidence:",
          textExt.extraction_confidence || "N/A"
        );
      }

      if (extractedData.consolidated_data.gemstone_code) {
        const code = extractedData.consolidated_data.gemstone_code;
        console.log("      💎 Gemstone Code:");
        console.log("         - Value:", code.value || "NONE");
        console.log("         - Confidence:", code.confidence || "N/A");
        console.log(
          "         - Sources:",
          code.sources ? code.sources.join(", ") : "NONE"
        );
      }

      if (extractedData.consolidated_data.weight) {
        const weight = extractedData.consolidated_data.weight;
        console.log("      ⚖️  Weight:");
        console.log("         - Value:", weight.value || "NONE");
        console.log("         - Unit:", weight.unit || "NONE");
        console.log("         - Confidence:", weight.confidence || "N/A");
        console.log(
          "         - Sources:",
          weight.sources ? weight.sources.join(", ") : "NONE"
        );
      }

      if (extractedData.consolidated_data.cut) {
        const cut = extractedData.consolidated_data.cut;
        console.log("      ✂️  Cut:");
        console.log("         - Value:", cut.value || "NONE");
        console.log("         - Confidence:", cut.confidence || "N/A");
      }

      if (extractedData.consolidated_data.color) {
        const color = extractedData.consolidated_data.color;
        console.log("      🎨 Color:");
        console.log("         - Value:", color.value || "NONE");
        console.log("         - Confidence:", color.confidence || "N/A");
      }

      if (extractedData.consolidated_data.clarity) {
        const clarity = extractedData.consolidated_data.clarity;
        console.log("      🔍 Clarity:");
        console.log("         - Value:", clarity.value || "NONE");
        console.log("         - Confidence:", clarity.confidence || "N/A");
      }
    }

    // Show primary image selection
    if (extractedData.primary_image_selection) {
      console.log("\n   🎯 PRIMARY IMAGE SELECTION:");
      const pis = extractedData.primary_image_selection;
      console.log(
        "      - Selected Index:",
        pis.selected_image_index || "NONE"
      );
      console.log("      - Score:", pis.score || "NONE");
      console.log(
        "      - Reasoning:",
        pis.reasoning ? pis.reasoning.substring(0, 100) + "..." : "NONE"
      );
    }

    // Show individual analyses summary
    if (extractedData.individual_analyses) {
      console.log("\n   📸 INDIVIDUAL IMAGE ANALYSES:");
      console.log(
        "      - Total Images:",
        extractedData.individual_analyses.length
      );

      // Show first 3 images
      extractedData.individual_analyses.slice(0, 3).forEach((img, i) => {
        console.log(`      Image ${i + 1}:`);
        console.log(
          `         - Classification: ${img.image_classification || "UNKNOWN"}`
        );
        console.log(
          `         - Primary Score: ${img.primary_image_score || "N/A"}`
        );
        console.log(
          `         - Text Found: ${img.extracted_text ? "YES" : "NO"}`
        );
        console.log(
          `         - Measurements: ${img.measurement_data ? "YES" : "NO"}`
        );
      });
    }

    // Show data verification
    if (extractedData.data_verification) {
      console.log("\n   🔍 DATA VERIFICATION:");
      const dv = extractedData.data_verification;
      console.log(
        "      - Cross-verified Fields:",
        dv.cross_verified_fields ? dv.cross_verified_fields.join(", ") : "NONE"
      );
      console.log(
        "      - Conflicting Fields:",
        dv.conflicting_fields ? dv.conflicting_fields.length : 0
      );
      console.log(
        "      - Confidence Boosted Fields:",
        dv.confidence_boosted_fields
          ? dv.confidence_boosted_fields.join(", ")
          : "NONE"
      );
    }
  } catch (error) {
    console.error("❌ Examination failed:", error.message);
  }
}

examineAnalysisData();

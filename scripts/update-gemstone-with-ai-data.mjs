#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateGemstoneWithAIData() {
  const gemstoneId = "38ed8d53-e4b8-4fb4-ad2a-0c17e86441d4";

  console.log("🔧 Updating gemstone with AI-extracted data:", gemstoneId);

  // Get the latest AI analysis
  const { data: analysis, error: analysisError } = await supabase
    .from("ai_analysis_results")
    .select("extracted_data")
    .eq("gemstone_id", gemstoneId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (analysisError || !analysis || analysis.length === 0) {
    console.error("❌ No AI analysis found:", analysisError);
    return;
  }

  const extractedData = analysis[0].extracted_data;
  const consolidatedData = extractedData?.consolidated_data || {};

  console.log("📊 AI-extracted data found:");
  console.log("  Weight:", consolidatedData.weight);
  console.log("  Dimensions:", consolidatedData.dimensions);
  console.log("  Shape/Cut:", consolidatedData.shape_cut);
  console.log("  Gemstone Code:", consolidatedData.gemstone_code);

  // Prepare update data
  const updateData = {};

  if (consolidatedData.weight) {
    updateData.weight_carats = consolidatedData.weight.value;
    console.log(
      `  ✅ Will update weight to: ${consolidatedData.weight.value} ${consolidatedData.weight.unit}`
    );
  }

  if (consolidatedData.dimensions) {
    updateData.length_mm = consolidatedData.dimensions.length_mm;
    updateData.width_mm = consolidatedData.dimensions.width_mm;
    updateData.depth_mm = consolidatedData.dimensions.depth_mm;
    console.log(
      `  ✅ Will update dimensions to: ${consolidatedData.dimensions.length_mm}x${consolidatedData.dimensions.width_mm}x${consolidatedData.dimensions.depth_mm}mm`
    );
  }

  if (consolidatedData.shape_cut) {
    // Map AI-extracted cuts to valid database enum values
    const cutMapping = {
      baguette: "emerald", // Baguette is rectangular like emerald cut
      round: "round",
      oval: "oval",
      marquise: "marquise",
      pear: "pear",
      emerald: "emerald",
      princess: "princess",
      cushion: "cushion",
      radiant: "radiant",
      fantasy: "fantasy",
    };

    const mappedCut = cutMapping[consolidatedData.shape_cut.value] || "emerald";
    updateData.cut = mappedCut;
    console.log(
      `  ✅ Will update cut to: ${mappedCut} (mapped from ${consolidatedData.shape_cut.value})`
    );
  }

  if (consolidatedData.gemstone_code) {
    updateData.internal_code = consolidatedData.gemstone_code.value;
    console.log(
      `  ✅ Will update internal code to: ${consolidatedData.gemstone_code.value}`
    );
  }

  // Add AI confidence indicators
  updateData.ai_confidence_score =
    extractedData.overall_metrics?.confidence_score || 0;
  updateData.ai_data_completeness =
    extractedData.overall_metrics?.data_completeness || 0;

  console.log(
    `\n🔧 Updating gemstone with ${Object.keys(updateData).length} fields...`
  );

  const { error: updateError } = await supabase
    .from("gemstones")
    .update(updateData)
    .eq("id", gemstoneId);

  if (updateError) {
    console.error("❌ Error updating gemstone:", updateError);
  } else {
    console.log("✅ Successfully updated gemstone with AI data!");

    // Set primary image based on AI analysis
    const primaryImageIndex =
      extractedData.primary_image_selection?.selected_image_index;
    if (primaryImageIndex !== undefined) {
      console.log(
        `\n🖼️ Setting primary image based on AI analysis (index ${primaryImageIndex})...`
      );

      // First, unset all primary images
      const { error: unsetError } = await supabase
        .from("gemstone_images")
        .update({ is_primary: false })
        .eq("gemstone_id", gemstoneId);

      if (unsetError) {
        console.error("❌ Error unsetting primary images:", unsetError);
      } else {
        // Set the AI-selected image as primary
        // AI index 1 corresponds to image_order 2 in database
        const targetImageOrder = primaryImageIndex + 1;

        const { error: setPrimaryError } = await supabase
          .from("gemstone_images")
          .update({ is_primary: true })
          .eq("gemstone_id", gemstoneId)
          .eq("image_order", targetImageOrder);

        if (setPrimaryError) {
          console.error("❌ Error setting primary image:", setPrimaryError);
        } else {
          console.log(
            `✅ Successfully set image order ${targetImageOrder} as primary`
          );
        }
      }
    }

    // Verify the update
    const { data: updatedGemstone } = await supabase
      .from("gemstones")
      .select(
        "weight_carats, length_mm, width_mm, depth_mm, cut, internal_code, ai_confidence_score"
      )
      .eq("id", gemstoneId)
      .single();

    console.log("\n📊 Updated gemstone data:");
    console.log("  Weight:", updatedGemstone.weight_carats, "ct");
    console.log(
      "  Dimensions:",
      `${updatedGemstone.length_mm}x${updatedGemstone.width_mm}x${updatedGemstone.depth_mm}mm`
    );
    console.log("  Cut:", updatedGemstone.cut);
    console.log("  Internal Code:", updatedGemstone.internal_code);
    console.log(
      "  AI Confidence:",
      Math.round(updatedGemstone.ai_confidence_score * 100) + "%"
    );

    // Verify primary image
    const { data: primaryImage } = await supabase
      .from("gemstone_images")
      .select("image_order, image_url")
      .eq("gemstone_id", gemstoneId)
      .eq("is_primary", true)
      .single();

    if (primaryImage) {
      const filename = primaryImage.image_url.split("/").pop();
      console.log(
        "  Primary Image:",
        `Order ${primaryImage.image_order} (${filename})`
      );
    }
  }
}

updateGemstoneWithAIData();

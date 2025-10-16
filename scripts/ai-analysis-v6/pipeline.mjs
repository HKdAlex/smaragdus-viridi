/**
 * AI Text Generation v6 Pipeline
 * Orchestrates the full text generation workflow with image analysis
 */

import { DEFAULT_MODEL, IMAGE_QUALITY } from "./config.mjs";
import {
  detectGemstoneColor,
  detectGemstoneCut,
  selectPrimaryImage,
} from "./image-analyzer.mjs";
import {
  getGemstoneForTextGeneration,
  markGemstoneTextGenerated,
  saveTextGeneration,
  updateGemstoneAIColor,
  updateGemstoneAICut,
} from "./database.mjs";

import { downloadImagesWithFallback } from "./image-utils.mjs";
import { generateGemstoneText } from "./text-generator.mjs";

/**
 * Generate text content for a single gemstone
 * @param {string} gemstoneId - UUID of the gemstone
 * @param {Object} options - Generation options
 * @param {string} options.model - OpenAI model to use
 * @param {boolean} options.forceNoImages - Skip image download (metadata only)
 * @returns {Promise<Object>} Generation result
 */
export async function generateTextForGemstone(gemstoneId, options = {}) {
  const { model = DEFAULT_MODEL, forceNoImages = false } = options;

  console.log(`\n🔄 Generating text for gemstone: ${gemstoneId}`);

  try {
    // Step 1: Fetch gemstone metadata
    console.log("📥 Fetching gemstone metadata...");
    const gemData = await getGemstoneForTextGeneration(gemstoneId);
    console.log(`✓ Fetched: ${gemData.name} (${gemData.serial_number})`);
    console.log(
      `  Weight: ${gemData.weight_carats}ct, Origin: ${
        gemData.origin_name_en || "Unknown"
      }`
    );

    // Step 2: Attempt image download (with graceful fallback)
    let images = [];
    let imageAnalysis = {
      cutDetection: null,
      colorDetection: null,
      primaryImageSelection: null,
    };

    if (!forceNoImages && gemData.image_urls.length > 0) {
      console.log(
        `📷 Attempting to download ${gemData.image_urls.length} images...`
      );
      images = await downloadImagesWithFallback(gemData.image_urls);
      console.log(
        `  ${images.length > 0 ? "✓" : "⚠️"} Downloaded ${images.length} images`
      );

      // Step 2a: Perform image analysis if images are available
      if (images.length > 0 && gemData.image_urls.length > 0) {
        console.log("🔍 Performing AI image analysis...");

        try {
          // Detect gemstone cut from images (using base64 encoded images and metadata)
          console.log("  • Detecting cut type...");
          const cutDetection = await detectGemstoneCut({
            images: images, // Pass base64 encoded images
            imageData: gemData.image_data, // Pass image metadata with UUIDs
            metadataCut: gemData.cut || "unknown",
            imageQuality: IMAGE_QUALITY.LOW, // Start with low quality for efficiency
          });
          imageAnalysis.cutDetection = cutDetection;

          console.log(
            `    Detected: ${
              cutDetection.detected_cut
            } (confidence: ${cutDetection.confidence.toFixed(2)})`
          );
          if (!cutDetection.matches_metadata) {
            console.log(
              `    ⚠️ MISMATCH: Metadata says "${cutDetection.metadata_cut}" but detected "${cutDetection.detected_cut}"`
            );
            console.log(`    Reasoning: ${cutDetection.reasoning}`);
          }

          // Detect gemstone color from images (using base64 encoded images)
          console.log("  • Detecting color...");
          const colorDetection = await detectGemstoneColor({
            images: images, // Pass base64 encoded images
            imageData: gemData.image_data, // Pass image metadata with UUIDs
            metadataColor: gemData.color || "unknown",
            imageQuality: IMAGE_QUALITY.LOW, // Start with low quality for efficiency
          });
          imageAnalysis.colorDetection = colorDetection;

          console.log(
            `    Detected: ${
              colorDetection.detected_color
            } (confidence: ${colorDetection.confidence.toFixed(2)})`
          );
          console.log(`    Description: ${colorDetection.color_description}`);
          if (!colorDetection.matches_metadata) {
            console.log(
              `    ⚠️ MISMATCH: Metadata says "${colorDetection.metadata_color}" but detected "${colorDetection.detected_color}"`
            );
            console.log(`    Reasoning: ${colorDetection.reasoning}`);
          }

          // Select best primary image
          if (images.length > 1) {
            console.log("  • Selecting best primary image...");
            const primarySelection = await selectPrimaryImage({
              images: images, // Pass base64 encoded images
              imageData: gemData.image_data, // Pass image metadata with UUIDs
              gemstoneInfo: {
                weight_carats: gemData.weight_carats,
                color: gemData.color,
                name: gemData.name,
                cut: cutDetection.detected_cut, // Use detected cut
              },
              imageQuality: IMAGE_QUALITY.LOW, // Start with low quality for efficiency
            });
            imageAnalysis.primaryImageSelection = primarySelection;

            const selectedScore =
              primarySelection.selected_index >= 0 &&
              primarySelection.image_scores &&
              primarySelection.image_scores[primarySelection.selected_index]
                ? primarySelection.image_scores[
                    primarySelection.selected_index
                  ].overall_score.toFixed(2)
                : "N/A";
            console.log(
              `    Selected image ${primarySelection.selected_index} (score: ${selectedScore})`
            );
            console.log(`    Reasoning: ${primarySelection.reasoning}`);
          }
        } catch (error) {
          console.error(`  ⚠️ Image analysis failed: ${error.message}`);
          // Continue with text generation even if image analysis fails
        }
      }
    } else {
      console.log("📝 Metadata-only generation (no images)");
    }

    // Step 3: Generate text content
    console.log("🤖 Generating text content with AI...");
    console.log("Using model:", model);
    let generation;
    try {
      generation = await generateGemstoneText({
        metadata: gemData,
        images: images.length > 0 ? images : null,
        model,
        detectedCut: imageAnalysis.cutDetection?.detected_cut || null, // Use AI-detected cut
        detectedColor: imageAnalysis.colorDetection?.detected_color || null, // Use AI-detected color
      });

      if (!generation || !generation.content) {
        throw new Error("Text generation returned empty or invalid result");
      }

      // Debug: Log the structure of generated content (only if needed)
      // console.log("Generated content structure:", JSON.stringify(generation.content, null, 2));

      const confidence = generation.content.confidence || 0;
      console.log(`✓ Generated content (confidence: ${confidence.toFixed(2)})`);
      console.log(
        `  Cost: $${
          generation.metadata?.generation_cost_usd?.toFixed(4) || "N/A"
        }`
      );
      console.log(
        `  Time: ${
          (generation.metadata?.generation_time_ms / 1000)?.toFixed(1) || "N/A"
        }s`
      );

      // Check if generation quality is good enough
      if (confidence < 0.7) {
        console.log(
          `⚠️ Low confidence generation (${confidence.toFixed(
            2
          )}) - consider retrying with higher image quality`
        );
      } else {
        console.log(`✅ High quality generation (${confidence.toFixed(2)})`);
      }
    } catch (error) {
      console.error(`❌ Failed to generate text: ${error.message}`);
      console.error(`Error details:`, error);
      throw error; // Re-throw to propagate to outer catch block
    }

    // Step 4: Save to database
    console.log("💾 Saving to database...");
    await saveTextGeneration(gemstoneId, generation.content, {
      ...generation.metadata,
      used_images: images.length > 0,
      image_urls: gemData.image_urls,
      // Include image analysis results
      detected_cut: imageAnalysis.cutDetection?.detected_cut || null,
      cut_detection_confidence: imageAnalysis.cutDetection?.confidence || null,
      cut_matches_metadata:
        imageAnalysis.cutDetection?.matches_metadata ?? null,
      cut_detection_reasoning: imageAnalysis.cutDetection?.reasoning || null,
      detected_color: imageAnalysis.colorDetection?.detected_color || null,
      color_detection_confidence:
        imageAnalysis.colorDetection?.confidence || null,
      color_matches_metadata:
        imageAnalysis.colorDetection?.matches_metadata ?? null,
      color_detection_reasoning:
        imageAnalysis.colorDetection?.reasoning || null,
      detected_color_description:
        imageAnalysis.colorDetection?.color_description || null,
      recommended_primary_image_index:
        imageAnalysis.primaryImageSelection?.selected_index ?? null,
      selected_image_uuid:
        imageAnalysis.primaryImageSelection?.selected_image_uuid || null,
      primary_image_selection_reasoning:
        imageAnalysis.primaryImageSelection?.reasoning || null,
      image_quality_scores:
        imageAnalysis.primaryImageSelection?.image_scores || null,
    });

    await markGemstoneTextGenerated(gemstoneId);

    // Update gemstones table with AI-detected color if available
    if (imageAnalysis.colorDetection?.detected_color) {
      try {
        await updateGemstoneAIColor(gemstoneId, imageAnalysis.colorDetection);
        console.log(
          `✓ Updated gemstone with AI color: ${imageAnalysis.colorDetection.detected_color}`
        );
      } catch (error) {
        console.error(
          `⚠️ Failed to update gemstone AI color: ${error.message}`
        );
        // Don't fail the entire process if color update fails
      }
    }

    // Update gemstones table with AI-detected cut if available and different from metadata
    if (
      imageAnalysis.cutDetection?.detected_cut &&
      imageAnalysis.cutDetection.detected_cut !== gemData.cut
    ) {
      try {
        await updateGemstoneAICut(gemstoneId, imageAnalysis.cutDetection);
        console.log(
          `✓ Updated gemstone cut from "${gemData.cut}" to "${imageAnalysis.cutDetection.detected_cut}"`
        );
      } catch (error) {
        console.error(`⚠️ Failed to update gemstone AI cut: ${error.message}`);
        // Don't fail the entire process if cut update fails
      }
    }

    console.log("✓ Saved successfully");

    return {
      success: true,
      gemstone: {
        id: gemstoneId,
        serial_number: gemData.serial_number,
        name: gemData.name,
      },
      generation: {
        confidence: generation.content.confidence,
        used_images: images.length > 0,
        num_images: images.length,
        cost_usd: generation.metadata.generation_cost_usd,
        time_ms: generation.metadata.generation_time_ms,
      },
      imageAnalysis: {
        cut_detected: imageAnalysis.cutDetection?.detected_cut || null,
        cut_matches: imageAnalysis.cutDetection?.matches_metadata ?? null,
        color_detected: imageAnalysis.colorDetection?.detected_color || null,
        color_matches: imageAnalysis.colorDetection?.matches_metadata ?? null,
        color_description:
          imageAnalysis.colorDetection?.color_description || null,
        primary_image_index:
          imageAnalysis.primaryImageSelection?.selected_index ?? null,
      },
      content: generation.content,
    };
  } catch (error) {
    console.error(`❌ Failed to generate text: ${error.message}`);
    return {
      success: false,
      gemstone_id: gemstoneId,
      error: error.message,
    };
  }
}

/**
 * Generate text for multiple gemstones in batch
 * @param {Array<string>} gemstoneIds - Array of gemstone UUIDs
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Batch results summary
 */
export async function generateTextBatch(gemstoneIds, options = {}) {
  console.log(
    `\n🚀 Starting batch text generation for ${gemstoneIds.length} gemstones\n`
  );

  const results = [];
  const startTime = Date.now();

  for (const gemstoneId of gemstoneIds) {
    const result = await generateTextForGemstone(gemstoneId, options);
    results.push(result);
  }

  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 1000;

  // Calculate summary
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const totalCost = successful.reduce(
    (sum, r) => sum + r.generation.cost_usd,
    0
  );
  const avgConfidence =
    successful.reduce((sum, r) => sum + r.generation.confidence, 0) /
    successful.length;

  console.log("\n" + "=".repeat(60));
  console.log("📊 BATCH GENERATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total gemstones: ${gemstoneIds.length}`);
  console.log(`✓ Successful: ${successful.length}`);
  console.log(`✗ Failed: ${failed.length}`);
  console.log(`Total cost: $${totalCost.toFixed(4)}`);
  console.log(`Total time: ${totalTime.toFixed(1)}s`);
  console.log(`Avg confidence: ${avgConfidence.toFixed(3)}`);
  console.log(`Avg time/gem: ${(totalTime / gemstoneIds.length).toFixed(1)}s`);
  console.log("=".repeat(60) + "\n");

  return {
    total: gemstoneIds.length,
    successful: successful.length,
    failed: failed.length,
    total_cost_usd: totalCost,
    total_time_sec: totalTime,
    avg_confidence: avgConfidence,
    results,
  };
}

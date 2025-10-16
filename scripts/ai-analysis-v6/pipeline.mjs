/**
 * AI Text Generation v6 Pipeline
 * Orchestrates the full text generation workflow with image analysis
 */

import { detectGemstoneCut, selectPrimaryImage } from "./image-analyzer.mjs";
import {
  getGemstoneForTextGeneration,
  markGemstoneTextGenerated,
  saveTextGeneration,
} from "./database.mjs";

import { DEFAULT_MODEL } from "./config.mjs";
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
          // Detect gemstone cut from images (using base64 encoded images)
          console.log("  • Detecting cut type...");
          const cutDetection = await detectGemstoneCut({
            images: images, // Pass base64 encoded images
            metadataCut: gemData.cut || "unknown",
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

          // Select best primary image
          if (images.length > 1) {
            console.log("  • Selecting best primary image...");
            const primarySelection = await selectPrimaryImage({
              images: images, // Pass base64 encoded images
              gemstoneInfo: {
                weight_carats: gemData.weight_carats,
                color: gemData.color,
                name: gemData.name,
                cut: cutDetection.detected_cut, // Use detected cut
              },
            });
            imageAnalysis.primaryImageSelection = primarySelection;

            const selectedScore =
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
    let generation;
    try {
      generation = await generateGemstoneText({
        metadata: gemData,
        images: images.length > 0 ? images : null,
        model,
        detectedCut: imageAnalysis.cutDetection?.detected_cut || null, // Use AI-detected cut
      });

      console.log(
        `✓ Generated content (confidence: ${generation.content.confidence.toFixed(
          2
        )})`
      );
      console.log(
        `  Cost: $${generation.metadata.generation_cost_usd.toFixed(4)}`
      );
      console.log(
        `  Time: ${(generation.metadata.generation_time_ms / 1000).toFixed(1)}s`
      );
    } catch (error) {
      console.error(`❌ Failed to generate text: ${error.message}`);
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
      recommended_primary_image_index:
        imageAnalysis.primaryImageSelection?.selected_index ?? null,
      primary_image_selection_reasoning:
        imageAnalysis.primaryImageSelection?.reasoning || null,
      image_quality_scores:
        imageAnalysis.primaryImageSelection?.image_scores || null,
    });

    await markGemstoneTextGenerated(gemstoneId);
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

/**
 * 🗄️ Database Operations for Multi-Image AI Analysis
 *
 * Handles saving consolidated analysis results, managing primary image flags,
 * and tracking analysis metadata in Supabase.
 *
 * @author Smaragdus Viridi Team
 * @version 3.1.0 - ENHANCED VALIDATION TRACKING
 * @date 2025-01-19
 */

/**
 * Save consolidated multi-image analysis results to database
 */
export async function saveMultiImageAnalysis(
  supabase,
  gemstoneId,
  consolidatedAnalysis
) {
  console.log(`💾 Saving consolidated analysis for gemstone ${gemstoneId}...`);

  try {
    // Extract validation info
    const validationStatus = consolidatedAnalysis.validation_passed
      ? "complete"
      : "incomplete";
    const validationIssues = consolidatedAnalysis.validation_issues || [];
    const validationWarnings = consolidatedAnalysis.validation_warnings || [];

    // Log validation status
    if (!consolidatedAnalysis.validation_passed) {
      console.warn(`⚠️ Saving analysis with validation issues:`);
      validationIssues.forEach((issue) => console.warn(`  - ${issue}`));
    }
    if (validationWarnings.length > 0) {
      console.log(`💡 Analysis warnings:`);
      validationWarnings.forEach((warning) => console.log(`  - ${warning}`));
    }

    // Save main analysis result with enhanced validation metadata
    const { data: analysisData, error: analysisError } = await supabase
      .from("ai_analysis_results")
      .insert({
        gemstone_id: gemstoneId,
        analysis_type: "comprehensive_analysis",
        input_data: {
          image_count:
            consolidatedAnalysis.processing_metadata?.image_batch_info
              ?.length || 0,
          image_batch_info:
            consolidatedAnalysis.processing_metadata?.image_batch_info || [],
          analysis_prompt: "Multi-image comprehensive gemstone analysis",
          validation_status: validationStatus,
          expected_images:
            consolidatedAnalysis.overall_metrics?.expected_images || 0,
          analyzed_images:
            consolidatedAnalysis.overall_metrics?.images_analyzed || 0,
          gauge_readings_found:
            consolidatedAnalysis.overall_metrics?.gauge_readings_found || 0,
        },
        raw_response: consolidatedAnalysis.raw_ai_response || {},
        extracted_data: {
          ...consolidatedAnalysis,
          validation_metadata: {
            validation_passed: consolidatedAnalysis.validation_passed,
            validation_issues: validationIssues,
            validation_warnings: validationWarnings,
            images_expected:
              consolidatedAnalysis.overall_metrics?.expected_images || 0,
            images_analyzed:
              consolidatedAnalysis.overall_metrics?.images_analyzed || 0,
            gauge_readings_extracted:
              consolidatedAnalysis.overall_metrics?.gauge_readings_found || 0,
            completeness_score:
              consolidatedAnalysis.overall_metrics?.data_completeness || 0,
            validation_timestamp: new Date().toISOString(),
          },
        },
        confidence_score:
          consolidatedAnalysis.overall_metrics?.confidence_score || 0,
        processing_cost_usd:
          consolidatedAnalysis.processing_metadata?.processing_cost_usd || 0,
        processing_time_ms:
          consolidatedAnalysis.processing_metadata?.processing_time_ms || 0,
        ai_model_version:
          consolidatedAnalysis.processing_metadata?.ai_model_version ||
          "gpt-4o-mini",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (analysisError) {
      throw new Error(`Failed to save analysis: ${analysisError.message}`);
    }

    console.log(`✅ Saved analysis result with ID: ${analysisData.id}`);
    console.log(
      `  📊 Validation: ${validationStatus} (${validationIssues.length} issues, ${validationWarnings.length} warnings)`
    );
    console.log(
      `  📏 Gauge readings: ${
        consolidatedAnalysis.overall_metrics?.gauge_readings_found || 0
      } found`
    );

    // Update primary image flags based on AI selection
    if (
      consolidatedAnalysis.primary_image_selection?.selected_image_index !==
      undefined
    ) {
      await updatePrimaryImageFlags(
        supabase,
        gemstoneId,
        consolidatedAnalysis.primary_image_selection,
        consolidatedAnalysis.processing_metadata?.image_batch_info || []
      );
    }

    // Mark gemstone as analyzed with enhanced metadata
    await markGemstoneAsAnalyzed(supabase, gemstoneId, consolidatedAnalysis);

    // Save individual gauge readings for detailed tracking
    if (consolidatedAnalysis.consolidated_data?.all_gauge_readings) {
      await saveGaugeReadings(
        supabase,
        gemstoneId,
        analysisData.id,
        consolidatedAnalysis.consolidated_data.all_gauge_readings
      );
    }

    return analysisData;
  } catch (error) {
    console.error(
      `❌ Error saving analysis for gemstone ${gemstoneId}: ${error.message}`
    );
    throw error;
  }
}

/**
 * Save detailed gauge readings for tracking measurement extraction
 */
async function saveGaugeReadings(
  supabase,
  gemstoneId,
  analysisId,
  gaugeReadings
) {
  if (!gaugeReadings || gaugeReadings.length === 0) return;

  console.log(`📏 Saving ${gaugeReadings.length} gauge readings...`);

  try {
    // Create gauge reading records
    const gaugeRecords = gaugeReadings.map((reading) => ({
      gemstone_id: gemstoneId,
      analysis_id: analysisId,
      device_type: reading.device_type,
      measurement_type: reading.measurement_type,
      reading_value: reading.reading_value,
      unit: reading.unit,
      confidence: reading.confidence || 0,
      display_text: reading.display_text || reading.needle_position || "",
      image_index: reading.image_index || 0,
      extraction_notes: reading.needle_position
        ? `Analog gauge: ${reading.needle_position}`
        : "Digital display reading",
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("ai_gauge_readings")
      .insert(gaugeRecords);

    if (error) {
      console.warn(`⚠️ Failed to save gauge readings: ${error.message}`);
      // Don't throw - gauge readings are supplementary data
    } else {
      console.log(`✅ Saved ${gaugeRecords.length} gauge readings`);

      // Log summary by measurement type
      const byType = gaugeRecords.reduce((acc, reading) => {
        acc[reading.measurement_type] =
          (acc[reading.measurement_type] || 0) + 1;
        return acc;
      }, {});

      Object.entries(byType).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count} reading(s)`);
      });
    }
  } catch (error) {
    console.warn(`⚠️ Error saving gauge readings: ${error.message}`);
    // Don't throw - gauge readings are supplementary data
  }
}

/**
 * Update primary image flags based on AI selection
 */
async function updatePrimaryImageFlags(
  supabase,
  gemstoneId,
  primarySelection,
  imageBatchInfo
) {
  console.log(`🎯 Updating primary image flags for gemstone ${gemstoneId}...`);

  try {
    // First, clear all existing primary flags for this gemstone
    const { error: clearError } = await supabase
      .from("gemstone_images")
      .update({ is_primary: false })
      .eq("gemstone_id", gemstoneId);

    if (clearError) {
      throw new Error(`Failed to clear primary flags: ${clearError.message}`);
    }

    // Set the AI-selected image as primary
    const selectedImageIndex = primarySelection.selected_image_index;
    const selectedImageInfo = imageBatchInfo[selectedImageIndex];

    if (selectedImageInfo) {
      const { error: setPrimaryError } = await supabase
        .from("gemstone_images")
        .update({
          is_primary: true,
          ai_primary_score: primarySelection.score || 0,
          ai_primary_reasoning:
            primarySelection.reasoning || "Selected by AI analysis",
        })
        .eq("id", selectedImageInfo.image_id);

      if (setPrimaryError) {
        throw new Error(
          `Failed to set primary image: ${setPrimaryError.message}`
        );
      }

      console.log(
        `✅ Set image ${selectedImageInfo.filename} as primary (score: ${primarySelection.score})`
      );
    }
  } catch (error) {
    console.error(`❌ Error updating primary image flags: ${error.message}`);
    // Don't throw here - analysis save is more important than primary flag updates
  }
}

/**
 * Mark gemstone as analyzed with metadata
 */
async function markGemstoneAsAnalyzed(
  supabase,
  gemstoneId,
  consolidatedAnalysis
) {
  try {
    const { error } = await supabase
      .from("gemstones")
      .update({
        ai_analyzed: true,
        ai_analysis_date: new Date().toISOString(),
        ai_confidence_score:
          consolidatedAnalysis.overall_metrics?.confidence_score || 0,
        ai_data_completeness:
          consolidatedAnalysis.overall_metrics?.data_completeness || 0,
      })
      .eq("id", gemstoneId);

    if (error) {
      throw new Error(`Failed to mark gemstone as analyzed: ${error.message}`);
    }

    console.log(`✅ Marked gemstone ${gemstoneId} as analyzed`);
  } catch (error) {
    console.error(`❌ Error marking gemstone as analyzed: ${error.message}`);
    console.error(`🔧 This will cause UI to show "AI Analysis Not Available"`);
    console.error(`💡 Manual fix: UPDATE gemstones SET ai_analyzed = true WHERE id = '${gemstoneId}'`);
    // Don't throw here - analysis save is more important
  }
}

/**
 * Get gemstones that need multi-image analysis
 */
export async function getGemstonesForAnalysis(
  supabase,
  limit = null,
  specificGemstoneIds = null
) {
  console.log(`🔍 Fetching gemstones for multi-image analysis...`);

  try {
    let query = supabase.from("gemstones").select(
      `
        id,
        serial_number,
        name,
        color,
        cut,
        weight_carats,
        ai_analyzed,
        gemstone_images!inner (
          id,
          image_url,
          original_filename,
          image_order,
          is_primary
        )
      `
    );

    // If specific gemstones are requested, filter by those IDs
    if (specificGemstoneIds && specificGemstoneIds.length > 0) {
      query = query.in("id", specificGemstoneIds);
      console.log(
        `🎯 Targeting specific gemstones: ${specificGemstoneIds.join(", ")}`
      );
    } else {
      // Otherwise, only get unanalyzed gemstones
      query = query.eq("ai_analyzed", false);
    }

    query = query.order("created_at", { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: gemstones, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch gemstones: ${error.message}`);
    }

    // Filter out gemstones without images
    const gemstonesWithImages = gemstones.filter(
      (g) => g.gemstone_images && g.gemstone_images.length > 0
    );

    console.log(
      `📊 Found ${gemstonesWithImages.length} gemstones ready for analysis`
    );
    console.log(
      `📸 Total images to process: ${gemstonesWithImages.reduce(
        (sum, g) => sum + g.gemstone_images.length,
        0
      )}`
    );

    return gemstonesWithImages;
  } catch (error) {
    console.error(`❌ Error fetching gemstones for analysis: ${error.message}`);
    throw error;
  }
}

/**
 * Clear existing AI analysis data for fresh re-analysis
 */
export async function clearExistingAnalysis(supabase, gemstoneIds = null) {
  console.log(`🧹 Clearing existing AI analysis data...`);

  try {
    // Clear analysis results
    let deleteQuery = supabase.from("ai_analysis_results").delete();

    if (gemstoneIds && gemstoneIds.length > 0) {
      deleteQuery = deleteQuery.in("gemstone_id", gemstoneIds);
      console.log(`🎯 Targeting specific gemstones: ${gemstoneIds.join(", ")}`);
    } else {
      deleteQuery = deleteQuery.neq(
        "id",
        "00000000-0000-0000-0000-000000000000"
      ); // Delete all
      console.log(`🎯 Clearing ALL analysis data`);
    }

    const { error: deleteError } = await deleteQuery;
    if (deleteError) {
      throw new Error(
        `Failed to clear analysis results: ${deleteError.message}`
      );
    }

    // Reset gemstone flags
    let updateGemstoneQuery = supabase.from("gemstones").update({
      ai_analyzed: false,
      ai_analysis_date: null,
      ai_confidence_score: null,
      ai_data_completeness: null,
    });

    if (gemstoneIds && gemstoneIds.length > 0) {
      updateGemstoneQuery = updateGemstoneQuery.in("id", gemstoneIds);
    } else {
      updateGemstoneQuery = updateGemstoneQuery.neq(
        "id",
        "00000000-0000-0000-0000-000000000000"
      );
    }

    const { error: updateGemstoneError } = await updateGemstoneQuery;
    if (updateGemstoneError) {
      throw new Error(
        `Failed to reset gemstone flags: ${updateGemstoneError.message}`
      );
    }

    // Reset image flags
    let updateImageQuery = supabase.from("gemstone_images").update({
      ai_primary_score: null,
      ai_primary_reasoning: null,
    });

    if (gemstoneIds && gemstoneIds.length > 0) {
      updateImageQuery = updateImageQuery.in("gemstone_id", gemstoneIds);
    } else {
      updateImageQuery = updateImageQuery.neq(
        "id",
        "00000000-0000-0000-0000-000000000000"
      );
    }

    const { error: updateImageError } = await updateImageQuery;
    if (updateImageError) {
      throw new Error(
        `Failed to reset image flags: ${updateImageError.message}`
      );
    }

    console.log(`✅ Successfully cleared existing analysis data`);
  } catch (error) {
    console.error(`❌ Error clearing analysis data: ${error.message}`);
    throw error;
  }
}

/**
 * Get analysis statistics from database
 */
export async function getAnalysisStatistics(supabase) {
  try {
    // Count total gemstones
    const { count: totalGemstones } = await supabase
      .from("gemstones")
      .select("*", { count: "exact", head: true });

    // Count analyzed gemstones
    const { count: analyzedGemstones } = await supabase
      .from("gemstones")
      .select("*", { count: "exact", head: true })
      .eq("ai_analyzed", true);

    // Count total images
    const { count: totalImages } = await supabase
      .from("gemstone_images")
      .select("*", { count: "exact", head: true });

    // Get cost and processing stats
    const { data: costStats } = await supabase
      .from("ai_analysis_results")
      .select("processing_cost_usd, processing_time_ms")
      .eq("analysis_type", "multi_image_comprehensive");

    const totalCost =
      costStats?.reduce(
        (sum, stat) => sum + (stat.processing_cost_usd || 0),
        0
      ) || 0;
    const totalTime =
      costStats?.reduce(
        (sum, stat) => sum + (stat.processing_time_ms || 0),
        0
      ) || 0;

    return {
      totalGemstones: totalGemstones || 0,
      analyzedGemstones: analyzedGemstones || 0,
      totalImages: totalImages || 0,
      analysisCount: costStats?.length || 0,
      totalCostUSD: totalCost,
      totalProcessingTimeMs: totalTime,
      successRate:
        totalGemstones > 0
          ? ((analyzedGemstones / totalGemstones) * 100).toFixed(1)
          : "0",
    };
  } catch (error) {
    console.error(`❌ Error getting analysis statistics: ${error.message}`);
    return {
      totalGemstones: 0,
      analyzedGemstones: 0,
      totalImages: 0,
      analysisCount: 0,
      totalCostUSD: 0,
      totalProcessingTimeMs: 0,
      successRate: "0",
    };
  }
}

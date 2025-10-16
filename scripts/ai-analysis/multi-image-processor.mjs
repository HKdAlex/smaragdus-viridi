function extractResponseText(response) {
  // For Chat Completions API
  const content = response?.choices?.[0]?.message?.content;
  if (!content) {
    // Log response structure for debugging
    console.error(
      `❌ Response structure:`,
      JSON.stringify(response, null, 2).substring(0, 500)
    );
    throw new Error("OpenAI response missing text content");
  }

  // Log response size for monitoring
  console.log(`  📦 Response size: ${(content.length / 1024).toFixed(1)}KB`);

  return content;
}
/**
 * 🔗 Multi-Image AI Analysis Processor
 *
 * Handles analysis of all images for a gemstone in a single API request,
 * providing comprehensive data consolidation and cross-verification.
 *
 * @author Crystallique Team
 * @version 3.1.0 - ENHANCED VALIDATION
 * @date 2025-01-19
 */

import { calculateActualCost, getModelConfig } from "./model-config.mjs";

import { COMPREHENSIVE_MULTI_IMAGE_PROMPT_V4 } from "./prompts-v4.mjs";
// NOTE: Not using json_schema anymore - vision models don't support it reliably
// import { GEMSTONE_ANALYSIS_SCHEMA_SIMPLE } from "./json-schema-simple.mjs";
import OpenAI from "openai";
import { downloadImageAsBase64 } from "./image-utils.mjs";

// Initialize OpenAI client
let openai;

/**
 * Initialize OpenAI client (called from main script)
 */
export function initializeOpenAI(apiKey) {
  openai = new OpenAI({ apiKey });
}

/**
 * Process all images for a gemstone in a single API request
 */
export async function analyzeGemstoneBatch(images, gemstoneId, supabase) {
  // Read model from env each time (allows dynamic switching in tests)
  // NOTE: Structured outputs don't work with vision models!
  // Using regular JSON mode + robust parser instead
  const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-5-mini";
  console.log(
    `\n🔍 Analyzing ${images.length} images for gemstone ${gemstoneId} in single batch...`
  );

  try {
    // Download all images as base64
    const imageData = await Promise.all(
      images.map(async (image, index) => {
        const filename =
          image.original_filename ||
          image.image_url.split("/").pop() ||
          `image_${index + 1}`;
        console.log(
          `  📸 Downloading image ${index + 1}/${images.length}: ${filename}`
        );
        const base64 = await downloadImageAsBase64(image.image_url);
        return {
          imageId: image.id,
          filename: filename,
          base64: base64,
          order: image.image_order || index,
        };
      })
    );

    console.log(
      `  🤖 Sending ${images.length} images to AI for comprehensive analysis...`
    );

    // Create multi-image content array
    const promptTemplate = COMPREHENSIVE_MULTI_IMAGE_PROMPT_V4;

    const content = [
      {
        type: "text",
        text: promptTemplate.replace(
          /{IMAGE_COUNT}/g,
          images.length.toString()
        ),
      },
      // Add all images to the request
      ...imageData.map((img, index) => ({
        type: "image_url",
        image_url: {
          url: img.base64,
        },
      })),
    ];

    const startTime = Date.now();

    // Single API call for all images
    const modelConfig = getModelConfig(VISION_MODEL);
    console.log(`  🤖 Using model: ${VISION_MODEL}`);

    // Build request parameters with STRUCTURED OUTPUT
    const requestParams = {
      model: VISION_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a precise gemstone analysis expert. Analyze all images and provide structured JSON measurements.",
        },
        {
          role: "user",
          content,
        },
      ],
      max_completion_tokens: modelConfig.max_tokens,
      // Use regular JSON mode - no schema enforcement
      // Vision models don't reliably support json_schema format
      response_format: { type: "json_object" },
    };

    // Add reasoning_effort for GPT-5 models (controls thinking depth)
    if (modelConfig.reasoning_effort) {
      requestParams.reasoning_effort = modelConfig.reasoning_effort;
    }

    const response = await openai.chat.completions.create(requestParams);

    const processingTime = Date.now() - startTime;
    const usage = response.usage || {};
    const totalTokens = usage.total_tokens || 0;
    const cost = calculateCost(VISION_MODEL, totalTokens, usage);

    console.log(`  ✅ Multi-image analysis completed in ${processingTime}ms`);
    console.log(`  💰 Cost: $${cost.toFixed(4)} for ${images.length} images`);

    // Parse and validate the comprehensive response
    const consolidatedAnalysis = parseAndValidateMultiImageResponse(
      extractResponseText(response),
      imageData,
      totalTokens,
      processingTime,
      cost,
      VISION_MODEL
    );

    // Check validation status
    if (!consolidatedAnalysis.validation_passed) {
      console.warn(`⚠️ Analysis validation failed:`);
      consolidatedAnalysis.validation_issues.forEach((issue) => {
        console.warn(`  - ${issue}`);
      });

      // If analysis is critically incomplete, fail the request
      if (
        consolidatedAnalysis.validation_issues.some(
          (issue) => issue.includes("INCOMPLETE") || issue.includes("INVALID")
        )
      ) {
        throw new Error(
          `Critical validation failure: ${consolidatedAnalysis.validation_issues.join(
            ", "
          )}`
        );
      }
    }

    // Save to database
    console.log(`  💾 Saving consolidated analysis to database...`);
    const { saveMultiImageAnalysis } = await import(
      "./database-operations.mjs"
    );
    await saveMultiImageAnalysis(supabase, gemstoneId, consolidatedAnalysis);

    return {
      success: true,
      consolidatedAnalysis,
      cost,
      processingTime,
      imageCount: images.length,
      validationPassed: consolidatedAnalysis.validation_passed,
      validationIssues: consolidatedAnalysis.validation_issues,
    };
  } catch (error) {
    console.error(`❌ Error in multi-image analysis: ${error.message}`);
    return {
      success: false,
      error: error.message,
      cost: 0,
      processingTime: 0,
      imageCount: images.length,
      validationPassed: false,
    };
  }
}

/**
 * Normalize GPT-5 response format to our expected structure
 */
function normalizeGPT5Response(parsedData) {
  // GPT-5-mini returns different structures - check for common patterns
  const hasGPT5Format =
    parsedData.overall_summary ||
    parsedData.summary ||
    parsedData.dataset_summary ||
    parsedData.aggregate_extraction ||
    parsedData.aggregate_inferences ||
    parsedData.individual_analyses ||
    parsedData.image_count;

  if (hasGPT5Format) {
    console.log(`  🔄 Detected GPT-5 format, normalizing...`);

    // Extract individual analyses from various locations
    const individualAnalyses =
      parsedData.individual_analyses ||
      parsedData.images ||
      parsedData.per_image_analysis ||
      [];

    // Extract consolidated/aggregate data from various locations
    const aggregateData =
      parsedData.aggregate_extraction ||
      parsedData.aggregate_inferences ||
      parsedData.aggregate_analysis ||
      parsedData.overall_summary ||
      parsedData.summary ||
      {};

    // Extract measurements and dimensions from multiple possible locations
    const measurements =
      aggregateData.measurements ||
      aggregateData.dimensions ||
      aggregateData.inferred_dimensions ||
      parsedData.measurements ||
      {};

    // Extract color data
    const colorData =
      aggregateData.color ||
      aggregateData.color_assessment ||
      aggregateData.inferred_color ||
      parsedData.color ||
      {};

    // Extract clarity data
    const clarityData =
      aggregateData.clarity ||
      aggregateData.clarity_grade ||
      aggregateData.inferred_clarity ||
      parsedData.clarity ||
      null;

    // Extract cut/shape data
    const cutData =
      aggregateData.cut ||
      aggregateData.shape ||
      aggregateData.cut_quality ||
      aggregateData.inferred_cut ||
      parsedData.cut ||
      {};

    // Extract quality assessment
    const qualityData =
      aggregateData.quality_assessment ||
      aggregateData.quality_grade ||
      aggregateData.overall_quality ||
      parsedData.quality ||
      {};

    // Extract origin/treatment data
    const origin =
      aggregateData.origin || aggregateData.source || parsedData.origin || null;

    const treatment =
      aggregateData.treatment ||
      aggregateData.treatments ||
      parsedData.treatment ||
      null;

    // Extract primary image info from various possible locations
    const primaryImageData =
      parsedData.primary_image ||
      parsedData.best_image ||
      aggregateData.primary_image ||
      {};

    const primaryImageIndex =
      primaryImageData.index ||
      primaryImageData.image_index ||
      parsedData.dataset_summary?.primary_image_index ||
      null;

    const primaryImageScore =
      primaryImageData.score ||
      primaryImageData.confidence ||
      primaryImageData.quality_score ||
      parsedData.dataset_summary?.primary_image_score ||
      0;

    // Extract overall confidence from many possible locations
    const overallConfidence =
      parsedData.overall_confidence ||
      parsedData.confidence ||
      aggregateData.confidence ||
      aggregateData.overall_confidence ||
      parsedData.confidence_summary?.overall ||
      parsedData.aggregate_extraction?.cross_verification
        ?.overall_consistency_score ||
      0;

    return {
      validation: {
        total_images_analyzed:
          parsedData.image_count ||
          parsedData.total_images ||
          parsedData.dataset_summary?.images_processed ||
          individualAnalyses.length ||
          0,
        analysis_complete: true,
        missing_images: [],
      },
      individual_analyses: individualAnalyses,
      consolidated_data: {
        all_gauge_readings: extractAllGaugeReadings(individualAnalyses),
        measurement_summary: {
          dimensions: measurements,
          weight: measurements.weight_carats || measurements.weight || null,
          length_mm: measurements.length_mm || measurements.length || null,
          width_mm: measurements.width_mm || measurements.width || null,
          depth_mm: measurements.depth_mm || measurements.depth || null,
        },
        color_assessment: {
          primary_color:
            colorData.primary || colorData.primary_color || colorData,
          secondary_colors:
            colorData.secondary || colorData.secondary_colors || [],
          saturation: colorData.saturation || null,
          tone: colorData.tone || null,
        },
        clarity_grade:
          typeof clarityData === "string"
            ? clarityData
            : clarityData?.grade || null,
        cut_quality: {
          cut_type:
            typeof cutData === "string"
              ? cutData
              : cutData.type || cutData.cut_type || cutData.shape,
          quality: cutData.quality || cutData.grade || null,
        },
        quality_assessment: qualityData,
        lot_metadata: {
          origin: origin,
          source: origin,
        },
        treatment_assessment: Array.isArray(treatment)
          ? treatment.join(", ")
          : treatment,
      },
      primary_image_selection: {
        selected_image_index: primaryImageIndex,
        confidence: primaryImageScore,
        reasoning:
          primaryImageData.reasoning ||
          `Selected image ${primaryImageIndex} based on quality analysis`,
        sub_scores: primaryImageData.sub_scores || {},
      },
      data_verification: parsedData.cross_verification || {},
      overall_confidence: overallConfidence,
      overall_metrics: {
        quality_grade:
          qualityData.overall_grade || qualityData.grade || qualityData,
      },
      data_completeness:
        parsedData.confidence_summary?.overall || overallConfidence || 0.85,
      cross_verification_score:
        parsedData.cross_verification?.confidence ||
        aggregateData.cross_verification?.overall_consistency_score ||
        overallConfidence,
    };
  }

  // Return as-is if already in expected format
  return parsedData;
}

/**
 * Extract all gauge readings from individual analyses
 */
function extractAllGaugeReadings(individualAnalyses) {
  const readings = [];
  for (const analysis of individualAnalyses) {
    if (
      analysis.measurements_detected &&
      Array.isArray(analysis.measurements_detected)
    ) {
      for (const measurement of analysis.measurements_detected) {
        readings.push({
          image_index: analysis.image_index,
          subject: measurement.subject,
          value: measurement.value,
          unit: measurement.unit,
          device: measurement.device,
          uncertainty:
            measurement.uncertainty_mm || measurement.uncertainty_ct || 0,
        });
      }
    }
  }
  return readings;
}

/**
 * Parse and validate the comprehensive multi-image AI response
 */
function parseAndValidateMultiImageResponse(
  responseText,
  imageData,
  totalTokens,
  processingTime,
  cost,
  modelName
) {
  try {
    // Extract JSON from response - handle markdown code blocks and multiple JSON blocks
    let jsonString = null;

    // First, try to extract from markdown code blocks (```json ... ```)
    const codeBlockMatch = responseText.match(
      /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
    );
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1];
      console.log(`  📝 Found JSON in markdown code block`);
    } else {
      // Try to extract the complete JSON object (greedy match from first { to last })
      const firstBrace = responseText.indexOf("{");
      const lastBrace = responseText.lastIndexOf("}");

      if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        throw new Error("No valid JSON structure found in AI response");
      }

      jsonString = responseText.substring(firstBrace, lastBrace + 1);
      console.log(
        `  📝 Extracted JSON from position ${firstBrace} to ${lastBrace}`
      );
    }

    // Log response details for debugging
    console.log(`  📦 Raw response length: ${responseText.length} chars`);
    console.log(`  🔍 Extracted JSON length: ${jsonString.length} characters`);
    console.log(`  📝 First 150 chars: ${jsonString.substring(0, 150)}...`);
    console.log(
      `  📝 Last 150 chars: ...${jsonString.substring(
        Math.max(0, jsonString.length - 150)
      )}`
    );
    let parsedData = JSON.parse(jsonString);

    // Normalize GPT-5 format to our expected structure
    parsedData = normalizeGPT5Response(parsedData);

    // Validate the response
    const validationResult = validateAnalysisCompleteness(
      parsedData,
      imageData
    );

    // Create consolidated analysis result
    const consolidatedAnalysis = {
      // Validation results
      validation_passed: validationResult.passed,
      validation_issues: validationResult.issues,
      validation_warnings: validationResult.warnings,

      // Consolidated data from all images
      consolidated_data: parsedData.consolidated_data || {},

      // Individual image analysis results
      individual_analyses: parsedData.individual_analyses || [],

      // Cross-verification and conflict resolution
      data_verification: parsedData.data_verification || {},

      // Primary image selection with reasoning
      primary_image_selection: parsedData.primary_image_selection || {},

      // Overall confidence and quality metrics
      overall_metrics: {
        confidence_score: parsedData.overall_confidence || 0,
        data_completeness: parsedData.data_completeness || 0,
        cross_verification_score: parsedData.cross_verification_score || 0,
        primary_image_confidence:
          parsedData.primary_image_selection?.confidence || 0,
        images_analyzed: parsedData.individual_analyses?.length || 0,
        expected_images: imageData.length,
        gauge_readings_found:
          parsedData.consolidated_data?.all_gauge_readings?.length || 0,
      },

      // Processing metadata
      processing_metadata: {
        total_images_analyzed: imageData.length,
        processing_time_ms: processingTime,
        processing_cost_usd: cost,
        total_tokens: totalTokens,
        ai_model_version: modelName,
        analysis_date: new Date().toISOString(),
        image_batch_info: imageData.map((img) => ({
          image_id: img.imageId,
          filename: img.filename,
          order: img.order,
        })),
        validation_metadata: validationResult,
      },

      // Raw response for debugging
      raw_ai_response: responseText,
    };

    return consolidatedAnalysis;
  } catch (error) {
    console.error(`❌ Error parsing multi-image response: ${error.message}`);

    // Return basic structure even if parsing fails
    return {
      validation_passed: false,
      validation_issues: [`JSON parsing failed: ${error.message}`],
      validation_warnings: [],
      consolidated_data: {},
      individual_analyses: [],
      data_verification: {},
      primary_image_selection: {},
      overall_metrics: {
        confidence_score: 0,
        data_completeness: 0,
        cross_verification_score: 0,
        primary_image_confidence: 0,
        images_analyzed: 0,
        expected_images: imageData.length,
        gauge_readings_found: 0,
      },
      processing_metadata: {
        total_images_analyzed: imageData.length,
        processing_time_ms: processingTime,
        processing_cost_usd: cost,
        total_tokens: totalTokens,
        ai_model_version: "gpt-4o",
        analysis_date: new Date().toISOString(),
        image_batch_info: imageData.map((img) => ({
          image_id: img.imageId,
          filename: img.filename,
          order: img.order,
        })),
        parsing_error: error.message,
      },
      raw_ai_response: responseText,
    };
  }
}

/**
 * Validate that the AI response contains complete analysis
 */
function validateAnalysisCompleteness(parsedData, imageData) {
  const issues = [];
  const warnings = [];
  let passed = true;

  const expectedImageCount = imageData.length;

  // Check validation section
  if (!parsedData.validation) {
    issues.push("Missing validation section in AI response");
    passed = false;
  } else {
    if (parsedData.validation.total_images_analyzed !== expectedImageCount) {
      issues.push(
        `AI reported analyzing ${parsedData.validation.total_images_analyzed} images but ${expectedImageCount} were provided`
      );
      passed = false;
    }

    if (!parsedData.validation.analysis_complete) {
      issues.push("AI marked analysis as incomplete");
      passed = false;
    }

    if (
      parsedData.validation.missing_images &&
      parsedData.validation.missing_images.length > 0
    ) {
      issues.push(
        `AI reported missing images: ${parsedData.validation.missing_images.join(
          ", "
        )}`
      );
      passed = false;
    }
  }

  // Check individual analyses
  if (
    !parsedData.individual_analyses ||
    !Array.isArray(parsedData.individual_analyses)
  ) {
    issues.push("Missing or invalid individual_analyses array");
    passed = false;
  } else {
    const actualAnalysisCount = parsedData.individual_analyses.length;
    if (actualAnalysisCount !== expectedImageCount) {
      issues.push(
        `INCOMPLETE ANALYSIS: Expected ${expectedImageCount} individual analyses, got ${actualAnalysisCount}`
      );
      passed = false;
    }

    // Check for sequential image indices
    const indices = parsedData.individual_analyses
      .map((a) => a.image_index)
      .sort();
    const expectedIndices = Array.from(
      { length: expectedImageCount },
      (_, i) => i + 1
    );
    const missingIndices = expectedIndices.filter((i) => !indices.includes(i));
    if (missingIndices.length > 0) {
      issues.push(
        `Missing analysis for image indices: ${missingIndices.join(", ")}`
      );
      passed = false;
    }

    // Check that all images have classifications
    parsedData.individual_analyses.forEach((analysis, idx) => {
      if (!analysis.image_classification) {
        warnings.push(
          `Image ${analysis.image_index || idx + 1} missing classification`
        );
      }
      if (!analysis.confidence || analysis.confidence < 0.1) {
        warnings.push(
          `Image ${analysis.image_index || idx + 1} has very low confidence`
        );
      }
    });
  }

  // Check gauge readings extraction
  const allGaugeReadings =
    parsedData.consolidated_data?.all_gauge_readings || [];
  if (allGaugeReadings.length === 0) {
    warnings.push(
      "No measurement gauge readings found - verify images contain measuring devices"
    );
  } else {
    console.log(
      `  📏 Found ${allGaugeReadings.length} measurement gauge readings`
    );

    // Check for specific measurement types
    const measurementTypes = allGaugeReadings.map((r) => r.measurement_type);
    if (
      !measurementTypes.includes("depth") &&
      !measurementTypes.includes("thickness")
    ) {
      warnings.push(
        "No depth/thickness measurements found - check for analog thickness gauges"
      );
    }
    if (!measurementTypes.includes("weight")) {
      warnings.push("No weight measurements found - check for digital scales");
    }
  }

  // Check data consolidation
  if (!parsedData.consolidated_data) {
    issues.push("Missing consolidated_data section");
    passed = false;
  }

  // Check primary image selection
  if (
    !parsedData.primary_image_selection ||
    !parsedData.primary_image_selection.selected_image_index
  ) {
    warnings.push("No primary image selected");
  }

  return {
    passed,
    issues,
    warnings,
    expected_images: expectedImageCount,
    actual_analyses: parsedData.individual_analyses?.length || 0,
    gauge_readings_found: allGaugeReadings.length,
    validation_timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate cost based on token usage
 */
function calculateCost(modelName, totalTokens, usage) {
  if (usage?.prompt_tokens && usage?.completion_tokens) {
    return calculateActualCost(
      modelName,
      usage.prompt_tokens,
      usage.completion_tokens
    );
  }

  const model = getModelConfig(modelName);
  const inputTokens = totalTokens * 0.8;
  const outputTokens = totalTokens * 0.2;

  const inputCost = (inputTokens / 1000) * model.pricing.input_per_1k;
  const outputCost = (outputTokens / 1000) * model.pricing.output_per_1k;

  return inputCost + outputCost;
}

/**
 * Validate that all required images are available and accessible
 */
export async function validateImageBatch(images) {
  const validationResults = {
    valid: [],
    invalid: [],
    totalSize: 0,
  };

  for (const image of images) {
    try {
      if (!image.image_url) {
        validationResults.invalid.push({
          id: image.id,
          reason: "Missing image URL",
        });
        continue;
      }

      // For now, assume images are valid if they have URLs
      // Could add actual URL validation here if needed
      validationResults.valid.push(image);
    } catch (error) {
      validationResults.invalid.push({
        id: image.id,
        reason: error.message,
      });
    }
  }

  return validationResults;
}

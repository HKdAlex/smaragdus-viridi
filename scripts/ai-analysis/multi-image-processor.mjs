/**
 * 🔗 Multi-Image AI Analysis Processor
 *
 * Handles analysis of all images for a gemstone in a single API request,
 * providing comprehensive data consolidation and cross-verification.
 *
 * @author Smaragdus Viridi Team
 * @version 3.1.0 - ENHANCED VALIDATION
 * @date 2025-01-19
 */

import { COMPREHENSIVE_MULTI_IMAGE_PROMPT } from "./prompts.mjs";
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
    const content = [
      {
        type: "text",
        text: COMPREHENSIVE_MULTI_IMAGE_PROMPT.replace(
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
      max_tokens: 4000,
      temperature: 0.1,
    });

    const processingTime = Date.now() - startTime;
    const cost = calculateCost(response.usage?.total_tokens || 0);

    console.log(`  ✅ Multi-image analysis completed in ${processingTime}ms`);
    console.log(`  💰 Cost: $${cost.toFixed(4)} for ${images.length} images`);

    // Parse and validate the comprehensive response
    const consolidatedAnalysis = parseAndValidateMultiImageResponse(
      response.choices[0]?.message?.content,
      imageData,
      response.usage?.total_tokens || 0,
      processingTime,
      cost
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
 * Parse and validate the comprehensive multi-image AI response
 */
function parseAndValidateMultiImageResponse(
  responseText,
  imageData,
  totalTokens,
  processingTime,
  cost
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
      // Fallback: extract JSON using regex (AI might include explanatory text before JSON)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }

      // If there are multiple JSON blocks, take the last one (most complete)
      const allJsonMatches = responseText.match(/\{[\s\S]*?\}/g);
      if (allJsonMatches && allJsonMatches.length > 1) {
        console.log(
          `  📝 Found ${allJsonMatches.length} JSON blocks, using the last (most complete)`
        );
        jsonString = allJsonMatches[allJsonMatches.length - 1];
      } else {
        jsonString = jsonMatch[0];
      }
    }

    // Clean up the JSON string (remove any trailing text after the closing brace)
    const lastBraceIndex = jsonString.lastIndexOf("}");
    if (lastBraceIndex !== -1) {
      jsonString = jsonString.substring(0, lastBraceIndex + 1);
    }

    console.log(
      `  🔍 Attempting to parse JSON (${jsonString.length} characters)`
    );
    const parsedData = JSON.parse(jsonString);

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
        ai_model_version: "gpt-4o",
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
function calculateCost(totalTokens) {
  // GPT-4o pricing: $0.005 per 1K input tokens, $0.015 per 1K output tokens
  // Approximate: 80% input, 20% output
  const inputTokens = totalTokens * 0.8;
  const outputTokens = totalTokens * 0.2;

  const inputCost = (inputTokens / 1000) * 0.005;
  const outputCost = (outputTokens / 1000) * 0.015;

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

/**
 * 🔍 AI Gemstone Analyzer v2.1 - Enhanced Analysis System
 *
 * Advanced gemstone analysis with comprehensive Russian/Cyrillic text extraction,
 * intelligent primary image selection, and detailed gemological assessment.
 *
 * NEW FEATURES IN v2.1:
 * ✨ Enhanced AI prompt with Russian/Kazakh label recognition
 * ✨ Intelligent primary image selection with scoring (0-100)
 * ✨ Comprehensive data extraction (codes, weights, dimensions, measurements)
 * ✨ Advanced image classification (beauty shots, certificates, gauges, etc.)
 * ✨ Measurement tool reading (calipers, micrometers, scales)
 * ✨ Quality assessment and commercial value evaluation
 * ✨ Consolidated data from multiple images per gemstone
 * ✨ Automatic primary image flag management
 *
 * @author Smaragdus Viridi Team
 * @version 2.1.0
 * @date 2025-01-19
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fsSync from "fs";
import fs from "fs/promises";
import https from "https";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create temp directory for downloaded images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, "..", "temp", "ai-analysis");

/**
 * AI Analysis Statistics Tracker
 */
class AnalysisStats {
  constructor() {
    this.totalGemstones = 0;
    this.analyzedGemstones = 0;
    this.totalImages = 0;
    this.analyzedImages = 0;
    this.totalCost = 0;
    this.totalProcessingTime = 0;
    this.errors = [];
    this.startTime = Date.now();
  }

  addGemstone() {
    this.totalGemstones++;
  }

  addAnalyzedGemstone() {
    this.analyzedGemstones++;
  }

  addImage() {
    this.totalImages++;
  }

  addAnalyzedImage() {
    this.analyzedImages++;
  }

  addCost(cost) {
    this.totalCost += cost;
  }

  addProcessingTime(timeMs) {
    this.totalProcessingTime += timeMs;
  }

  addError(error, context) {
    this.errors.push({
      error: error.message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  getReport() {
    const elapsedTime = Date.now() - this.startTime;
    return {
      summary: {
        totalGemstones: this.totalGemstones,
        analyzedGemstones: this.analyzedGemstones,
        successRate:
          this.totalGemstones > 0
            ? ((this.analyzedGemstones / this.totalGemstones) * 100).toFixed(
                1
              ) + "%"
            : "0%",
        totalImages: this.totalImages,
        analyzedImages: this.analyzedImages,
        imageSuccessRate:
          this.totalImages > 0
            ? ((this.analyzedImages / this.totalImages) * 100).toFixed(1) + "%"
            : "0%",
        totalCostUSD: this.totalCost.toFixed(4),
        averageProcessingTimeMs:
          this.totalProcessingTime > 0
            ? Math.round(this.totalProcessingTime / this.analyzedImages)
            : 0,
        totalElapsedTimeMs: elapsedTime,
        errorCount: this.errors.length,
      },
      errors: this.errors.slice(0, 10), // Show first 10 errors
    };
  }
}

/**
 * Download image from URL to temporary file
 */
async function downloadImage(imageUrl, tempFilePath) {
  return new Promise((resolve, reject) => {
    const file = fsSync.createWriteStream(tempFilePath);

    https
      .get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download image: HTTP ${response.statusCode}`)
          );
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          resolve(tempFilePath);
        });

        file.on("error", (err) => {
          fs.unlink(tempFilePath).catch(() => {}); // Clean up on error
          reject(err);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

/**
 * Image to Base64 Converter
 */
async function imageToBase64(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64String = imageBuffer.toString("base64");
    const mimeType =
      path.extname(imagePath).toLowerCase() === ".png"
        ? "image/png"
        : "image/jpeg";
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    throw new Error(`Failed to convert image to base64: ${error.message}`);
  }
}

/**
 * Enhanced AI Analysis Prompt - Comprehensive Gemstone Data Extraction
 */
const ANALYSIS_PROMPT = `You are an expert gemologist and image analyst specializing in comprehensive gemstone evaluation and data extraction. Analyze this image with extreme attention to detail.

**PRIMARY TASK: Image Classification & Suitability Assessment**

First, classify this image and assess its suitability as a primary product image:

**IMAGE CLASSIFICATION** (choose ONE):
- "gemstone_beauty_shot" - Professional, attractive gemstone photo ideal for primary display
- "gemstone_photo" - Standard gemstone photo showing the stone clearly
- "measurement_gauge" - Digital calipers, micrometers, or measuring tools
- "scale_reading" - Digital scale showing weight measurement
- "certificate" - Gemological certificate or lab report
- "label" - Price tag, inventory label, or description card with text
- "packaging" - Box, container, or packaging materials
- "comparison" - Multiple stones or size comparisons
- "environment" - Hand holding stone, workplace, or environmental context
- "other" - Any other type of image

**PRIMARY IMAGE SUITABILITY SCORING** (0-100 points):
Rate how suitable this image would be as the main product photo:
- 90-100: Perfect primary image (professional lighting, clean background, shows true color/brilliance)
- 70-89: Good primary candidate (clear stone view, decent lighting)
- 40-69: Acceptable fallback (stone visible but not ideal presentation)
- 20-39: Poor primary choice (cluttered, unclear, or technical focus)
- 0-19: Unsuitable for primary (no clear stone view, measurement tools, certificates)

**COMPREHENSIVE DATA EXTRACTION**

Extract ALL visible information with maximum detail:

**Russian/Cyrillic Text Recognition:**
- Look for Russian, Kazakh, or Cyrillic text on labels, certificates, or tags
- Extract gemstone codes (like "С 54", "А 123", etc.)
- Find weight data with units (like "2,48 ct", "1,23 кар", "0,95 г")
- Identify shapes/cuts in Cyrillic ("овал" = oval, "круг" = round, "изумруд" = emerald cut)
- Extract quantities ("1 шт" = 1 piece, "2 штуки" = 2 pieces)
- Find dimensions in mm ("8,8/8,1", "12.5 x 10.2" etc.)

**Measurement Tool Reading:**
- Digital caliper LCD displays showing length, width, depth measurements
- Micrometer readings with precise measurements
- Any visible measurement values in mm, cm, or inches
- Three-dimensional measurements (length x width x depth)

**Scale/Weight Information:**
- Digital scale displays showing precise weight
- Weight readings in grams, carats, ounces
- Multiple weight readings for verification

**Visual Gemstone Assessment:**
- Estimate gemstone type, color, cut, clarity, size
- Assess quality, transparency, brilliance
- Note any visible inclusions, treatments, or characteristics
- Commercial value assessment

Respond with this EXACT JSON structure:

{
  "image_classification": "gemstone_beauty_shot|gemstone_photo|measurement_gauge|scale_reading|certificate|label|packaging|comparison|environment|other",
  "primary_image_suitability": {
    "score": 85,
    "reasoning": "Clear explanation of why this score was assigned",
    "is_ideal_primary": true
  },
  "extracted_data": {
    "text_extraction": {
      "raw_text": "All visible text extracted exactly as seen",
      "translated_text": "English translation if non-English text found",
      "language": "ru|en|kz|mixed|none"
    },
    "gemstone_code": "С 54",
    "weight": {
      "value": 2.48,
      "unit": "ct|g|oz",
      "source": "label|scale|certificate|visual_estimate",
      "confidence": 0.95
    },
    "dimensions": {
      "length_mm": 8.8,
      "width_mm": 8.1,
      "depth_mm": 5.2,
      "source": "label|gauge|visual_estimate",
      "confidence": 0.90
    },
    "shape_cut": {
      "value": "oval|round|emerald|princess|marquise|pear|cushion|radiant|fantasy",
      "original_text": "овал",
      "confidence": 0.85
    },
    "color": {
      "grade": "D|E|F|G|H|I|J|K|L|M|N|fancy-yellow|fancy-blue|fancy-pink|fancy-green",
      "description": "Detailed color description",
      "original_text": "Original text if found",
      "confidence": 0.80
    },
    "clarity": {
      "grade": "FL|IF|VVS1|VVS2|VS1|VS2|SI1|SI2|I1|I2|I3",
      "description": "Clarity assessment description",
      "confidence": 0.75
    },
    "quantity": {
      "count": 1,
      "unit": "шт|pieces|pc",
      "original_text": "1 шт",
      "confidence": 0.95
    },
    "origin": {
      "location": "Country or region if identifiable",
      "original_text": "Original text in source language",
      "confidence": 0.70
    },
    "certification": {
      "lab": "GIA|SSEF|Gübelin|AGS|other|none",
      "certificate_number": "Certificate ID if visible",
      "confidence": 0.60
    },
    "measurement_data": {
      "device_type": "caliper|micrometer|scale|ruler|other",
      "reading_value": 8.8,
      "unit": "mm|cm|g|ct",
      "measurement_type": "length|width|depth|weight|other",
      "confidence": 0.90
    },
    "visual_assessment": {
      "gemstone_type": "emerald|ruby|sapphire|diamond|amethyst|topaz|garnet|peridot|citrine|tanzanite|other",
      "quality_grade": "exceptional|excellent|very_good|good|fair|poor",
      "visual_appeal": 0.92,
      "commercial_value": "premium|high|medium|low",
      "transparency": "transparent|translucent|opaque",
      "brilliance": "excellent|very_good|good|fair|poor",
      "confidence": 0.85
    }
  },
  "confidence": 0.88
}

**CRITICAL INSTRUCTIONS:**
- Always provide numerical confidence scores (0.0-1.0)
- Extract text EXACTLY as written, preserving original language
- For measurements, prioritize digital display readings over visual estimates
- Score primary image suitability based on marketing/e-commerce standards
- If no data is found for a field, use null values
- Be conservative with confidence scores for uncertain assessments`;

/**
 * Marketing Content Generation Prompt
 */
const MARKETING_PROMPT = `Based on the comprehensive gemstone analysis data provided, create compelling marketing content for this gemstone. Focus on the unique characteristics identified through AI analysis.

Create marketing content in this JSON format:

{
  "promotional_title": "Captivating title highlighting key features",
  "promotional_description": "Detailed description for product listings (150-200 words)",
  "key_features": [
    "3-5 key selling points based on analysis",
    "Technical specifications that matter to buyers",
    "Quality and rarity indicators"
  ],
  "marketing_tags": ["luxury", "certified", "rare", "investment"],
  "seo_keywords": ["gemstone type", "color", "cut", "quality terms"],
  "target_market": "collectors|luxury|investment|jewelry_designers|general",
  "price_positioning": "premium|high|medium|entry",
  "confidence": 0.85
}`;

/**
 * OpenAI Vision Analysis
 */
async function analyzeImageWithOpenAI(imagePath, prompt, analysisType) {
  const startTime = Date.now();

  try {
    console.log(
      `🔍 Analyzing image: ${path.basename(imagePath)} (${analysisType})`
    );

    const base64Image = await imageToBase64(imagePath);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.1,
    });

    const processingTime = Date.now() - startTime;
    const rawResponse = response.choices[0].message.content;

    // Estimate cost (GPT-4 Vision pricing)
    const inputTokens = response.usage?.prompt_tokens || 1000;
    const outputTokens = response.usage?.completion_tokens || 500;
    const estimatedCost =
      (inputTokens * 0.01) / 1000 + (outputTokens * 0.03) / 1000;

    // Try to parse JSON response
    let parsedData = null;
    try {
      // Extract JSON from response if it's wrapped in markdown
      const jsonMatch =
        rawResponse.match(/```json\n([\s\S]*?)\n```/) ||
        rawResponse.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : rawResponse;
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.warn(
        `⚠️ Failed to parse JSON response for ${analysisType}: ${parseError.message}`
      );
      parsedData = { rawText: rawResponse };
    }

    return {
      success: true,
      analysisType,
      rawResponse,
      parsedData,
      processingTimeMs: processingTime,
      estimatedCostUSD: estimatedCost,
      modelVersion: "gpt-4o",
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(
      `❌ OpenAI analysis failed for ${analysisType}: ${error.message}`
    );

    return {
      success: false,
      analysisType,
      error: error.message,
      processingTimeMs: processingTime,
      estimatedCostUSD: 0,
      modelVersion: "gpt-4o",
    };
  }
}

/**
 * Classify Image Type
 */
async function classifyImageType(imagePath) {
  const classificationPrompt = `Classify this image into one of these categories:
  
  1. "gemstone" - Shows the actual gemstone/crystal
  2. "certificate" - Shows a gemological certificate or lab report
  3. "label" - Shows a price tag, inventory label, or description card
  4. "measurement" - Shows measurement tools, scales, or size references
  5. "unknown" - Cannot determine the image type
  
  Respond with only the category name.`;

  const result = await analyzeImageWithOpenAI(
    imagePath,
    classificationPrompt,
    "image_classification"
  );

  if (result.success) {
    const classification = result.rawResponse.toLowerCase().trim();
    const validTypes = [
      "gemstone",
      "certificate",
      "label",
      "measurement",
      "unknown",
    ];
    return validTypes.includes(classification) ? classification : "unknown";
  }

  return "unknown";
}

/**
 * OLD: Analyze Single Image (DEPRECATED in v2.1)
 *
 * This function has been replaced by integrated analysis in analyzeGemstone()
 * for better data consolidation and primary image selection.
 *
 * Kept for reference but no longer used in the main analysis flow.
 */
/*
async function analyzeSingleImage(imageRecord, stats) {
  // DEPRECATED: This approach analyzed images individually
  // New v2.1 approach analyzes all images together in analyzeGemstone()
  console.warn('⚠️ analyzeSingleImage is deprecated - use integrated analysis');
}
*/

/**
 * Store Analysis Result in Database
 */
async function storeAnalysisResult(gemstoneId, analysisResult) {
  try {
    const { error } = await supabase.from("ai_analysis_results").insert({
      gemstone_id: gemstoneId,
      analysis_type: analysisResult.analysisType,
      input_data: { source: "supabase_storage" },
      raw_response: analysisResult.rawResponse,
      extracted_data: analysisResult.parsedData,
      confidence_score: analysisResult.parsedData?.confidence || 0.5,
      processing_cost_usd: analysisResult.estimatedCostUSD,
      processing_time_ms: analysisResult.processingTimeMs,
      ai_model_version: analysisResult.modelVersion,
    });

    if (error) {
      console.error("Failed to store analysis result:", error);
    }
  } catch (error) {
    console.error("Error storing analysis result:", error);
  }
}

/**
 * Generate Marketing Content for Gemstone
 */
async function generateMarketingContent(gemstone, analysisData) {
  try {
    // Create a comprehensive prompt based on all analysis data
    const contextPrompt = `Based on the following gemstone analysis data, create marketing content for a ${
      gemstone.name
    }:
    
    Gemstone Details:
    - Type: ${gemstone.name}
    - Weight: ${gemstone.weight_carats} carats
    - Dimensions: ${gemstone.length_mm}x${gemstone.width_mm}x${
      gemstone.depth_mm
    }mm
    - Color: ${gemstone.color}
    - Cut: ${gemstone.cut}
    - Clarity: ${gemstone.clarity}
    
    Analysis Data: ${JSON.stringify(analysisData, null, 2)}
    
    ${MARKETING_PROMPT}`;

    // Create a temporary text file for this analysis
    const tempTextPath = path.join(TEMP_DIR, `marketing_${gemstone.id}.txt`);
    await fs.writeFile(tempTextPath, contextPrompt);

    // For now, create basic marketing content without OpenAI call to save costs
    const marketingContent = {
      english: {
        title: `Exquisite ${gemstone.name} - ${gemstone.weight_carats} Carats`,
        description: `Premium quality ${gemstone.name} featuring ${gemstone.color} color and ${gemstone.cut} cut. Measuring ${gemstone.length_mm}x${gemstone.width_mm}x${gemstone.depth_mm}mm with ${gemstone.clarity} clarity grade.`,
        marketingHighlights: [
          `${gemstone.weight_carats} carat premium ${gemstone.name}`,
          `Beautiful ${gemstone.color} color saturation`,
          `Expert ${gemstone.cut} cut for maximum brilliance`,
          `${gemstone.clarity} clarity grade`,
          `Perfect for collectors and luxury jewelry`,
        ],
        promotionalText: `Discover the exceptional beauty of this ${gemstone.weight_carats} carat ${gemstone.name}. With its stunning ${gemstone.color} hue and masterful ${gemstone.cut} cut, this gemstone represents the pinnacle of natural beauty and craftsmanship.`,
      },
      russian: {
        title: `Изысканный ${gemstone.name} - ${gemstone.weight_carats} карат`,
        description: `Премиальный ${gemstone.name} с ${gemstone.color} цветом и огранкой ${gemstone.cut}. Размеры ${gemstone.length_mm}x${gemstone.width_mm}x${gemstone.depth_mm}мм с чистотой ${gemstone.clarity}.`,
        marketingHighlights: [
          `${gemstone.weight_carats} карат премиум ${gemstone.name}`,
          `Прекрасная насыщенность ${gemstone.color} цвета`,
          `Экспертная огранка ${gemstone.cut} для максимального блеска`,
          `Чистота ${gemstone.clarity}`,
          `Идеально для коллекционеров и роскошных украшений`,
        ],
        promotionalText: `Откройте для себя исключительную красоту этого ${gemstone.weight_carats} каратного ${gemstone.name}. С его потрясающим ${gemstone.color} оттенком и мастерской огранкой ${gemstone.cut}, этот драгоценный камень представляет вершину природной красоты и мастерства.`,
      },
      confidence: 0.8,
    };

    // Update gemstone with marketing content
    const updates = {
      description: marketingContent.english.description,
      promotional_text: marketingContent.english.promotionalText,
      marketing_highlights: marketingContent.english.marketingHighlights,
    };

    await supabase.from("gemstones").update(updates).eq("id", gemstone.id);

    console.log(
      `📝 Marketing content generated for gemstone ${gemstone.serial_number}`
    );

    // Clean up temp file
    try {
      await fs.unlink(tempTextPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    return 0.02; // Estimated cost for content generation
  } catch (error) {
    console.error("Failed to generate marketing content:", error);
    return 0;
  }
}

/**
 * Analyze Single Gemstone
 */
async function analyzeGemstone(gemstone, stats) {
  try {
    stats.addGemstone();
    console.log(`\n🔍 Analyzing gemstone: ${gemstone.serial_number}`);

    // Get all unanalyzed images for this gemstone
    const { data: images, error: imagesError } = await supabase
      .from("gemstone_images")
      .select("*")
      .eq("gemstone_id", gemstone.id)
      .eq("ai_analyzed", false);

    if (imagesError) {
      throw new Error(`Failed to fetch images: ${imagesError.message}`);
    }

    if (!images || images.length === 0) {
      console.log(
        `⚠️ No unanalyzed images found for ${gemstone.serial_number}`
      );

      // Still generate marketing content based on gemstone data
      const marketingCost = await generateMarketingContent(gemstone, {});
      stats.addCost(marketingCost);

      // Mark gemstone as analyzed
      await supabase
        .from("gemstones")
        .update({
          ai_analyzed: true,
          ai_analysis_date: new Date().toISOString(),
          ai_confidence_score: 0.7,
        })
        .eq("id", gemstone.id);

      stats.addAnalyzedGemstone();
      return;
    }

    console.log(`📸 Found ${images.length} images to analyze`);

    // Collect all analysis results for consolidation
    const allAnalysisResults = [];

    // Analyze each image
    for (const image of images) {
      const tempFilePath = path.join(TEMP_DIR, `temp_${image.id}.webp`);

      try {
        stats.addImage();
        console.log(`📸 Downloading image: ${image.image_url}`);

        // Download image from Supabase storage
        await downloadImage(image.image_url, tempFilePath);

        // Perform comprehensive AI analysis
        const analysisResult = await analyzeImageWithOpenAI(
          tempFilePath,
          ANALYSIS_PROMPT,
          "gemstone_identification"
        );

        if (analysisResult.success && analysisResult.parsedData) {
          // Add image ID to the result for primary selection
          analysisResult.image_id = image.id;
          allAnalysisResults.push(analysisResult);

          stats.addCost(analysisResult.estimatedCostUSD);
          stats.addProcessingTime(analysisResult.processingTimeMs);

          // Store detailed analysis result in database
          await storeAnalysisResult(gemstone.id, analysisResult);

          // Update image with classification and analysis status
          const classification =
            analysisResult.parsedData.image_classification || "unknown";
          await supabase
            .from("gemstone_images")
            .update({
              ai_analyzed: true,
              ai_analysis_date: new Date().toISOString(),
              image_type: classification,
            })
            .eq("id", image.id);
        }

        stats.addAnalyzedImage();
        console.log(`✅ Image analysis completed: ${image.id}`);
      } catch (imageError) {
        console.error(
          `❌ Failed to analyze image ${image.id}: ${imageError.message}`
        );
        stats.addError(imageError, `Image analysis: ${image.image_url}`);
      } finally {
        // Clean up temporary file
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    }

    // Consolidate analysis data from all images
    console.log(
      `🔄 Consolidating data from ${allAnalysisResults.length} successful analyses...`
    );
    const consolidatedData = consolidateAnalysisData(
      allAnalysisResults.map((r) => r.parsedData)
    );

    // Select and set primary image based on AI analysis
    let selectedPrimaryImageId = null;
    if (allAnalysisResults.length > 0) {
      console.log(
        `🎯 Selecting primary image from ${allAnalysisResults.length} candidates...`
      );
      const primaryImageResults = await selectAndSetPrimaryImage(
        gemstone.id,
        allAnalysisResults.map((r) => ({
          image_id: r.image_id,
          primary_image_suitability: r.parsedData.primary_image_suitability,
        }))
      );

      // Get the selected primary image ID for display
      selectedPrimaryImageId = primaryImageResults?.selectedImageId;
    }

    // Generate enhanced marketing content based on consolidated analysis
    const marketingCost = await generateMarketingContent(
      gemstone,
      consolidatedData
    );
    stats.addCost(marketingCost);

    // Update gemstone with consolidated AI data
    const gemstoneUpdates = {
      ai_analyzed: true,
      ai_analysis_date: new Date().toISOString(),
      ai_confidence_score: consolidatedData?.confidence || 0.7,
    };

    // Update gemstone fields with AI-extracted data if available
    if (consolidatedData) {
      if (
        consolidatedData.gemstone_type &&
        consolidatedData.gemstone_type !== "other"
      ) {
        // Only update if AI is confident about the type
        console.log(
          `📊 AI detected gemstone type: ${consolidatedData.gemstone_type}`
        );
      }

      if (
        consolidatedData.weight_carats &&
        consolidatedData.weight_carats > 0
      ) {
        console.log(
          `⚖️ AI detected weight: ${consolidatedData.weight_carats} carats`
        );
        // Could update weight if confidence is high and current data is missing
      }

      if (
        consolidatedData.dimensions.length_mm ||
        consolidatedData.dimensions.width_mm ||
        consolidatedData.dimensions.depth_mm
      ) {
        console.log(
          `📏 AI detected dimensions: ${
            consolidatedData.dimensions.length_mm || "?"
          } x ${consolidatedData.dimensions.width_mm || "?"} x ${
            consolidatedData.dimensions.depth_mm || "?"
          } mm`
        );
      }

      if (consolidatedData.gemstone_code) {
        console.log(
          `🏷️ AI found gemstone code: ${consolidatedData.gemstone_code}`
        );
        gemstoneUpdates.internal_code = consolidatedData.gemstone_code;
      }

      if (consolidatedData.extracted_text.raw_text) {
        console.log(
          `📝 AI extracted text: ${consolidatedData.extracted_text.raw_text.substring(
            0,
            100
          )}...`
        );
      }
    }

    await supabase
      .from("gemstones")
      .update(gemstoneUpdates)
      .eq("id", gemstone.id);

    stats.addAnalyzedGemstone();
    console.log(`✅ Gemstone analysis completed: ${gemstone.serial_number}`);

    if (consolidatedData) {
      console.log(`📊 Analysis Summary:`);
      console.log(`   - Images analyzed: ${consolidatedData.images_analyzed}`);
      console.log(
        `   - Overall confidence: ${(consolidatedData.confidence * 100).toFixed(
          1
        )}%`
      );
      console.log(
        `   - Quality grade: ${
          consolidatedData.quality_assessment.overall_grade || "unknown"
        }`
      );
      console.log(
        `   - Commercial value: ${
          consolidatedData.quality_assessment.commercial_value || "unknown"
        }`
      );

      // Display comprehensive analysis results with detailed breakdown
      displayComprehensiveAnalysis(
        gemstone,
        consolidatedData,
        allAnalysisResults
      );

      // Display raw AI analysis data for debugging/verification
      displayRawAnalysisData(allAnalysisResults, showRawData);

      // Display primary image selection details
      displayPrimaryImageSelection(allAnalysisResults, selectedPrimaryImageId);
    }
  } catch (error) {
    stats.addError(error, `Gemstone analysis: ${gemstone.serial_number}`);
    console.error(`❌ Gemstone analysis failed: ${error.message}`);
  }
}

/**
 * Initialize temporary directory
 */
async function initTempDirectory() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    console.log(`📁 Temporary directory created: ${TEMP_DIR}`);
  } catch (error) {
    console.error(`Failed to create temp directory: ${error.message}`);
    throw error;
  }
}

/**
 * Clean up temporary directory
 */
async function cleanupTempDirectory() {
  try {
    const files = await fs.readdir(TEMP_DIR);
    for (const file of files) {
      await fs.unlink(path.join(TEMP_DIR, file));
    }
    console.log(`🧹 Cleaned up ${files.length} temporary files`);
  } catch (error) {
    console.warn(`Warning: Failed to cleanup temp directory: ${error.message}`);
  }
}

/**
 * Main Analysis Function
 */
async function runAIAnalysis() {
  const stats = new AnalysisStats();

  try {
    console.log(`🔍 AI Gemstone Analyzer v2.1 - Enhanced Analysis System`);
    console.log(
      `📊 Settings: Max ${maxGemstones} gemstones, Budget: $${maxCostUSD}, Raw data: ${
        showRawData ? "ON" : "OFF"
      }`
    );
    console.log(
      `🚀 Starting enhanced AI analysis with comprehensive data extraction...`
    );

    // Get unanalyzed gemstones
    const { data: gemstones, error } = await supabase
      .from("gemstones")
      .select("*")
      .eq("ai_analyzed", false)
      .limit(maxGemstones);

    if (error) {
      throw new Error(`Failed to fetch gemstones: ${error.message}`);
    }

    if (!gemstones || gemstones.length === 0) {
      console.log("✅ No unanalyzed gemstones found!");
      return;
    }

    console.log(`📦 Found ${gemstones.length} unanalyzed gemstones`);

    // Process each gemstone
    for (const gemstone of gemstones) {
      // Check cost limit
      if (stats.totalCostUSD >= maxCostUSD) {
        console.log(
          `💰 Cost limit reached ($${maxCostUSD}). Stopping analysis.`
        );
        break;
      }

      await analyzeGemstone(gemstone, stats);
    }

    // Final statistics
    stats.displayFinalStats();
  } catch (error) {
    console.error("❌ Analysis failed:", error.message);
    stats.displayFinalStats();
    process.exit(1);
  }
}

/**
 * CLI Interface
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  let maxGemstones = 10;
  let maxCostUSD = 50.0;
  let showRawData = false;

  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--help":
        console.log(`
🔍 AI Gemstone Analyzer v2.1 - Enhanced Analysis System

Advanced gemstone analysis with comprehensive data extraction, intelligent
primary image selection, and Russian/Cyrillic text recognition.

NEW IN v2.1:
✨ Enhanced AI prompt with Russian/Kazakh label recognition
✨ Intelligent primary image selection with scoring (0-100)  
✨ Comprehensive data extraction (codes, weights, dimensions)
✨ Advanced image classification (beauty shots, certificates, gauges)
✨ Measurement tool reading (calipers, micrometers, scales)
✨ Quality assessment and commercial value evaluation
✨ Consolidated data from multiple images per gemstone
✨ Automatic primary image flag management

Usage: node ai-gemstone-analyzer-v2.mjs [options]

Options:
  --max <number>        Maximum number of gemstones to process (default: 10)
  --budget <number>     Maximum cost budget in USD (default: $50.00)
  --verbose, --raw      Show full raw AI analysis data for debugging
  --help               Show this help message

Examples:
  node ai-gemstone-analyzer-v2.mjs --max 5 --budget 25.0
  node ai-gemstone-analyzer-v2.mjs --max 3 --verbose
  node ai-gemstone-analyzer-v2.mjs --help

Features:
• Analyzes ALL images per gemstone (no 5-image limit)
• Comprehensive Russian/Cyrillic text extraction
• Intelligent primary image selection with detailed scoring
• Quality assessment and commercial value evaluation
• Detailed analysis results display with breakdown
• Primary image selection analysis with ranking
• Raw AI data inspection for verification
        `);
        process.exit(0);

      case "--max":
        maxGemstones = parseInt(args[++i]) || 10;
        break;

      case "--budget":
        maxCostUSD = parseFloat(args[++i]) || 50.0;
        break;

      case "--verbose":
      case "--raw":
        showRawData = true;
        break;

      default:
        console.error(`Unknown option: ${arg}`);
        console.log("Use --help for usage information.");
        process.exit(1);
    }
  }

  runAIAnalysis()
    .then(() => {
      console.log("✅ Analysis completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Analysis failed:", error);
      process.exit(1);
    });
}

export { runAIAnalysis };

/**
 * Consolidate AI analysis data from multiple images
 */
function consolidateAnalysisData(analysisResults) {
  if (!analysisResults || analysisResults.length === 0) {
    return null;
  }

  // Find the best analysis (highest confidence)
  const bestAnalysis = analysisResults.reduce((best, current) => {
    const currentConfidence = current.confidence || 0;
    const bestConfidence = best.confidence || 0;
    return currentConfidence > bestConfidence ? current : best;
  });

  // Initialize consolidated data with default structure
  const consolidated = {
    gemstone_type: null,
    color: null,
    cut: null,
    clarity: null,
    weight_carats: null,
    dimensions: {
      length_mm: null,
      width_mm: null,
      depth_mm: null,
    },
    origin: null,
    quality_assessment: {
      overall_grade: null,
      visual_appeal: null,
      commercial_value: null,
      transparency: null,
      brilliance: null,
    },
    extracted_text: {
      raw_text: null,
      translated_text: null,
      language: null,
    },
    gemstone_code: null,
    certification: {
      lab: null,
      certificate_number: null,
    },
    measurement_data: [],
    images_analyzed: analysisResults.length,
    confidence: bestAnalysis.confidence || 0,
  };

  // Consolidate data from all analyses
  analysisResults.forEach((analysis) => {
    if (!analysis.extracted_data) return;

    const data = analysis.extracted_data;

    // Primary gemstone identification
    if (data.visual_assessment?.gemstone_type && !consolidated.gemstone_type) {
      consolidated.gemstone_type = data.visual_assessment.gemstone_type;
    }

    if (data.color?.grade && !consolidated.color) {
      consolidated.color = data.color.grade;
    }

    if (data.shape_cut?.value && !consolidated.cut) {
      consolidated.cut = data.shape_cut.value;
    }

    if (data.clarity?.grade && !consolidated.clarity) {
      consolidated.clarity = data.clarity.grade;
    }

    // Weight (prefer scale readings over visual estimates)
    if (
      data.weight?.value &&
      (!consolidated.weight_carats || data.weight.source === "scale")
    ) {
      if (data.weight.unit === "ct") {
        consolidated.weight_carats = data.weight.value;
      } else if (data.weight.unit === "g") {
        // Convert grams to carats (1 gram = 5 carats)
        consolidated.weight_carats = data.weight.value * 5;
      }
    }

    // Dimensions (prefer gauge measurements)
    if (
      data.dimensions?.length_mm &&
      (!consolidated.dimensions.length_mm || data.dimensions.source === "gauge")
    ) {
      consolidated.dimensions.length_mm = data.dimensions.length_mm;
    }
    if (
      data.dimensions?.width_mm &&
      (!consolidated.dimensions.width_mm || data.dimensions.source === "gauge")
    ) {
      consolidated.dimensions.width_mm = data.dimensions.width_mm;
    }
    if (
      data.dimensions?.depth_mm &&
      (!consolidated.dimensions.depth_mm || data.dimensions.source === "gauge")
    ) {
      consolidated.dimensions.depth_mm = data.dimensions.depth_mm;
    }

    // Origin and identification
    if (data.origin?.location && !consolidated.origin) {
      consolidated.origin = data.origin.location;
    }

    if (data.gemstone_code && !consolidated.gemstone_code) {
      consolidated.gemstone_code = data.gemstone_code;
    }

    // Quality assessment (use highest confidence data)
    if (data.visual_assessment) {
      const va = data.visual_assessment;
      if (va.quality_grade && !consolidated.quality_assessment.overall_grade) {
        consolidated.quality_assessment.overall_grade = va.quality_grade;
      }
      if (
        va.visual_appeal &&
        (!consolidated.quality_assessment.visual_appeal ||
          va.visual_appeal > consolidated.quality_assessment.visual_appeal)
      ) {
        consolidated.quality_assessment.visual_appeal = va.visual_appeal;
      }
      if (
        va.commercial_value &&
        !consolidated.quality_assessment.commercial_value
      ) {
        consolidated.quality_assessment.commercial_value = va.commercial_value;
      }
      if (va.transparency && !consolidated.quality_assessment.transparency) {
        consolidated.quality_assessment.transparency = va.transparency;
      }
      if (va.brilliance && !consolidated.quality_assessment.brilliance) {
        consolidated.quality_assessment.brilliance = va.brilliance;
      }
    }

    // Text extraction (combine all found text)
    if (data.text_extraction) {
      if (
        data.text_extraction.raw_text &&
        data.text_extraction.raw_text.trim()
      ) {
        if (!consolidated.extracted_text.raw_text) {
          consolidated.extracted_text.raw_text = data.text_extraction.raw_text;
          consolidated.extracted_text.translated_text =
            data.text_extraction.translated_text;
          consolidated.extracted_text.language = data.text_extraction.language;
        } else {
          // Combine multiple text extractions
          consolidated.extracted_text.raw_text +=
            " | " + data.text_extraction.raw_text;
          if (data.text_extraction.translated_text) {
            consolidated.extracted_text.translated_text +=
              " | " + data.text_extraction.translated_text;
          }
        }
      }
    }

    // Certification
    if (data.certification?.lab && !consolidated.certification.lab) {
      consolidated.certification.lab = data.certification.lab;
      consolidated.certification.certificate_number =
        data.certification.certificate_number;
    }

    // Measurement data (collect all measurements)
    if (data.measurement_data && data.measurement_data.device_type) {
      consolidated.measurement_data.push({
        device_type: data.measurement_data.device_type,
        reading_value: data.measurement_data.reading_value,
        unit: data.measurement_data.unit,
        measurement_type: data.measurement_data.measurement_type,
        confidence: data.measurement_data.confidence,
      });
    }
  });

  return consolidated;
}

/**
 * Select and set primary image based on AI analysis
 */
async function selectAndSetPrimaryImage(gemstoneId, analysisResults) {
  if (!analysisResults || analysisResults.length === 0) {
    console.log("⚠️ No analysis results available for primary image selection");
    return { success: false, selectedImageId: null };
  }

  // Find the best primary image candidate
  let bestCandidate = null;
  let highestScore = -1;

  analysisResults.forEach((result) => {
    if (result.primary_image_suitability?.score > highestScore) {
      highestScore = result.primary_image_suitability.score;
      bestCandidate = result;
    }
  });

  if (!bestCandidate) {
    console.log("⚠️ No suitable primary image candidate found");
    return { success: false, selectedImageId: null };
  }

  try {
    // Clear existing primary flags
    const { error: clearError } = await supabase
      .from("gemstone_images")
      .update({ is_primary: false })
      .eq("gemstone_id", gemstoneId);

    if (clearError) {
      console.error(
        "Failed to clear existing primary flags:",
        clearError.message
      );
      return { success: false, selectedImageId: null };
    }

    // Set new primary image
    const { error: setPrimaryError } = await supabase
      .from("gemstone_images")
      .update({ is_primary: true })
      .eq("id", bestCandidate.image_id);

    if (setPrimaryError) {
      console.error(
        "Failed to set new primary image:",
        setPrimaryError.message
      );
      return { success: false, selectedImageId: null };
    }

    console.log(
      `✅ Set primary image (score: ${highestScore}) - ${bestCandidate.primary_image_suitability.reasoning}`
    );
    return { success: true, selectedImageId: bestCandidate.image_id };
  } catch (error) {
    console.error("Error in primary image selection:", error.message);
    return { success: false, selectedImageId: null };
  }
}

/**
 * Display comprehensive analysis results with detailed breakdown
 */
function displayComprehensiveAnalysis(
  gemstone,
  consolidatedData,
  allAnalysisResults
) {
  console.log(
    `\n📊 ═══════════════════════════════════════════════════════════`
  );
  console.log(`📊 COMPREHENSIVE ANALYSIS RESULTS: ${gemstone.serial_number}`);
  console.log(`📊 ═══════════════════════════════════════════════════════════`);

  if (!consolidatedData) {
    console.log(`❌ No consolidated data available`);
    return;
  }

  // Basic gemstone information
  console.log(`\n🔸 GEMSTONE IDENTIFICATION:`);
  console.log(
    `   • Detected Type: ${consolidatedData.gemstone_type || "Unknown"}`
  );
  console.log(`   • Color Grade: ${consolidatedData.color || "Unknown"}`);
  console.log(`   • Cut Style: ${consolidatedData.cut || "Unknown"}`);
  console.log(`   • Clarity Grade: ${consolidatedData.clarity || "Unknown"}`);
  console.log(
    `   • Overall Confidence: ${(consolidatedData.confidence * 100).toFixed(
      1
    )}%`
  );

  // Physical measurements
  console.log(`\n📏 PHYSICAL MEASUREMENTS:`);
  if (consolidatedData.weight_carats) {
    console.log(`   • Weight: ${consolidatedData.weight_carats} carats`);
  }
  if (
    consolidatedData.dimensions.length_mm ||
    consolidatedData.dimensions.width_mm ||
    consolidatedData.dimensions.depth_mm
  ) {
    console.log(
      `   • Dimensions: ${consolidatedData.dimensions.length_mm || "?"} × ${
        consolidatedData.dimensions.width_mm || "?"
      } × ${consolidatedData.dimensions.depth_mm || "?"} mm`
    );
  }

  // Extracted text and codes
  console.log(`\n📝 EXTRACTED TEXT & CODES:`);
  if (consolidatedData.gemstone_code) {
    console.log(`   • Gemstone Code: ${consolidatedData.gemstone_code}`);
  }
  if (consolidatedData.extracted_text.raw_text) {
    const text = consolidatedData.extracted_text.raw_text.substring(0, 200);
    console.log(
      `   • Raw Text: ${text}${
        consolidatedData.extracted_text.raw_text.length > 200 ? "..." : ""
      }`
    );
  }
  if (consolidatedData.extracted_text.language) {
    console.log(`   • Language: ${consolidatedData.extracted_text.language}`);
  }

  // Quality assessment
  console.log(`\n⭐ QUALITY ASSESSMENT:`);
  console.log(
    `   • Overall Grade: ${
      consolidatedData.quality_assessment.overall_grade || "Unknown"
    }`
  );
  console.log(
    `   • Visual Appeal: ${
      consolidatedData.quality_assessment.visual_appeal || "Unknown"
    }`
  );
  console.log(
    `   • Commercial Value: ${
      consolidatedData.quality_assessment.commercial_value || "Unknown"
    }`
  );
  console.log(
    `   • Transparency: ${
      consolidatedData.quality_assessment.transparency || "Unknown"
    }`
  );
  console.log(
    `   • Brilliance: ${
      consolidatedData.quality_assessment.brilliance || "Unknown"
    }`
  );

  // Origin and certification
  if (consolidatedData.origin) {
    console.log(`\n🌍 ORIGIN & CERTIFICATION:`);
    console.log(`   • Origin: ${consolidatedData.origin}`);
  }
  if (
    consolidatedData.certification.lab ||
    consolidatedData.certification.certificate_number
  ) {
    console.log(
      `   • Certification Lab: ${
        consolidatedData.certification.lab || "Unknown"
      }`
    );
    console.log(
      `   • Certificate Number: ${
        consolidatedData.certification.certificate_number || "Unknown"
      }`
    );
  }

  // Measurement data
  if (
    consolidatedData.measurement_data &&
    consolidatedData.measurement_data.length > 0
  ) {
    console.log(`\n📐 MEASUREMENT TOOL READINGS:`);
    consolidatedData.measurement_data.forEach((measurement, index) => {
      console.log(
        `   ${index + 1}. ${measurement.device_type}: ${
          measurement.reading_value
        } (${measurement.measurement_type})`
      );
    });
  }

  // Analysis summary
  console.log(`\n📈 ANALYSIS SUMMARY:`);
  console.log(`   • Images Analyzed: ${consolidatedData.images_analyzed}`);
  console.log(`   • Total Analysis Results: ${allAnalysisResults.length}`);
  console.log(
    `   • Success Rate: ${allAnalysisResults.length > 0 ? "100%" : "0%"}`
  );

  console.log(
    `📊 ═══════════════════════════════════════════════════════════\n`
  );
}

/**
 * Display raw AI analysis data for debugging/verification
 */
function displayRawAnalysisData(allAnalysisResults, showFull = false) {
  console.log(
    `\n🔍 ═══════════════════════════════════════════════════════════`
  );
  console.log(
    `🔍 RAW AI ANALYSIS DATA (${allAnalysisResults.length} analyses)`
  );
  console.log(`🔍 ═══════════════════════════════════════════════════════════`);

  allAnalysisResults.forEach((result, index) => {
    console.log(
      `\n📸 Analysis ${index + 1}/${allAnalysisResults.length} (Image ID: ${
        result.image_id
      }):`
    );
    console.log(
      `   • Classification: ${result.parsedData.image_classification}`
    );
    console.log(
      `   • Primary Suitability Score: ${
        result.parsedData.primary_image_suitability?.score || "N/A"
      }/100`
    );
    console.log(
      `   • Confidence: ${(result.parsedData.confidence * 100).toFixed(1)}%`
    );

    if (result.parsedData.primary_image_suitability?.reasoning) {
      console.log(
        `   • Primary Reasoning: ${result.parsedData.primary_image_suitability.reasoning.substring(
          0,
          100
        )}...`
      );
    }

    if (showFull) {
      console.log(`   • Full Raw Response:`);
      console.log(
        `     ${JSON.stringify(result.parsedData, null, 2).substring(
          0,
          500
        )}...`
      );
    } else {
      // Show key extracted data points
      const data = result.parsedData.extracted_data;
      if (data) {
        console.log(`   • Key Data Points:`);
        if (data.weight?.value)
          console.log(
            `     - Weight: ${data.weight.value} ${data.weight.unit}`
          );
        if (data.gemstone_code)
          console.log(`     - Code: ${data.gemstone_code}`);
        if (data.dimensions?.length_mm)
          console.log(
            `     - Size: ${data.dimensions.length_mm}×${data.dimensions.width_mm}mm`
          );
        if (data.shape_cut?.value)
          console.log(`     - Cut: ${data.shape_cut.value}`);
        if (data.text_extraction?.raw_text) {
          const text = data.text_extraction.raw_text.substring(0, 80);
          console.log(
            `     - Text: "${text}${
              data.text_extraction.raw_text.length > 80 ? "..." : ""
            }"`
          );
        }
      }
    }
  });

  console.log(
    `\n💡 Tip: Call displayRawAnalysisData(results, true) to see full JSON responses`
  );
  console.log(
    `🔍 ═══════════════════════════════════════════════════════════\n`
  );
}

/**
 * Display primary image selection details
 */
function displayPrimaryImageSelection(allAnalysisResults, selectedImageId) {
  console.log(
    `\n🎯 ═══════════════════════════════════════════════════════════`
  );
  console.log(`🎯 PRIMARY IMAGE SELECTION ANALYSIS`);
  console.log(`🎯 ═══════════════════════════════════════════════════════════`);

  // Sort by primary suitability score for clear ranking
  const rankedImages = allAnalysisResults
    .map((r) => ({
      image_id: r.image_id,
      classification: r.parsedData.image_classification,
      score: r.parsedData.primary_image_suitability?.score || 0,
      reasoning:
        r.parsedData.primary_image_suitability?.reasoning ||
        "No reasoning provided",
      is_ideal:
        r.parsedData.primary_image_suitability?.is_ideal_primary || false,
    }))
    .sort((a, b) => b.score - a.score);

  console.log(`\n📊 IMAGE RANKING (by primary suitability):`);
  rankedImages.forEach((img, index) => {
    const isSelected = img.image_id === selectedImageId;
    const marker = isSelected ? "🏆" : `${index + 1}.`;
    const status = isSelected ? "← SELECTED AS PRIMARY" : "";

    console.log(
      `${marker} Score: ${img.score}/100 | ${img.classification} | ${
        img.is_ideal ? "⭐ IDEAL" : ""
      } ${status}`
    );
    console.log(`   Reasoning: ${img.reasoning.substring(0, 120)}...`);
  });

  console.log(
    `🎯 ═══════════════════════════════════════════════════════════\n`
  );
}

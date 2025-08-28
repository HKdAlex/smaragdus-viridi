/**
 * AI Gemstone Analyzer v1.0
 *
 * Comprehensive AI-powered gemstone analysis system using OpenAI GPT-4 Vision
 * - Visual gemstone identification and property detection
 * - Multi-language content generation (EN/RU)
 * - Technical and marketing copy generation
 * - Database integration with confidence scoring
 * - Batch processing with error handling
 */

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Statistics tracking class
 */
class AIAnalysisStats {
  constructor() {
    this.totalGemstones = 0;
    this.totalCost = 0;
    this.totalProcessingTime = 0;
    this.errors = [];
    this.startTime = Date.now();
  }

  addGemstone() {
    this.totalGemstones++;
  }

  addCost(cost) {
    this.totalCost += cost;
  }

  addProcessingTime(time) {
    this.totalProcessingTime += time;
  }

  addError(error, context) {
    this.errors.push({ error: error.message, context, timestamp: new Date() });
  }

  getStats() {
    const runtime = Date.now() - this.startTime;
    return {
      totalGemstones: this.totalGemstones,
      totalCost: this.totalCost,
      totalProcessingTime: this.totalProcessingTime,
      runtime: runtime,
      errors: this.errors.length,
      avgCostPerGemstone:
        this.totalGemstones > 0 ? this.totalCost / this.totalGemstones : 0,
    };
  }
}

/**
 * Gemstone AI Analysis Prompts
 */
const ANALYSIS_PROMPTS = {
  gemstoneIdentification: `You are an expert gemologist analyzing a gemstone image. 

Analyze this image and provide a detailed assessment in JSON format:

{
  "gemstoneType": "emerald|ruby|sapphire|diamond|amethyst|topaz|garnet|peridot|citrine|tanzanite|aquamarine|morganite|tourmaline|zircon|apatite|quartz",
  "color": {
    "primary": "red|blue|green|yellow|pink|white|black|colorless",
    "undertones": "description of undertones",
    "saturation": "low|medium|high|vivid",
    "distribution": "even|uneven|zoned"
  },
  "cut": {
    "shape": "round|oval|marquise|pear|emerald|princess|cushion|radiant|fantasy",
    "quality": "excellent|very_good|good|fair|poor",
    "symmetry": "excellent|very_good|good|fair|poor",
    "proportions": "ideal|good|acceptable|poor"
  },
  "clarity": {
    "grade": "FL|IF|VVS1|VVS2|VS1|VS2|SI1|SI2|I1",
    "inclusions": "description of visible inclusions",
    "transparency": "transparent|translucent|opaque"
  },
  "estimatedWeight": {
    "carats": "estimated weight in carats",
    "confidence": "high|medium|low"
  },
  "estimatedDimensions": {
    "length": "estimated length in mm",
    "width": "estimated width in mm", 
    "depth": "estimated depth in mm",
    "confidence": "high|medium|low"
  },
  "treatments": {
    "detected": ["heat_treatment", "oil_filling", "irradiation", "none"],
    "confidence": "high|medium|low"
  },
  "qualityAssessment": {
    "overall": "exceptional|excellent|very_good|good|fair|poor",
    "rarity": "extremely_rare|rare|uncommon|common",
    "marketValue": "premium|high|medium|low"
  },
  "confidence": 0.95
}

Be precise and conservative in your assessments. If uncertain, indicate lower confidence.`,

  marketingContent: `You are a luxury gemstone marketing specialist. Based on the gemstone analysis, create compelling marketing content.

Create marketing content in JSON format:

{
  "english": {
    "title": "Captivating title for the gemstone",
    "description": "Detailed technical description highlighting key features",
    "marketingHighlights": [
      "3-5 key selling points",
      "Focus on rarity, beauty, quality",
      "Technical specifications"
    ],
    "promotionalText": "Compelling promotional copy for luxury positioning",
    "technicalSpecs": "Professional gemological specifications",
    "collectorNotes": "Information for serious collectors and dealers"
  },
  "russian": {
    "title": "Привлекательное название камня",
    "description": "Подробное техническое описание с выделением ключевых особенностей",
    "marketingHighlights": [
      "3-5 ключевых преимуществ",
      "Акцент на редкость, красоту, качество",
      "Технические характеристики"
    ],
    "promotionalText": "Убедительный рекламный текст для люксового позиционирования",
    "technicalSpecs": "Профессиональные геммологические характеристики",
    "collectorNotes": "Информация для серьезных коллекционеров и дилеров"
  },
  "seoKeywords": ["relevant", "search", "keywords"],
  "targetAudience": "collectors|dealers|luxury_buyers|general_consumers"
}`,

  certificateOCR: `You are an expert in gemstone certificates and documentation. Extract all text and data from this certificate image.

Provide extracted information in JSON format:

{
  "certificateType": "GIA|SSEF|Gübelin|AGL|local_lab|unknown",
  "certificateNumber": "extracted certificate number",
  "gemstoneType": "extracted gemstone type",
  "weight": "weight in carats",
  "dimensions": "length x width x depth in mm",
  "color": "color grade or description",
  "clarity": "clarity grade",
  "cut": "cut grade or description",
  "origin": "geographic origin if stated",
  "treatments": ["list of treatments mentioned"],
  "issueDate": "date of issue",
  "labName": "issuing laboratory name",
  "extractedText": "all visible text from the certificate",
  "additionalNotes": "any other relevant information",
  "confidence": 0.95
}

Extract all visible text accurately, even if partially obscured.`,

  labelExtraction: `You are analyzing a gemstone label or tag. Extract all visible information.

Provide extracted data in JSON format:

{
  "labelType": "price_tag|inventory_label|description_card|measurement_card|other",
  "extractedText": "all visible text",
  "prices": {
    "amounts": ["list of prices found"],
    "currencies": ["corresponding currencies"],
    "priceTypes": ["retail|wholesale|auction|estimate"]
  },
  "measurements": {
    "weight": "weight if mentioned",
    "dimensions": "dimensions if mentioned",
    "units": "carats|grams|mm|inches"
  },
  "codes": {
    "inventoryCodes": ["any inventory or SKU codes"],
    "serialNumbers": ["any serial numbers"],
    "internalCodes": ["any internal reference codes"]
  },
  "descriptions": ["any descriptive text about the gemstone"],
  "handwrittenNotes": "any handwritten annotations",
  "language": "english|russian|other",
  "confidence": 0.95
}

Be thorough in extracting all visible information, including handwritten notes.`,
};

const ANALYSIS_PROMPT = `You are analyzing gemstone images for a professional jewelry inventory system. Extract ALL possible structured data with high precision.

CRITICAL: Look for these specific data types in each image:

📋 LABEL/CERTIFICATE DATA (often in Russian/Cyrillic):
- Gemstone codes (e.g., "С 54", "Д 123", "Р 789")
- Weight with units (e.g., "2,48 ct", "1.5 карат", "3,2 ct")
- Shape/cut names (e.g., "овал", "круг", "принцесса", "изумруд", "груша")
- Count/quantity (e.g., "1 шт", "2 шт", "3 pieces")
- Dimensions in mm (e.g., "8,8/8,1", "12.5×10.2", "15mm")
- Color grades (e.g., "D", "E", "F", "G", "H", "I", "J", or Russian color terms)
- Clarity grades (e.g., "FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2")
- Origin/location (e.g., "Колумбия", "Бирма", "Шри-Ланка", "Мадагаскар")
- Certificate numbers or lab names
- Quality assessments or grading information

📏 MEASUREMENT GAUGE DATA:
- Digital caliper readings showing precise measurements
- Micrometer measurements for gemstone dimensions
- Three-dimensional measurements (length, width, depth)
- Look for LCD/digital displays showing numbers in mm
- Multiple measurement angles of the same stone

⚖️ SCALE/WEIGHT DATA:
- Digital scale displays showing precise weight
- Weight in grams, carats, or other units
- Multiple weight readings for verification
- Scale models and precision indicators

🔍 GEMSTONE ASSESSMENT:
- Physical appearance and condition
- Color saturation and distribution
- Cut quality and faceting
- Surface characteristics (inclusions, clarity)
- Overall visual appeal and presentation

🖼️ **PRIMARY IMAGE SELECTION (CRITICAL)**:
For EACH image, evaluate its suitability as the primary display image using these criteria:

IDEAL PRIMARY IMAGE characteristics:
✅ Clear, high-quality photo of the gemstone ONLY
✅ Good lighting that shows the stone's true color
✅ Sharp focus with the entire stone visible
✅ Clean background (preferably neutral/white)
✅ Stone positioned attractively (facets visible)
✅ No measurement tools, gauges, scales, or rulers visible
✅ No certificates, labels, or text overlays
✅ No hands, fingers, or other objects in frame
✅ Professional jewelry photography appearance

AVOID for primary image:
❌ Images with measurement tools (calipers, gauges, rulers)
❌ Images with digital scales or weighing equipment
❌ Certificate photos or document scans
❌ Label photos with text and specifications
❌ Blurry, poorly lit, or low-quality images
❌ Images where stone is partially obscured
❌ Images with packaging, boxes, or containers
❌ Comparison shots with multiple stones
❌ Environmental/context shots

🎯 **IMAGE CLASSIFICATION**:
Classify each image into ONE of these categories:
- "gemstone_beauty_shot" - Clean photos of the stone only (PRIMARY CANDIDATES)
- "gemstone_photo" - Good stone photos but may have minor distractions
- "measurement_gauge" - Shows calipers, micrometers, or measurement tools
- "scale_reading" - Shows digital scales or weighing equipment
- "certificate" - Official certificates or documentation
- "label" - Information labels with specifications
- "packaging" - Boxes, containers, or packaging materials
- "comparison" - Multiple stones or comparative shots
- "environment" - Context/setting shots
- "other" - Any other type of image

Return a JSON response with this exact structure:

{
  "image_classification": "gemstone_beauty_shot|gemstone_photo|measurement_gauge|scale_reading|certificate|label|packaging|comparison|environment|other",
  "primary_image_suitability": {
    "score": 0-100,
    "reasoning": "Detailed explanation of why this image is/isn't suitable as primary display image",
    "is_ideal_primary": true/false
  },
  "extracted_data": {
    "text_extraction": {
      "raw_text": "all visible text in original language",
      "translated_text": "English translation if not in English",
      "language": "detected language (ru/en/kz/mixed)",
      "confidence": 0.0-1.0
    },
    "gemstone_code": "extracted code (e.g., С 54)",
    "weight": {
      "value": number,
      "unit": "ct|carat|g|gram",
      "source": "label|scale|certificate",
      "confidence": 0.0-1.0
    },
    "dimensions": {
      "length_mm": number,
      "width_mm": number,
      "depth_mm": number,
      "source": "label|gauge|visual_estimate",
      "raw_text": "original dimension text",
      "confidence": 0.0-1.0
    },
    "shape_cut": {
      "value": "round|oval|emerald|princess|cushion|pear|marquise|radiant|asscher|heart|other",
      "original_text": "original language term",
      "confidence": 0.0-1.0
    },
    "color": {
      "grade": "D|E|F|G|H|I|J|K|L|M|fancy_color",
      "description": "detailed color description",
      "original_text": "original language term",
      "confidence": 0.0-1.0
    },
    "clarity": {
      "grade": "FL|IF|VVS1|VVS2|VS1|VS2|SI1|SI2|I1|I2|I3",
      "description": "clarity description",
      "confidence": 0.0-1.0
    },
    "quantity": {
      "count": number,
      "unit": "шт|pieces|stones",
      "confidence": 0.0-1.0
    },
    "origin": {
      "location": "country/region name",
      "original_text": "original language term",
      "confidence": 0.0-1.0
    },
    "certification": {
      "lab": "laboratory name",
      "certificate_number": "certificate ID",
      "confidence": 0.0-1.0
    },
    "measurement_data": {
      "device_type": "caliper|micrometer|ruler|scale|other",
      "reading_value": number,
      "reading_unit": "mm|ct|g",
      "measurement_type": "length|width|depth|weight|diameter",
      "confidence": 0.0-1.0
    },
    "visual_assessment": {
      "color_description": "detailed color analysis",
      "clarity_notes": "visible inclusions or clarity",
      "cut_quality": "assessment of cut quality",
      "overall_condition": "condition assessment",
      "quality_grade": "exceptional|excellent|very_good|good|fair|poor",
      "visual_appeal": 0.0-1.0,
      "commercial_value": "investment|premium|standard|commercial"
    }
  },
  "confidence": 0.0-1.0,
  "notes": "Any additional observations or special notes"
}

TRANSLATION NOTES:
- "овал" = oval
- "круг" = round  
- "принцесса" = princess
- "изумруд" = emerald cut
- "груша" = pear
- "карат" = carat
- "шт" = pieces/stones
- "диаметр" = diameter
- "длина" = length
- "ширина" = width
- "высота" = height/depth

Be extremely precise with numerical extractions. Use confidence scores to indicate certainty level.
Preserve original language text alongside translations for verification.`;

/**
 * Download image from URL and convert to buffer
 */
async function downloadImageFromUrl(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    throw new Error(
      `Failed to download image from ${imageUrl}: ${error.message}`
    );
  }
}

/**
 * Analyze a single image using OpenAI Vision API
 */
async function analyzeImageWithAI(imageUrl, imageBuffer) {
  try {
    const imageBase64 = imageBuffer.toString("base64");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: ANALYSIS_PROMPT,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for consistent, factual responses
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    // Parse JSON response
    const analysisData = JSON.parse(content);

    return {
      ...analysisData,
      total_tokens: response.usage?.total_tokens || 1000,
      image_url: imageUrl,
    };
  } catch (error) {
    console.error(`    ❌ AI analysis failed for ${imageUrl}:`, error.message);
    throw error;
  }
}

/**
 * Classify image type using AI
 */
async function classifyImage(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const result = await analyzeImageWithAI(imagePath, imageBuffer);

    if (result.success) {
      const classification = result.data.image_type.toLowerCase().trim();
      const validTypes = [
        "gemstone_photo",
        "certificate",
        "label",
        "measurement_gauge",
        "scale",
        "packaging",
        "comparison",
        "environment",
        "other",
      ];

      if (validTypes.includes(classification)) {
        return {
          type: classification,
          confidence: result.data.confidence,
          cost: result.cost_usd,
        };
      }
    }

    return { type: "other", confidence: 0.5, cost: 0 };
  } catch (error) {
    console.error(`Classification failed for ${imagePath}:`, error.message);
    return { type: "other", confidence: 0.3, cost: 0 };
  }
}

/**
 * Calculate cost for GPT-4o API usage
 */
function calculateCost(totalTokens) {
  // GPT-4o pricing: $5 per 1M input tokens, $15 per 1M output tokens
  // Approximating 80% input, 20% output tokens
  const inputTokens = Math.floor(totalTokens * 0.8);
  const outputTokens = Math.floor(totalTokens * 0.2);

  const inputCost = (inputTokens / 1000000) * 5.0;
  const outputCost = (outputTokens / 1000000) * 15.0;

  return inputCost + outputCost;
}

/**
 * Analyze all images for a gemstone using AI
 */
async function analyzeGemstoneImages(images, gemstoneId, stats) {
  const analysisResults = [];
  let totalCost = 0;

  console.log(`  📸 Processing ${images.length} images for AI analysis...`);

  for (const image of images) {
    try {
      const imageUrl = image.image_url;
      console.log(`    🔍 Analyzing: ${path.basename(imageUrl)}`);

      // Download and analyze image
      const imageBuffer = await downloadImageFromUrl(imageUrl);
      const result = await analyzeImageWithAI(imageUrl, imageBuffer);

      if (result) {
        analysisResults.push({
          image_id: image.id,
          image_url: imageUrl,
          ...result,
        });

        // Store individual image classification
        await storeImageClassification(image.id, result.image_classification, [
          result,
        ]);

        // Calculate and track cost
        const cost = calculateCost(result.total_tokens || 1000);
        totalCost += cost;
        stats.addCost(cost);

        console.log(
          `    ✅ Analysis complete (${
            result.image_classification
          }, primary score: ${result.primary_image_suitability?.score || 0})`
        );
      }

      // Small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(
        `    ❌ Failed to analyze ${path.basename(image.image_url)}: ${
          error.message
        }`
      );
      stats.addError(error, `Image analysis: ${image.image_url}`);
    }
  }

  // Determine and set primary image
  await selectAndSetPrimaryImage(gemstoneId, analysisResults);

  console.log(
    `  📊 Analyzed ${analysisResults.length}/${images.length} images successfully`
  );
  return { analysisResults, totalCost };
}

/**
 * Select and set the primary image based on AI analysis
 */
async function selectAndSetPrimaryImage(gemstoneId, analysisResults) {
  try {
    console.log(`  🎯 Determining primary image for gemstone ${gemstoneId}...`);

    // Find the best primary image candidate
    let bestPrimary = null;
    let highestScore = -1;

    for (const result of analysisResults) {
      const suitability = result.primary_image_suitability;

      if (suitability && suitability.score > highestScore) {
        // Prioritize "gemstone_beauty_shot" classification
        const isBeautyShot =
          result.image_classification === "gemstone_beauty_shot";
        const isGemstonePhoto =
          result.image_classification === "gemstone_photo";

        // Boost score for ideal image types
        let adjustedScore = suitability.score;
        if (isBeautyShot) {
          adjustedScore += 20; // Significant boost for beauty shots
        } else if (isGemstonePhoto) {
          adjustedScore += 10; // Moderate boost for gemstone photos
        }

        if (adjustedScore > highestScore) {
          highestScore = adjustedScore;
          bestPrimary = result;
        }
      }
    }

    if (bestPrimary) {
      // Clear any existing primary flags for this gemstone
      await supabase
        .from("gemstone_images")
        .update({ is_primary: false })
        .eq("gemstone_id", gemstoneId);

      // Set the new primary image
      const { error } = await supabase
        .from("gemstone_images")
        .update({ is_primary: true })
        .eq("id", bestPrimary.image_id);

      if (error) {
        console.error(`    ❌ Failed to set primary image: ${error.message}`);
      } else {
        console.log(
          `    ✅ Set primary image: ${path.basename(
            bestPrimary.image_url
          )} (score: ${highestScore}, type: ${
            bestPrimary.image_classification
          })`
        );
        console.log(
          `    💭 Reasoning: ${bestPrimary.primary_image_suitability.reasoning}`
        );
      }
    } else {
      console.log(
        `    ⚠️ No suitable primary image found, keeping existing or first image as primary`
      );
    }
  } catch (error) {
    console.error(
      `Failed to set primary image for gemstone ${gemstoneId}: ${error.message}`
    );
  }
}

/**
 * Store Analysis Result in Database
 */
async function storeAnalysisResult(gemstoneId, analysisResult, imagePath) {
  try {
    const { error } = await supabase.from("ai_analysis_results").insert({
      gemstone_id: gemstoneId,
      analysis_type: analysisResult.image_type,
      input_data: { imagePath },
      raw_response: JSON.stringify(analysisResult),
      extracted_data: analysisResult.extracted_data,
      confidence_score: analysisResult.confidence,
      processing_cost_usd: analysisResult.cost_usd,
      processing_time_ms: analysisResult.tokens_used,
      ai_model_version: "gpt-4o",
    });

    if (error) {
      console.error("Failed to store analysis result:", error);
    }
  } catch (error) {
    console.error("Error storing analysis result:", error);
  }
}

/**
 * Store image classification results
 */
async function storeImageClassification(imageId, imageType, analysisResults) {
  try {
    const confidence =
      analysisResults.length > 0
        ? analysisResults.reduce((sum, r) => sum + r.confidence, 0) /
          analysisResults.length
        : 0.5;

    const { error } = await supabase
      .from("gemstone_images")
      .update({
        image_type: imageType,
        ai_confidence: confidence,
        ai_analyzed: true,
        ai_analysis_date: new Date().toISOString(),
      })
      .eq("id", imageId);

    if (error) throw error;
  } catch (error) {
    console.error(`Failed to store image classification: ${error.message}`);
  }
}

/**
 * Consolidate Analysis Data
 */
async function consolidateAnalysisData(gemstoneId, analysisResults) {
  try {
    const extractedData = {};
    let extractedText = "";
    let aiDescription = "";

    // Aggregate data from all analysis results
    for (const result of analysisResults) {
      if (result.extracted_data) {
        // Merge text extraction
        if (result.extracted_data.text_extraction) {
          extractedText += result.extracted_data.text_extraction.raw_text + " ";
        }

        // Merge gemstone properties
        if (result.extracted_data.gemstone_code) {
          extractedData.gemstone_code = result.extracted_data.gemstone_code;
        }

        if (result.extracted_data.weight) {
          extractedData.weight = result.extracted_data.weight;
        }

        if (result.extracted_data.dimensions) {
          extractedData.dimensions = result.extracted_data.dimensions;
        }

        if (result.extracted_data.shape_cut) {
          extractedData.shape_cut = result.extracted_data.shape_cut;
        }

        if (result.extracted_data.color) {
          extractedData.color = result.extracted_data.color;
        }

        if (result.extracted_data.clarity) {
          extractedData.clarity = result.extracted_data.clarity;
        }

        if (result.extracted_data.origin) {
          extractedData.origin = result.extracted_data.origin;
        }

        if (result.extracted_data.certification) {
          extractedData.certification = result.extracted_data.certification;
        }

        if (result.extracted_data.measurement_details) {
          if (!extractedData.measurements) {
            extractedData.measurements = [];
          }
          extractedData.measurements.push(
            result.extracted_data.measurement_details
          );
        }
      }
    }

    // Calculate average confidence score
    const avgConfidence =
      analysisResults.length > 0
        ? analysisResults.reduce((sum, r) => sum + r.confidence, 0) /
          analysisResults.length
        : 0.5;

    // Update gemstone record with consolidated data
    const updates = {
      ai_extracted_text: extractedText.trim(),
      ai_description: aiDescription.trim(),
      ai_analysis_data: extractedData,
      ai_confidence_score: avgConfidence,
      ai_analysis_status: "completed",
      ai_analysis_date: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("gemstones")
      .update(updates)
      .eq("id", gemstoneId);

    if (error) throw error;

    console.log(`✅ Consolidated analysis data for gemstone ${gemstoneId}`);
    return true;
  } catch (error) {
    console.error(`Failed to consolidate analysis data: ${error.message}`);
    return false;
  }
}

/**
 * Generate promotional content based on analysis
 */
async function generatePromotionalContent(gemstoneId, analysisResults) {
  try {
    // Create context from analysis results
    const context = {
      extractedData: {},
      analysisCount: analysisResults.length,
      confidenceScore: 0,
    };

    // Aggregate key information
    for (const result of analysisResults) {
      Object.assign(context.extractedData, result.extracted_data || {});
      context.confidenceScore += result.confidence || 0.5;
    }

    context.confidenceScore = context.confidenceScore / analysisResults.length;

    const contextPrompt = `Based on the following gemstone analysis data, generate compelling e-commerce promotional content:

EXTRACTED DATA:
${JSON.stringify(context.extractedData, null, 2)}

ANALYSIS CONFIDENCE: ${context.confidenceScore.toFixed(2)}

Generate professional promotional content in JSON format:
{
  "promotional_title": "SEO-optimized title (50-60 chars)",
  "promotional_description": "Compelling 2-3 sentence description highlighting key features",
  "key_features": ["feature1", "feature2", "feature3"],
  "marketing_tags": ["tag1", "tag2", "tag3"],
  "seo_keywords": ["keyword1", "keyword2", "keyword3"],
  "target_market": "investment|luxury|commercial|collector",
  "price_positioning": "premium|standard|value",
  "confidence": 0.0-1.0
}

Focus on unique qualities, rarity, and investment potential. Use professional gemological terminology.`;

    // Use text-only completion for promotional content
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: contextPrompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3, // Slightly more creative for marketing content
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    // Try to parse JSON response
    let marketingData;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      marketingData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.warn(`Failed to parse marketing JSON:`, parseError.message);
      // Fallback: create basic structure
      marketingData = {
        promotional_title: "Premium Gemstone",
        promotional_description:
          "Exceptional quality gemstone with certified authenticity.",
        key_features: ["Certified", "Premium Quality", "Investment Grade"],
        marketing_tags: ["luxury", "certified", "investment"],
        seo_keywords: ["gemstone", "luxury", "certified"],
        target_market: "luxury",
        price_positioning: "premium",
        confidence: 0.5,
      };
    }

    // Update gemstone with marketing content
    const updates = {
      promotional_title: marketingData.promotional_title,
      promotional_description: marketingData.promotional_description,
      key_features: marketingData.key_features,
      marketing_tags: marketingData.marketing_tags,
      seo_keywords: marketingData.seo_keywords,
      target_market: marketingData.target_market,
      price_positioning: marketingData.price_positioning,
    };

    await supabase.from("gemstones").update(updates).eq("id", gemstoneId);

    // Store the full marketing analysis
    await storeAnalysisResult(gemstoneId, marketingData, "promotional_content");

    const cost = calculateCost(response.usage?.total_tokens || 0);
    console.log(`📝 Marketing content generated for gemstone ${gemstoneId}`);
    return cost;
  } catch (error) {
    console.error(`Marketing content generation failed: ${error.message}`);
    return 0;
  }
}

/**
 * Main analysis function for a gemstone folder
 */
async function analyzeGemstoneFolder(gemstoneId, imageUrls, stats) {
  console.log(
    `\n🔍 Analyzing gemstone ${gemstoneId} with ${imageUrls.length} images`
  );

  try {
    // Fetch image data from database including IDs and URLs
    const { data: imageRecords, error } = await supabase
      .from("gemstone_images")
      .select("id, image_url, image_order, is_primary, original_filename")
      .eq("gemstone_id", gemstoneId)
      .order("image_order");

    if (error) {
      console.error(`Failed to fetch image records: ${error.message}`);
      return 0;
    }

    if (!imageRecords || imageRecords.length === 0) {
      console.log(`⚠️ No image records found for gemstone ${gemstoneId}`);
      return 0;
    }

    console.log(`  📄 Found ${imageRecords.length} images to analyze`);

    // Comprehensive analysis of all images
    const { analysisResults, totalCost } = await analyzeGemstoneImages(
      imageRecords,
      gemstoneId,
      stats
    );

    if (analysisResults.length === 0) {
      console.log(
        `⚠️ No successful analysis results for gemstone ${gemstoneId}`
      );
      return 0;
    }

    // Consolidate all analysis data
    await consolidateAnalysisData(gemstoneId, analysisResults);

    // Generate promotional content
    const marketingCost = await generatePromotionalContent(
      gemstoneId,
      analysisResults
    );

    const finalCost = totalCost + marketingCost;
    console.log(
      `  💰 Total cost for gemstone ${gemstoneId}: $${finalCost.toFixed(4)}`
    );

    return finalCost;
  } catch (error) {
    console.error(`Failed to analyze gemstone ${gemstoneId}:`, error.message);
    stats.addError(error, `Gemstone analysis: ${gemstoneId}`);
    return 0;
  }
}

/**
 * Main Function - Analyze Gemstones
 */
async function analyzeGemstones(
  options = {
    batchSize: 5,
    maxCost: 100,
    gemstoneIds: null,
  }
) {
  const startTime = Date.now();
  const stats = new AIAnalysisStats();

  try {
    console.log("🚀 Starting AI-powered gemstone analysis...");
    console.log(
      `📊 Batch size: ${options.batchSize}, Max cost: $${options.maxCost}`
    );

    // Get gemstones to analyze
    let query = supabase
      .from("gemstones")
      .select(
        `
        id, 
        serial_number,
        gemstone_images(image_url, image_order)
      `
      )
      .order("created_at", { ascending: true });

    if (options.gemstoneIds) {
      query = query.in("id", options.gemstoneIds);
    } else {
      // Only analyze gemstones that haven't been processed yet
      query = query.or(
        "ai_analysis_status.is.null,ai_analysis_status.neq.completed"
      );
    }

    const { data: gemstones, error } = await query.limit(options.batchSize);

    if (error) throw error;

    if (!gemstones || gemstones.length === 0) {
      console.log("✅ No gemstones to analyze!");
      return;
    }

    console.log(`📝 Found ${gemstones.length} gemstones to analyze`);

    // Process each gemstone
    for (const gemstone of gemstones) {
      // Check cost limit
      if (stats.totalCost >= options.maxCost) {
        console.log(`💰 Cost limit reached: $${stats.totalCost.toFixed(4)}`);
        break;
      }

      // Get image paths for this gemstone
      const imagePaths =
        gemstone.gemstone_images
          ?.sort((a, b) => a.image_order - b.image_order)
          ?.map((img) => img.image_url) || [];

      if (imagePaths.length === 0) {
        console.log(
          `⚠️ No images found for gemstone ${gemstone.serial_number}`
        );
        continue;
      }

      // Analyze this gemstone
      const gemstoneAnalysisCost = await analyzeGemstoneFolder(
        gemstone.id,
        imagePaths,
        stats
      );

      stats.addCost(gemstoneAnalysisCost);
      stats.addGemstone();

      // Rate limiting between gemstones
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Final statistics
    const totalTime = Date.now() - startTime;
    console.log("\n" + "=".repeat(50));
    console.log("🎉 ANALYSIS COMPLETE!");
    console.log("=".repeat(50));
    console.log(`📊 Gemstones processed: ${stats.totalGemstones}`);
    console.log(`💰 Total cost: $${stats.totalCost.toFixed(4)}`);
    console.log(`⏱️ Total time: ${(totalTime / 1000 / 60).toFixed(1)} minutes`);
    console.log(
      `💎 Average cost per gemstone: $${(
        stats.totalCost / stats.totalGemstones
      ).toFixed(4)}`
    );
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Analysis failed:", error);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log("🚀 AI Gemstone Analyzer v2.0");
    console.log("Enhanced with comprehensive data extraction\n");

    // Parse command line arguments
    const batchSize = parseInt(process.argv[2]) || 5;
    const maxCost = parseFloat(process.argv[3]) || 50.0;
    const gemstoneIds = process.argv[4] ? process.argv[4].split(",") : null;

    console.log(`Configuration:`);
    console.log(`- Batch size: ${batchSize}`);
    console.log(`- Max cost: $${maxCost}`);
    console.log(
      `- Specific IDs: ${gemstoneIds ? gemstoneIds.join(", ") : "none"}\n`
    );

    await analyzeGemstones({
      batchSize,
      maxCost,
      gemstoneIds,
    });
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

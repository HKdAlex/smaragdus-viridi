#!/usr/bin/env node

import { dirname, join } from "path";

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
// Load environment variables
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from the project root
dotenv.config({ path: join(__dirname, "..", ".env.local") });

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error("❌ Missing required environment variables");
  console.error(
    "Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

export class GemstoneAIAnalyzer {
  constructor(options = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    this.dryRun = options.dryRun || false;
    this.batchSize = options.batchSize || 5;
    this.delayMs = options.delayMs || 2000;
    this.maxTokens = options.maxTokens || 4000;
    this.model = options.model || "gpt-4o";

    this.stats = {
      gemstonesAnalyzed: 0,
      imagesProcessed: 0,
      totalCost: 0,
      errors: 0,
      startTime: Date.now(),
    };
  }

  async analyzeGemstoneCollection(batchId = null) {
    console.log("🚀 Starting AI analysis of gemstone collection...");
    console.log(`Mode: ${this.dryRun ? "DRY RUN" : "LIVE ANALYSIS"}`);

    try {
      // Get gemstones to analyze
      let query = this.supabase
        .from("gemstones")
        .select(
          `
          *,
          gemstone_images(id, image_url, image_type, ai_analyzed),
          gemstone_videos(id, video_url, ai_analyzed)
        `
        )
        .eq("ai_analyzed", false);

      if (batchId) {
        query = query.eq("import_batch_id", batchId);
      }

      const { data: gemstones, error } = await query;

      if (error) throw error;

      console.log(`📊 Found ${gemstones.length} gemstones to analyze`);

      // Process in batches to respect rate limits
      for (let i = 0; i < gemstones.length; i += this.batchSize) {
        const batch = gemstones.slice(i, i + this.batchSize);

        console.log(
          `\n📦 Processing batch ${
            Math.floor(i / this.batchSize) + 1
          }/${Math.ceil(gemstones.length / this.batchSize)}`
        );

        for (const gemstone of batch) {
          await this.analyzeGemstoneWithAllImages(gemstone);

          // Rate limiting delay
          if (!this.dryRun && i < gemstones.length - 1) {
            await this.delay(this.delayMs);
          }
        }
      }

      this.printFinalStats();
    } catch (error) {
      console.error("❌ Collection analysis failed:", error);
      this.stats.errors++;
    }
  }

  async analyzeGemstoneWithAllImages(gemstone) {
    console.log(`\n💎 Analyzing: ${gemstone.serial_number}`);

    try {
      const images = gemstone.gemstone_images || [];
      const videos = gemstone.gemstone_videos || [];

      if (this.dryRun) {
        console.log(
          `   📸 ${images.length} images, 🎥 ${videos.length} videos`
        );
        this.stats.gemstonesAnalyzed++;
        this.stats.imagesProcessed += images.length;
        return;
      }

      if (images.length === 0) {
        console.log("   ⚠️ No images to analyze");
        return;
      }

      // **Multi-Image Analysis**: Send all images to AI in one API call
      const analysisResult = await this.performMultiImageAnalysis(
        gemstone,
        images
      );

      if (analysisResult) {
        // Store comprehensive analysis results
        await this.storeAnalysisResults(gemstone.id, analysisResult);

        // Update gemstone with extracted data and promotional content
        await this.updateGemstoneFromAnalysis(gemstone.id, analysisResult);

        // Update individual image classifications
        await this.updateImageClassifications(
          images,
          analysisResult.image_classifications
        );

        // Mark as analyzed
        await this.markGemstoneAsAnalyzed(gemstone.id);

        console.log(
          `   ✅ Analysis complete - Confidence: ${analysisResult.overall_confidence}%`
        );
      }

      this.stats.gemstonesAnalyzed++;
      this.stats.imagesProcessed += images.length;
    } catch (error) {
      console.error(
        `   ❌ Analysis failed for ${gemstone.serial_number}:`,
        error.message
      );
      this.stats.errors++;

      // Store error for debugging
      await this.storeAnalysisError(gemstone.id, error);
    }
  }

  async performMultiImageAnalysis(gemstone, images) {
    console.log(`   🔍 Analyzing ${images.length} images together...`);

    const startTime = Date.now();

    // Prepare image content for OpenAI
    const imageContent = images.map((img) => ({
      type: "image_url",
      image_url: {
        url: img.image_url,
        detail: "high",
      },
    }));

    const prompt = this.buildComprehensiveAnalysisPrompt(gemstone);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              ...imageContent,
            ],
          },
        ],
      });

      const processingTime = Date.now() - startTime;
      const estimatedCost = this.estimateApiCost(response.usage);
      this.stats.totalCost += estimatedCost;

      console.log(
        `   💰 Cost: $${estimatedCost.toFixed(
          4
        )} | ⏱️ Time: ${processingTime}ms`
      );

      // Parse the structured response
      const analysisText = response.choices[0].message.content;
      const analysisResult = this.parseAnalysisResponse(analysisText, {
        processing_time_ms: processingTime,
        estimated_cost_usd: estimatedCost,
        model_version: this.model,
        token_usage: response.usage,
      });

      return analysisResult;
    } catch (error) {
      if (error.status === 429) {
        console.log("   ⏳ Rate limit hit, waiting 60 seconds...");
        await this.delay(60000);
        return this.performMultiImageAnalysis(gemstone, images);
      }
      throw error;
    }
  }

  buildComprehensiveAnalysisPrompt(gemstone) {
    return `You are an expert gemologist analyzing a collection of images for a single gemstone. 

**GEMSTONE INFO:**
- Serial: ${gemstone.serial_number}
- Current Type: ${gemstone.name}
- Folder: ${gemstone.import_folder_path || "Unknown"}

**ANALYSIS TASKS:**

1. **IMAGE CLASSIFICATION**: For each image, determine its type:
   - "gemstone": Photos showing the actual gemstone(s)
   - "certificate": Official certification documents
   - "label": Price tags, inventory labels with written info
   - "measurement": Photos showing gemstone being measured with rulers/calipers
   - "unknown": Unable to determine clearly

2. **GEMSTONE IDENTIFICATION**: From gemstone photos, identify:
   - Gemstone type (emerald, diamond, ruby, sapphire, etc.)
   - Cut style (round, oval, emerald, cushion, etc.)
   - Color (use standard gemological terms)
   - Clarity assessment
   - Estimated carat weight if visible
   - Quality assessment

3. **DATA EXTRACTION**: From certificates, labels, and measurements:
   - Weight in carats
   - Dimensions (length x width x depth in mm)
   - Price information
   - Certificate numbers
   - Origin information
   - Any other technical specifications

4. **PROMOTIONAL CONTENT**: Create marketing content:
   - Compelling product description (2-3 sentences)
   - Detailed promotional text (1-2 paragraphs)
   - Key selling points (3-5 bullet points)
   - Suggested target customer type

**RESPONSE FORMAT** (JSON):
\`\`\`json
{
  "overall_confidence": 85,
  "gemstone_properties": {
    "type": "emerald",
    "cut": "emerald",
    "color": "vivid green",
    "clarity": "VS1",
    "weight_carats": 2.45,
    "length_mm": 8.2,
    "width_mm": 6.1,
    "depth_mm": 4.8,
    "origin": "Colombia",
    "quality_grade": "AAA"
  },
  "image_classifications": [
    {
      "image_index": 0,
      "classification": "gemstone",
      "confidence": 95,
      "description": "High-quality photo showing emerald from top view"
    },
    {
      "image_index": 1,
      "classification": "certificate",
      "confidence": 90,
      "description": "Gemological certificate with technical specifications",
      "extracted_text": "Certificate text here..."
    }
  ],
  "extracted_data": {
    "certificates": [],
    "measurements": {},
    "pricing": {},
    "technical_specs": {}
  },
  "promotional_content": {
    "title": "Stunning 2.45ct Colombian Emerald",
    "description": "Exceptional vivid green Colombian emerald with excellent clarity and classic emerald cut.",
    "promotional_text": "This magnificent 2.45-carat Colombian emerald showcases the finest characteristics that make emeralds so coveted. The vivid green color exhibits exceptional saturation and tone, while the VS1 clarity ensures brilliant light performance. Cut in the traditional emerald style, this gemstone represents excellent value for collectors and jewelry designers seeking premium quality.",
    "highlights": [
      "Premium Colombian origin",
      "Vivid green color saturation", 
      "Excellent VS1 clarity",
      "Classic emerald cut",
      "Perfect for high-end jewelry"
    ],
    "target_customer": "High-end jewelry designers and serious collectors"
  },
  "analysis_notes": [
    "Multiple angles confirm excellent cut quality",
    "Certificate validates origin claims",
    "Measurements consistent across images"
  ]
}
\`\`\`

Analyze ALL images together to provide the most accurate and comprehensive assessment possible.`;
  }

  parseAnalysisResponse(responseText, metadata) {
    try {
      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : responseText;

      const parsed = JSON.parse(jsonString);

      // Add metadata
      parsed.metadata = metadata;
      parsed.analysis_timestamp = new Date().toISOString();

      return parsed;
    } catch (error) {
      console.error("   ⚠️ Failed to parse AI response:", error.message);

      // Return basic structure with raw response for manual review
      return {
        overall_confidence: 0,
        gemstone_properties: {},
        image_classifications: [],
        extracted_data: {},
        promotional_content: {},
        analysis_notes: [`Parse error: ${error.message}`],
        raw_response: responseText,
        metadata,
      };
    }
  }

  async storeAnalysisResults(gemstoneId, analysisResult) {
    const { error } = await this.supabase.from("ai_analysis_results").insert({
      gemstone_id: gemstoneId,
      analysis_type: "comprehensive_multi_image",
      input_data: {
        image_count: analysisResult.image_classifications?.length || 0,
      },
      raw_response: analysisResult,
      extracted_data: analysisResult.extracted_data,
      confidence_score: analysisResult.overall_confidence / 100,
      processing_cost_usd: analysisResult.metadata?.estimated_cost_usd,
      processing_time_ms: analysisResult.metadata?.processing_time_ms,
      ai_model_version: analysisResult.metadata?.model_version,
    });

    if (error) {
      console.error("   ⚠️ Failed to store analysis results:", error);
    }
  }

  async updateGemstoneFromAnalysis(gemstoneId, analysisResult) {
    const updates = {
      ai_confidence_score: analysisResult.overall_confidence / 100,
      ai_analysis_date: new Date().toISOString(),
    };

    // Update gemstone properties if confidence is high enough
    if (analysisResult.overall_confidence >= 70) {
      const props = analysisResult.gemstone_properties;

      if (props.type) updates.name = props.type;
      if (props.cut) updates.cut = props.cut;
      if (props.color) updates.color = props.color;
      if (props.clarity) updates.clarity = props.clarity;
      if (props.weight_carats) updates.weight_carats = props.weight_carats;
      if (props.length_mm) updates.length_mm = props.length_mm;
      if (props.width_mm) updates.width_mm = props.width_mm;
      if (props.depth_mm) updates.depth_mm = props.depth_mm;
    }

    // Add promotional content
    const promo = analysisResult.promotional_content;
    if (promo) {
      if (promo.description) updates.description = promo.description;
      if (promo.promotional_text)
        updates.promotional_text = promo.promotional_text;
      if (promo.highlights) updates.marketing_highlights = promo.highlights;
    }

    const { error } = await this.supabase
      .from("gemstones")
      .update(updates)
      .eq("id", gemstoneId);

    if (error) {
      console.error("   ⚠️ Failed to update gemstone:", error);
    }
  }

  async updateImageClassifications(images, classifications) {
    if (!classifications || !Array.isArray(classifications)) return;

    for (const classification of classifications) {
      const imageIndex = classification.image_index;
      if (imageIndex >= 0 && imageIndex < images.length) {
        const image = images[imageIndex];

        // Update image type in gemstone_images table
        await this.supabase
          .from("gemstone_images")
          .update({
            image_type: classification.classification,
            ai_analyzed: true,
            ai_analysis_date: new Date().toISOString(),
          })
          .eq("id", image.id);

        // Store detailed classification
        await this.supabase.from("image_classifications").insert({
          image_id: image.id,
          classification: classification.classification,
          confidence_score: classification.confidence / 100,
          extracted_text: classification.extracted_text,
          extracted_data: classification.extracted_data,
          ai_description: classification.description,
        });
      }
    }
  }

  async markGemstoneAsAnalyzed(gemstoneId) {
    const { error } = await this.supabase
      .from("gemstones")
      .update({
        ai_analyzed: true,
        ai_analysis_date: new Date().toISOString(),
      })
      .eq("id", gemstoneId);

    if (error) {
      console.error("   ⚠️ Failed to mark gemstone as analyzed:", error);
    }
  }

  async storeAnalysisError(gemstoneId, error) {
    await this.supabase.from("ai_analysis_results").insert({
      gemstone_id: gemstoneId,
      analysis_type: "error",
      input_data: { error_message: error.message },
      raw_response: { error: error.message, stack: error.stack },
      confidence_score: 0,
    });
  }

  estimateApiCost(usage) {
    if (!usage) return 0;

    // GPT-4o pricing (approximate)
    const inputCostPer1k = 0.005;
    const outputCostPer1k = 0.015;

    const inputCost = (usage.prompt_tokens / 1000) * inputCostPer1k;
    const outputCost = (usage.completion_tokens / 1000) * outputCostPer1k;

    return inputCost + outputCost;
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  printFinalStats() {
    const duration = (Date.now() - this.stats.startTime) / 1000;

    console.log("\n📊 ANALYSIS COMPLETE");
    console.log("═══════════════════");
    console.log(`💎 Gemstones analyzed: ${this.stats.gemstonesAnalyzed}`);
    console.log(`📸 Images processed: ${this.stats.imagesProcessed}`);
    console.log(`💰 Total cost: $${this.stats.totalCost.toFixed(2)}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    console.log(`⏱️ Duration: ${duration.toFixed(1)}s`);
    console.log(
      `📈 Rate: ${((this.stats.gemstonesAnalyzed / duration) * 60).toFixed(
        1
      )} gems/min`
    );
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new GemstoneAIAnalyzer({
    dryRun: process.argv.includes("--dry-run"),
    batchSize:
      parseInt(
        process.argv
          .find((arg) => arg.startsWith("--batch-size="))
          ?.split("=")[1]
      ) || 5,
    delayMs:
      parseInt(
        process.argv.find((arg) => arg.startsWith("--delay="))?.split("=")[1]
      ) || 2000,
  });

  const batchId = process.argv
    .find((arg) => arg.startsWith("--batch-id="))
    ?.split("=")[1];

  analyzer
    .analyzeGemstoneCollection(batchId)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

# AI Metadata Generation System - Implementation Prompt

## 🎯 **Objective**

Implement an AI-powered metadata generation system that analyzes gemstone images and videos to automatically generate rich, accurate descriptions, detect properties, and create marketing content for each stone in the Smaragdus Viridi e-commerce platform.

## 🔍 **Core Requirements**

### **1. Image Analysis & Property Detection**

- **Visual Gemstone Identification**: Analyze images to confirm/correct gemstone type (emerald, sapphire, etc.)
- **Color Analysis**: Detect precise color grades and undertones (e.g., "vivid green with slight blue undertones")
- **Cut Quality Assessment**: Evaluate cut precision, symmetry, and proportions
- **Clarity Estimation**: Identify inclusions, blemishes, and overall clarity grade
- **Size Estimation**: Calculate approximate dimensions from reference objects or known scales
- **Surface Quality**: Assess polish, luster, and overall finish quality

### **2. Intelligent Descriptions Generation**

- **Technical Descriptions**: Professional gemological terminology for B2B clients
- **Consumer-Friendly Descriptions**: Accessible language for retail customers
- **Poetic/Marketing Copy**: Emotional, evocative descriptions for luxury positioning
- **Multi-Language Support**: Generate descriptions in English, Russian, and other target markets

### **3. Market Intelligence & Pricing**

- **Comparative Analysis**: Compare against similar stones in database
- **Market Value Estimation**: Suggest price ranges based on detected properties
- **Rarity Assessment**: Evaluate uniqueness and investment potential
- **Certification Recommendations**: Suggest appropriate certification needs

### **4. SEO & Marketing Optimization**

- **Keyword Generation**: Extract relevant search terms and tags
- **Title Optimization**: Create compelling, SEO-friendly titles
- **Meta Descriptions**: Generate search-optimized descriptions
- **Social Media Captions**: Create platform-specific content

## 🏗️ **Technical Architecture**

### **Database Schema Extension**

```sql
-- AI Analysis Results Table
CREATE TABLE ai_gemstone_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,

  -- Visual Analysis Results
  detected_type gemstone_type,
  detected_color gem_color,
  detected_cut gem_cut,
  estimated_clarity gem_clarity,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00

  -- Measurements & Properties
  estimated_weight_carats DECIMAL(8,3),
  estimated_dimensions JSONB, -- {length_mm, width_mm, depth_mm}
  quality_grade TEXT, -- A+, A, B+, B, C

  -- Descriptions (Multi-language)
  technical_description_en TEXT,
  technical_description_ru TEXT,
  consumer_description_en TEXT,
  consumer_description_ru TEXT,
  marketing_copy_en TEXT,
  marketing_copy_ru TEXT,

  -- Market Intelligence
  estimated_value_range JSONB, -- {min_usd, max_usd, currency}
  rarity_score INTEGER, -- 1-10 scale
  investment_potential TEXT, -- high, medium, low
  comparable_stones TEXT[], -- Array of similar stone IDs

  -- SEO & Marketing
  seo_title TEXT,
  seo_description TEXT,
  keywords TEXT[],
  hashtags TEXT[],

  -- Analysis Metadata
  ai_model_version TEXT,
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  processing_time_ms INTEGER,
  images_analyzed TEXT[], -- URLs of analyzed images

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ai_analysis_gemstone_id ON ai_gemstone_analysis(gemstone_id);
CREATE INDEX idx_ai_analysis_confidence ON ai_gemstone_analysis(confidence_score DESC);
CREATE INDEX idx_ai_analysis_quality ON ai_gemstone_analysis(quality_grade);
```

### **AI Service Integration Options**

#### **Option A: OpenAI GPT-4 Vision**

```typescript
// features/ai/services/openai-vision-service.ts
export class OpenAIVisionService {
  async analyzeGemstone(images: string[], videos?: string[]) {
    const analysis = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: GEMSTONE_ANALYSIS_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this gemstone in detail" },
            ...images.map((url) => ({
              type: "image_url",
              image_url: { url },
            })),
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1, // Low for consistent analysis
    });

    return this.parseAnalysisResponse(analysis.choices[0].message.content);
  }
}
```

#### **Option B: Google Gemini Pro Vision**

```typescript
// features/ai/services/gemini-vision-service.ts
export class GeminiVisionService {
  async analyzeGemstone(images: Buffer[], prompt: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const imageParts = images.map((buffer) => ({
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: "image/jpeg",
      },
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    return this.parseGeminiResponse(result.response.text());
  }
}
```

#### **Option C: Claude 3 Vision (Anthropic)**

```typescript
// features/ai/services/claude-vision-service.ts
export class ClaudeVisionService {
  async analyzeGemstone(images: string[]) {
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: GEMSTONE_ANALYSIS_PROMPT },
            ...images.map((url) => ({
              type: "image",
              source: { type: "url", url },
            })),
          ],
        },
      ],
    });

    return this.parseClaudeResponse(message.content[0].text);
  }
}
```

## 📝 **AI Analysis Prompts**

### **System Prompt for Gemstone Analysis**

```
You are a world-class gemologist and AI vision expert specializing in precious stone analysis. Your task is to analyze gemstone images with the precision of a certified gemologist.

ANALYSIS FRAMEWORK:
1. IDENTIFICATION: Determine gemstone type with confidence level
2. QUALITY ASSESSMENT: Evaluate cut, color, clarity, and carat weight
3. MARKET ANALYSIS: Assess value, rarity, and investment potential
4. DESCRIPTIONS: Generate technical and consumer-friendly descriptions

RESPONSE FORMAT: Always respond in valid JSON format with the following structure:
{
  "identification": {
    "gemstone_type": "emerald|sapphire|ruby|diamond|etc",
    "confidence": 0.95,
    "alternative_possibilities": ["tourmaline", "beryl"]
  },
  "properties": {
    "color": {
      "primary": "green",
      "undertones": ["blue"],
      "saturation": "vivid",
      "tone": "medium"
    },
    "cut": {
      "type": "emerald",
      "quality": "excellent",
      "symmetry": "very good",
      "proportions": "ideal"
    },
    "clarity": {
      "grade": "VS1",
      "inclusions": ["minor crystal inclusions"],
      "transparency": "transparent"
    },
    "estimated_weight": 2.34,
    "dimensions": {
      "length_mm": 8.2,
      "width_mm": 6.1,
      "depth_mm": 4.8
    }
  },
  "quality": {
    "overall_grade": "A+",
    "cut_grade": "excellent",
    "color_grade": "vivid",
    "clarity_grade": "very good",
    "polish": "excellent",
    "luster": "vitreous"
  },
  "descriptions": {
    "technical_en": "A 2.34-carat emerald-cut Colombian emerald displaying exceptional vivid green color with minor blue undertones...",
    "technical_ru": "Изумруд весом 2.34 карата изумрудной огранки колумбийского происхождения...",
    "consumer_en": "This stunning emerald captures the essence of nature's finest green...",
    "consumer_ru": "Этот потрясающий изумруд воплощает в себе саму суть природной зелени...",
    "marketing_en": "Discover the mystique of Colombian emerald perfection...",
    "marketing_ru": "Откройте для себя мистику колумбийского изумрудного совершенства..."
  },
  "market": {
    "estimated_value_range": {
      "min_usd": 8500,
      "max_usd": 12000
    },
    "rarity_score": 8,
    "investment_potential": "high",
    "market_factors": ["Colombian origin", "exceptional color", "good size"]
  },
  "seo": {
    "title": "2.34ct Colombian Emerald - Vivid Green Emerald Cut Gemstone",
    "description": "Premium 2.34-carat Colombian emerald with exceptional vivid green color and emerald cut. Perfect for fine jewelry and investment.",
    "keywords": ["colombian emerald", "vivid green emerald", "emerald cut", "2.34 carat", "investment gemstone"],
    "hashtags": ["#ColombianEmerald", "#VividGreen", "#EmeraldCut", "#PreciousGemstone", "#Investment"]
  }
}

IMPORTANT GUIDELINES:
- Base analysis only on visible features in the images
- Provide confidence levels for all assessments
- Use professional gemological terminology
- Consider market context and pricing trends
- Generate compelling but accurate descriptions
- Ensure all text is grammatically correct and engaging
```

### **Specialized Prompts by Gemstone Type**

#### **Diamond Analysis Prompt**

```
DIAMOND-SPECIFIC ANALYSIS:
- Evaluate the 4Cs (Cut, Color, Clarity, Carat) with precision
- Assess fire, brilliance, and scintillation
- Identify cut type and quality (proportions, symmetry, polish)
- Determine color grade (D-Z scale or fancy colors)
- Estimate clarity grade (FL to I3)
- Look for fluorescence indicators
- Assess potential certification requirements (GIA, AGS, etc.)
```

#### **Colored Stone Analysis Prompt**

```
COLORED GEMSTONE ANALYSIS:
- Identify specific variety and origin indicators
- Evaluate color saturation, tone, and hue
- Assess transparency and clarity
- Look for treatment indicators
- Consider origin characteristics (Kashmir sapphire, Burmese ruby, etc.)
- Evaluate cut quality for colored stones
- Assess pleochroism if visible
```

## 🔄 **Integration Workflow**

### **1. Batch AI Analysis Script**

```typescript
// scripts/ai-analysis-batch-processor.mjs
export class AIAnalysisBatchProcessor {
  async processGemstonesWithAI(batchId?: string) {
    const gemstones = await this.getGemstonesForAnalysis(batchId);

    for (const gemstone of gemstones) {
      try {
        // Get images for analysis
        const images = await this.getGemstoneImages(gemstone.id);

        // Run AI analysis
        const analysis = await this.aiService.analyzeGemstone(images);

        // Store results
        await this.storeAnalysisResults(gemstone.id, analysis);

        // Update gemstone with AI insights
        await this.updateGemstoneFromAI(gemstone.id, analysis);

        console.log(`✅ AI analysis completed for ${gemstone.serial_number}`);
      } catch (error) {
        console.error(
          `❌ AI analysis failed for ${gemstone.serial_number}:`,
          error
        );
      }
    }
  }
}
```

### **2. Real-time Analysis Integration**

```typescript
// Integrate into import system
async function processGemstoneWithAI(gemstone, images) {
  // Upload images first
  const uploadedImages = await uploadImages(images);

  // Run AI analysis
  const aiAnalysis = await aiService.analyzeGemstone(uploadedImages);

  // Update gemstone with AI insights
  const enhancedGemstone = {
    ...gemstone,
    weight_carats: aiAnalysis.properties.estimated_weight,
    length_mm: aiAnalysis.properties.dimensions.length_mm,
    width_mm: aiAnalysis.properties.dimensions.width_mm,
    depth_mm: aiAnalysis.properties.dimensions.depth_mm,
    // Use AI-detected properties if confidence > 0.8
    ...(aiAnalysis.identification.confidence > 0.8 && {
      name: aiAnalysis.identification.gemstone_type,
      color: aiAnalysis.properties.color.primary,
      cut: aiAnalysis.properties.cut.type,
    }),
  };

  return { gemstone: enhancedGemstone, aiAnalysis };
}
```

## 📊 **Performance & Cost Optimization**

### **Batch Processing Strategy**

- Process images during off-peak hours
- Implement rate limiting to manage API costs
- Cache analysis results to avoid re-processing
- Use image compression to reduce API payload costs

### **Cost Management**

```typescript
const AI_COST_LIMITS = {
  daily_budget_usd: 50,
  max_images_per_gemstone: 5,
  image_resize_max: 1024, // Reduce API costs
  batch_size: 10, // Process in batches
};
```

## 🎯 **Success Metrics**

### **Quality Metrics**

- **Accuracy Rate**: >90% correct gemstone identification
- **Confidence Threshold**: Only use AI results with >80% confidence
- **Human Verification**: Sample 10% of AI analyses for quality control

### **Business Impact**

- **SEO Improvement**: Track organic search ranking improvements
- **Conversion Rate**: Measure impact of AI descriptions on sales
- **Time Savings**: Reduce manual cataloging time by 80%
- **Customer Engagement**: Track time spent on product pages

## 🚀 **Implementation Plan**

### **Phase 1: Core AI Integration (Week 1-2)**

1. Set up AI service connections (OpenAI/Gemini/Claude)
2. Create database schema for AI analysis results
3. Implement basic image analysis workflow
4. Test with 50 sample gemstones

### **Phase 2: Description Generation (Week 3-4)**

1. Develop multi-language description templates
2. Implement SEO optimization features
3. Create quality assessment algorithms
4. Test market intelligence features

### **Phase 3: Production Integration (Week 5-6)**

1. Integrate AI analysis into import system
2. Create admin interface for AI result review
3. Implement batch processing for existing inventory
4. Set up monitoring and cost controls

### **Phase 4: Advanced Features (Week 7-8)**

1. Implement comparative analysis features
2. Add market pricing intelligence
3. Create customer-facing AI insights
4. Optimize for performance and cost

Would you like me to proceed with implementing any specific part of this AI metadata generation system?

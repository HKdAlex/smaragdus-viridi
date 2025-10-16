/**
 * Image Analysis for Gemstones
 * Detects cut type and selects best primary image using GPT-4 Vision
 */

import { DEFAULT_TEMPERATURE, TIMEOUT_MS, withTimeout } from "./config.mjs";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use GPT-4 Vision for image analysis
const VISION_MODEL = "gpt-4o"; // Latest vision model

/**
 * Schema for cut detection response
 */
const CUT_DETECTION_SCHEMA = {
  type: "object",
  properties: {
    detected_cut: {
      type: "string",
      description:
        "The cut/shape of the gemstone detected from the image (e.g., round, princess, emerald, cushion, oval, pear, marquise, asscher, radiant, heart, trillion, baguette)",
    },
    confidence: {
      type: "number",
      description: "Confidence score from 0 to 1",
    },
    reasoning: {
      type: "string",
      description: "Brief explanation of why this cut was detected",
    },
    matches_metadata: {
      type: "boolean",
      description: "Whether the detected cut matches the provided metadata",
    },
    metadata_cut: {
      type: "string",
      description: "The cut from metadata for comparison",
    },
  },
  required: [
    "detected_cut",
    "confidence",
    "reasoning",
    "matches_metadata",
    "metadata_cut",
  ],
  additionalProperties: false,
};

/**
 * Schema for primary image selection response
 */
const PRIMARY_IMAGE_SELECTION_SCHEMA = {
  type: "object",
  properties: {
    selected_index: {
      type: "number",
      description:
        "Index of the best image to use as primary (0-based). MUST select the best available image. Only use -1 if ALL images are completely unusable (corrupted/blank).",
    },
    reasoning: {
      type: "string",
      description: "Explanation of why this image was selected",
    },
    image_scores: {
      type: "array",
      description: "Individual scores for each image",
      items: {
        type: "object",
        properties: {
          index: { type: "number" },
          quality_score: {
            type: "number",
            description: "Visual quality score (0-1)",
          },
          composition_score: {
            type: "number",
            description: "Composition and framing score (0-1)",
          },
          clarity_score: {
            type: "number",
            description: "Clarity and focus score (0-1)",
          },
          professional_score: {
            type: "number",
            description: "Professional presentation score (0-1)",
          },
          overall_score: {
            type: "number",
            description: "Overall score (0-1)",
          },
          issues: {
            type: "array",
            items: { type: "string" },
            description: "Any issues or concerns with this image",
          },
        },
        required: [
          "index",
          "quality_score",
          "composition_score",
          "clarity_score",
          "professional_score",
          "overall_score",
          "issues",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["selected_index", "reasoning", "image_scores"],
  additionalProperties: false,
};

/**
 * Detect gemstone cut from images
 * @param {Object} options
 * @param {Array<string>} options.images - Array of base64 encoded images
 * @param {string} options.metadataCut - Cut type from metadata for validation
 * @returns {Promise<Object>} Detection results with confidence and validation
 */
export async function detectGemstoneCut(options) {
  const { images, metadataCut } = options;

  if (!images || images.length === 0) {
    throw new Error("At least one image is required for cut detection");
  }

  // Use up to 3 images for cut detection
  const imagesToAnalyze = images.slice(0, 3);

  const systemPrompt = `You are an expert gemologist with extensive experience in identifying gemstone cuts and shapes.
Your task is to analyze the provided gemstone images and determine the cut/shape with high accuracy.

Common cuts include:
- Round (circular)
- Princess (square with pointed corners)
- Emerald (rectangular with cut corners)
- Cushion (square/rectangular with rounded corners)
- Oval
- Pear (teardrop)
- Marquise (football/navette)
- Asscher (square with cropped corners)
- Radiant (rectangular with cropped corners)
- Heart
- Trillion (triangular)
- Baguette (long rectangular)

Analyze the shape, faceting pattern, and proportions carefully.
Compare your detection with the metadata cut provided and flag any discrepancies.`;

  const userPrompt = `Please analyze these gemstone image(s) and detect the cut/shape.

Metadata indicates the cut is: "${metadataCut}"

Carefully examine:
1. The overall shape and outline of the gemstone
2. The faceting pattern and arrangement
3. Corner and edge treatments
4. Proportions and symmetry

Provide your detection with confidence score and reasoning.
Flag if your detection doesn't match the metadata cut.`;

  try {
    const content = [
      {
        type: "text",
        text: userPrompt,
      },
    ];

    // Add all images to the content (base64 encoded)
    for (const imageBase64 of imagesToAnalyze) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/webp;base64,${imageBase64}`,
          detail: "high", // High detail for accurate detection
        },
      });
    }

    const response = await withTimeout(
      openai.chat.completions.create({
        model: VISION_MODEL,
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "GemCutDetection",
            schema: CUT_DETECTION_SCHEMA,
            strict: true,
          },
        },
      }),
      TIMEOUT_MS.IMAGE_ANALYSIS || 30000
    );

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      ...result,
      images_analyzed: imagesToAnalyze.length,
      model: VISION_MODEL,
    };
  } catch (error) {
    console.error("Cut detection failed:", error);
    throw new Error(`Cut detection failed: ${error.message}`);
  }
}

/**
 * Select the best primary image from a set of gemstone images
 * @param {Object} options
 * @param {Array<string>} options.images - Array of base64 encoded images
 * @param {Object} options.gemstoneInfo - Basic gemstone info for context
 * @returns {Promise<Object>} Selection results with scores and reasoning
 */
export async function selectPrimaryImage(options) {
  const { images, gemstoneInfo } = options;

  if (!images || images.length === 0) {
    throw new Error("At least one image is required for primary selection");
  }

  if (images.length === 1) {
    return {
      selected_index: 0,
      reasoning: "Only one image available",
      image_scores: [
        {
          index: 0,
          quality_score: 0.8,
          composition_score: 0.8,
          clarity_score: 0.8,
          professional_score: 0.8,
          overall_score: 0.8,
          issues: [],
        },
      ],
      model: VISION_MODEL,
    };
  }

  const systemPrompt = `You are a professional gemstone photographer and e-commerce product specialist.
Your task is to select the best primary image for a gemstone product listing from the available images.

Evaluate each image based on:
1. **Visual Quality**: Resolution, lighting, color accuracy
2. **Composition**: Framing, background, angle, positioning
3. **Clarity**: Focus, sharpness, detail visibility
4. **Professional Presentation**: Product photography standards, appeal

**IMPORTANT**: You MUST select the best available image, even if none are perfect.
Choose the image that best showcases the gemstone, preferring images:
- WITHOUT measurement instruments, scales, or tools in frame
- With the gemstone as the main focus (single stone preferred)
- With better lighting and clarity
- With cleaner backgrounds
- That display the gemstone's color and cut most clearly

Only return -1 if ALL images are completely unusable (corrupted, blank, or don't show a gemstone at all).
Otherwise, select the BEST of what's available.`;

  const userPrompt = `Please analyze these ${
    images.length
  } gemstone images and select the best one for the primary product image.

Gemstone: ${gemstoneInfo.weight_carats || "N/A"}ct ${
    gemstoneInfo.color || ""
  } ${gemstoneInfo.name || "gemstone"}
Cut: ${gemstoneInfo.cut || "N/A"}

Score each image on quality, composition, clarity, and professional presentation.
Select the best image as primary and explain your choice.`;

  try {
    const content = [
      {
        type: "text",
        text: userPrompt,
      },
    ];

    // Add all images with labels (base64 encoded)
    for (let i = 0; i < images.length; i++) {
      content.push({
        type: "text",
        text: `\n--- Image ${i} ---`,
      });
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/webp;base64,${images[i]}`,
          detail: "high",
        },
      });
    }

    const response = await withTimeout(
      openai.chat.completions.create({
        model: VISION_MODEL,
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "PrimaryImageSelection",
            schema: PRIMARY_IMAGE_SELECTION_SCHEMA,
            strict: true,
          },
        },
      }),
      TIMEOUT_MS.IMAGE_ANALYSIS || 30000
    );

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      ...result,
      images_analyzed: images.length,
      model: VISION_MODEL,
    };
  } catch (error) {
    console.error("Primary image selection failed:", error);
    throw new Error(`Primary image selection failed: ${error.message}`);
  }
}

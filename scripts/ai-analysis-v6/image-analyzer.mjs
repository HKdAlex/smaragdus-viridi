/**
 * Image Analysis for Gemstones
 * Detects cut type and selects best primary image using GPT-4 Vision
 */

import {
  DEFAULT_IMAGE_QUALITY,
  DEFAULT_TEMPERATURE,
  TIMEOUT_MS,
  withTimeout,
} from "./config.mjs";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use environment variable or fallback to GPT-4o-mini for image analysis
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

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
      minimum: 0,
      description:
        "Index of the best image to use as primary (0-based). MUST be 0 or greater - never return -1. Always select the best available image, even with measurement tools.",
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
 * Schema for color detection response
 */
const COLOR_DETECTION_SCHEMA = {
  type: "object",
  properties: {
    detected_color: {
      type: "string",
      description:
        "Primary color detected from the images (e.g., red, pink, orange, yellow, green, blue, purple, brown, black, white, gray, colorless, smoky, amber, violet, teal, coral, peach, mint)",
    },
    confidence: {
      type: "number",
      description: "Confidence score from 0 to 1",
    },
    color_description: {
      type: "string",
      description:
        "Detailed color description (e.g., smoky brown with amber undertones, light pink with subtle peach tones)",
    },
    matches_metadata: {
      type: "boolean",
      description: "Whether the detected color matches the provided metadata",
    },
    metadata_color: {
      type: "string",
      description: "The color from metadata for comparison",
    },
    reasoning: {
      type: "string",
      description: "Brief explanation of why this color was detected",
    },
  },
  required: [
    "detected_color",
    "confidence",
    "color_description",
    "matches_metadata",
    "metadata_color",
    "reasoning",
  ],
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
  const {
    images,
    imageData = null,
    metadataCut,
    imageQuality = DEFAULT_IMAGE_QUALITY,
  } = options;

  if (!images || images.length === 0) {
    throw new Error("At least one image is required for cut detection");
  }

  // Analyze ALL images if 15 or fewer, otherwise sample 10 for cost efficiency
  const maxImages = images.length <= 15 ? images.length : Math.min(10, images.length);

  // Create mapping between shuffled indices and original indices
  const originalIndices = Array.from({ length: images.length }, (_, i) => i);
  const shuffledIndices = [...originalIndices].sort(() => 0.5 - Math.random());
  const selectedIndices = shuffledIndices.slice(0, maxImages);
  const imagesToAnalyze = selectedIndices.map((idx) => images[idx]);

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
          detail: imageQuality, // Configurable image quality
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
 * Detect gemstone color from images
 * @param {Object} options
 * @param {Array<string>} options.images - Array of base64 encoded images
 * @param {string} options.metadataColor - Color from metadata for validation
 * @returns {Promise<Object>} Detection results with confidence and validation
 */
export async function detectGemstoneColor(options) {
  const {
    images,
    imageData = null,
    metadataColor,
    imageQuality = DEFAULT_IMAGE_QUALITY,
  } = options;

  if (!images || images.length === 0) {
    throw new Error("At least one image is required for color detection");
  }

  // Analyze ALL images if 15 or fewer, otherwise sample 10 for cost efficiency
  const maxImages = images.length <= 15 ? images.length : Math.min(10, images.length);

  // Create mapping between shuffled indices and original indices
  const originalIndices = Array.from({ length: images.length }, (_, i) => i);
  const shuffledIndices = [...originalIndices].sort(() => 0.5 - Math.random());
  const selectedIndices = shuffledIndices.slice(0, maxImages);
  const imagesToAnalyze = selectedIndices.map((idx) => images[idx]);

  const systemPrompt = `You are an expert gemologist with extensive experience in identifying gemstone colors.
Your task is to analyze the provided gemstone images and determine the primary color with high accuracy.

Common gemstone colors include:
- Red, Pink, Orange, Yellow, Green, Blue, Purple
- Brown, Black, White, Gray, Colorless
- Smoky, Amber, Violet, Teal, Coral, Peach, Mint
- Multi-color (for stones with multiple distinct colors)

For colorless stones, look for:
- True colorless (clear, like water)
- Near colorless (very slight tints)
- Light tints (yellow, brown, gray)

For colored stones, identify the dominant hue and any secondary tones or undertones.
Provide a detailed description that captures the color's character and nuances.

Compare your detection with the metadata color provided and flag any discrepancies.`;

  const userPrompt = `Please analyze these gemstone image(s) and detect the primary color.

Metadata indicates the color is: "${metadataColor}"

Carefully examine:
1. The dominant color/hue of the gemstone
2. Any secondary tones or undertones
3. Saturation and intensity of the color
4. Whether the stone appears colorless or has distinct coloration
5. Any color zoning or variations within the stone

Provide your detection with confidence score and detailed color description.
Flag if your detection doesn't match the metadata color.`;

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
          detail: imageQuality, // Configurable image quality
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
            name: "GemColorDetection",
            schema: COLOR_DETECTION_SCHEMA,
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
    console.error("Color detection failed:", error);
    throw new Error(`Color detection failed: ${error.message}`);
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
  const {
    images,
    imageData = null, // Image metadata with UUIDs
    gemstoneInfo,
    imageQuality = DEFAULT_IMAGE_QUALITY,
  } = options;

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

**CRITICAL QUALITY STANDARDS**: You MUST select the best available image, even if none are perfect.
Choose the image that best showcases the gemstone, with STRICT preference for images:
- WITHOUT measurement instruments, scales, calipers, or tools in frame (major penalty for tools)
- With the gemstone as the main focus (single stone preferred)
- With better lighting and clarity
- With cleaner backgrounds
- That display the gemstone's color and cut most clearly

**SCORING PRIORITY (CRITICAL)**:
1. Images WITHOUT any measurement tools or gauges: START at 1.0 base score
2. Images WITH measurement tools/gauges/calipers/rulers: MAXIMUM score is 0.4 (heavy penalty)
3. The penalty for measurement tools is SEVERE - clean images should almost always win
4. Professional presentation, lighting, and composition are secondary factors
5. A mediocre clean image is better than a perfect image with tools

**TOOL PENALTY ENFORCEMENT**:
- Clean gemstone images (no tools): Score range 0.6-1.0
- Images with ANY measurement tools: Score range 0.0-0.4 (capped!)
- This ensures tool-free images are strongly preferred

**CRITICAL**: You MUST ALWAYS select an image (never return -1). If ALL images have tools, choose the one where the tool is least intrusive. Only return -1 if images are completely blank, corrupted, or don't contain a gemstone at all.

**SELECTION RULE**: STRONGLY prefer images without measurement tools. Clean presentation is the #1 priority.`;

  // Analyze ALL images if 15 or fewer, otherwise sample 10 for cost efficiency
  const maxImages = images.length <= 15 ? images.length : Math.min(10, images.length);

  // Create mapping using UUIDs if available, otherwise fall back to indices
  let selectedImageData, imagesToAnalyze;

  if (imageData && imageData.length === images.length) {
    // Use UUID-based mapping for reliable image selection
    const shuffledImageData = [...imageData].sort(() => 0.5 - Math.random());
    selectedImageData = shuffledImageData.slice(0, maxImages);
    imagesToAnalyze = selectedImageData.map((imgData) => {
      const originalIndex = imageData.findIndex((img) => img.id === imgData.id);
      return images[originalIndex];
    });
  } else {
    // Fallback to index-based mapping
    const originalIndices = Array.from({ length: images.length }, (_, i) => i);
    const shuffledIndices = [...originalIndices].sort(
      () => 0.5 - Math.random()
    );
    const selectedIndices = shuffledIndices.slice(0, maxImages);
    selectedImageData = selectedIndices.map((idx) => ({
      id: `img_${idx}`,
      index: idx,
    }));
    imagesToAnalyze = selectedIndices.map((idx) => images[idx]);
  }

  const userPrompt = `Please analyze these ${
    imagesToAnalyze.length
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
    for (let i = 0; i < imagesToAnalyze.length; i++) {
      content.push({
        type: "text",
        text: `\n--- Image ${i} ---`,
      });
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/webp;base64,${imagesToAnalyze[i]}`,
          detail: imageQuality, // Configurable image quality
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

    // Map the selected index back to the original image using UUID
    let originalSelectedIndex;
    let selectedImageInfo = null;

    if (imageData && imageData.length === images.length) {
      // Use UUID-based mapping
      selectedImageInfo = selectedImageData[result.selected_index];
      originalSelectedIndex = imageData.findIndex(
        (img) => img.id === selectedImageInfo.id
      );
    } else {
      // Fallback to index-based mapping
      const selectedIndices = Array.from({ length: images.length }, (_, i) => i)
        .sort(() => 0.5 - Math.random())
        .slice(0, maxImages);
      originalSelectedIndex = selectedIndices[result.selected_index];
    }

    return {
      ...result,
      selected_index: originalSelectedIndex, // Return the original index, not shuffled
      selected_image_uuid:
        imageData && imageData.length === images.length
          ? selectedImageInfo?.id
          : null,
      images_analyzed: imagesToAnalyze.length,
      model: VISION_MODEL,
    };
  } catch (error) {
    console.error("Primary image selection failed:", error);
    throw new Error(`Primary image selection failed: ${error.message}`);
  }
}

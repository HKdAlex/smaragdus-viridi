import { DEFAULT_CLASSIFIER_MODEL, withTimeout } from "./config.mjs";

import OpenAI from "openai";

const CLASSIFIER_PROMPT = `You are a gemstone image classifier. Classify the image into one of four categories and provide a confidence score.

Categories:
1. instrument - Digital gauges, micrometers, calipers, dial indicators, scales that measure gemstones
2. label - Packaging labels, handwritten notes, invoice slips, bag tags showing text (often Cyrillic)
3. gem_macro - Close-up photos of gemstones, jewelry, or multiple stones without instruments
4. unknown - Poor quality or unrecognizable images

Rules:
- Output JSON only.
- If multiple items appear, choose the best matching category.
- Confidence must be between 0 and 1.
- Always include a short reason.
`;

const CLASSIFIER_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "GemImageClassification",
  type: "object",
  required: ["image_id", "image_type", "confidence", "reason"],
  properties: {
    image_id: { type: "string" },
    image_type: { enum: ["instrument", "label", "gem_macro", "unknown"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reason: { type: "string" },
  },
  additionalProperties: false,
};

function extractJsonFromMessage(message) {
  if (!message) return null;
  if (Array.isArray(message.content)) {
    const jsonPart = message.content
      .map((part) => part?.text || part?.["text"] || "")
      .join("")
      .trim();
    if (jsonPart) {
      try {
        return JSON.parse(jsonPart);
      } catch (error) {
        console.error("Failed to parse classifier JSON:", error);
        return null;
      }
    }
    const first = message.content.find((part) => part?.json);
    if (first?.json) return first.json;
    return null;
  }
  if (typeof message.content === "string") {
    try {
      return JSON.parse(message.content);
    } catch (error) {
      console.error("Failed to parse classifier JSON string:", error);
      return null;
    }
  }
  return null;
}

function resolveImageUrl(image) {
  if (image.base64 && image.base64.startsWith("data:")) {
    return image.base64;
  }
  if (image.url) {
    return image.url;
  }
  throw new Error(`Image ${image.id} is missing both base64 and url sources`);
}

export async function classifyImage(image, openaiClient) {
  const openai =
    openaiClient instanceof OpenAI
      ? openaiClient
      : new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

  const completion = await withTimeout(
    openai.chat.completions.create({
      model: DEFAULT_CLASSIFIER_MODEL,
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "GemImageClassification",
          schema: CLASSIFIER_SCHEMA,
          strict: true,
        },
      },
      messages: [
        {
          role: "system",
          content: CLASSIFIER_PROMPT,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `image_id=${image.id}` },
            { type: "image_url", image_url: { url: resolveImageUrl(image) } },
          ],
        },
      ],
      max_tokens: 300,
    })
  );

  const message = completion.choices?.[0]?.message;
  const output = extractJsonFromMessage(message);

  if (!output) {
    throw new Error("Classifier did not return JSON output");
  }

  return {
    image_id: image.id,
    image_type: output.image_type,
    confidence: output.confidence,
    reason: output.reason,
  };
}

export function isInstrumentClassification(classification) {
  return classification.image_type === "instrument";
}

export function isLabelClassification(classification) {
  return classification.image_type === "label";
}

export function isGemMacroClassification(classification) {
  return classification.image_type === "gem_macro";
}

export const CLASSIFICATION_SCHEMA = CLASSIFIER_SCHEMA;

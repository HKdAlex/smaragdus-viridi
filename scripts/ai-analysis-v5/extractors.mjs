import { DEFAULT_EXTRACTOR_MODEL, withTimeout } from "./config.mjs";

import OpenAI from "openai";
import { PER_IMAGE_SCHEMA } from "./schemas.mjs";

const BASE_SYSTEM_PROMPT = `You are a gemstone analysis expert. Extract structured claims from a single image.
- Respond with JSON matching the schema.
- Never hallucinate values. If unsure, omit the claim.
- Confidence must reflect visual certainty (0-1).
- Provide provenance for each claim.
`;

const instrumentPrompt = `${BASE_SYSTEM_PROMPT}
Image category: instrument.

Instructions:
- Perform strict OCR on LCD/analog gauges.
- Capture digits, decimal point, and units.
- Determine orientation: if calipers clamp gemstone thickness → dimension_mm_height.
- If reading appears to represent max length/width, set dimension_mm_max or dimension_mm_min.
- Capture instrument range if visible (e.g., 0-20 mm).
- Set instrument_readout_mm when reading is ambiguous.
`;

const labelPrompt = `${BASE_SYSTEM_PROMPT}
Image category: label.

Instructions:
- OCR text (handle Cyrillic, commas as decimals).
- Extract weight in carats when present.
- Parse dimension pairs (e.g., 4,56 / 4,67) → dimension_mm_min/dimension_mm_max.
- Detect cut keywords (e.g., "ашер" → cut_shape="asscher").
- Include label_text claim with cleaned content.
`;

const macroPrompt = `${BASE_SYSTEM_PROMPT}
Image category: gem_macro.

Instructions:
- Assess cut shape (e.g., asscher_step, cushion, round).
- Determine cut style when possible.
- Classify color family (keep coarse categories: yellow, green, pink, etc.).
- Estimate clarity (eye_clean, lightly_included, included).
- Note notable features in "notes" claim.
`;

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
        console.error("Failed to parse extractor JSON:", error);
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
      console.error("Failed to parse extractor JSON string:", error);
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

async function callExtractor(image, prompt, overrides = {}) {
  const openai =
    overrides.openai instanceof OpenAI
      ? overrides.openai
      : new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

  const completion = await withTimeout(
    openai.chat.completions.create({
      model: overrides.model || DEFAULT_EXTRACTOR_MODEL,
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "GemImageExtraction",
          schema: PER_IMAGE_SCHEMA,
          strict: true,
        },
      },
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: [
            { type: "text", text: `image_id=${image.id}` },
            { type: "image_url", image_url: { url: resolveImageUrl(image) } },
          ],
        },
      ],
      max_tokens: 800,
    })
  );

  const json = extractJsonFromMessage(completion.choices?.[0]?.message);

  if (!json) {
    throw new Error("Extractor did not return JSON output");
  }

  json.image_id = image.id;
  return json;
}

export function buildImagePayload(image) {
  return {
    id: image.id,
    url: image.image_url || image.url,
  };
}

export async function extractFromInstrument(image, overrides = {}) {
  return callExtractor(buildImagePayload(image), instrumentPrompt, overrides);
}

export async function extractFromLabel(image, overrides = {}) {
  return callExtractor(buildImagePayload(image), labelPrompt, overrides);
}

export async function extractFromGemMacro(image, overrides = {}) {
  return callExtractor(buildImagePayload(image), macroPrompt, overrides);
}

export function normalizeClaims(extraction) {
  const claims = Array.isArray(extraction.claims) ? extraction.claims : [];
  return {
    ...extraction,
    claims: claims.filter((claim) => claim && claim.field && claim.provenance),
  };
}

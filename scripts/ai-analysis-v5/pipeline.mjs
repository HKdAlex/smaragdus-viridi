import {
  markGemstoneAnalyzed,
  saveFusedResult,
  savePerImageExtractions,
} from "./database.mjs";
import {
  extractFromGemMacro,
  extractFromInstrument,
  extractFromLabel,
  normalizeClaims,
} from "./extractors.mjs";

import OpenAI from "openai";
import { downloadImageAsBase64 } from "../ai-analysis/image-utils.mjs";
import { classifyImage } from "./classifier.mjs";
import { fuseClaims } from "./fusion.mjs";

function ensureOpenAI(client) {
  if (client instanceof OpenAI) {
    return client;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY must be set for AI Analysis v5");
  }
  return new OpenAI({ apiKey });
}

export async function analyzeGemstoneV5({
  gemstoneId,
  images,
  supabase,
  openai,
}) {
  if (!gemstoneId) throw new Error("gemstoneId is required");
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("images array must contain at least one image");
  }

  const client = ensureOpenAI(openai);

  const preparedImages = [];
  for (const image of images) {
    let base64 = image.base64;
    if (!base64) {
      try {
        base64 = await downloadImageAsBase64(image.image_url || image.url);
      } catch (error) {
        console.error(
          `❌ Failed to download image ${image.id} for AI v5 pipeline:`,
          error.message
        );
        throw error;
      }
    }
    preparedImages.push({ ...image, base64 });
  }

  const classified = [];
  for (const image of preparedImages) {
    try {
      const classification = await classifyImage(
        {
          id: image.id,
          url: image.image_url || image.url,
          base64: image.base64,
        },
        client
      );

      classified.push({ ...image, classification });
    } catch (error) {
      console.error(
        `❌ Classification failed for image ${image.id}:`,
        error.message
      );
      throw error;
    }
  }

  const extractions = [];
  for (const entry of classified) {
    const { classification } = entry;
    try {
      if (classification.image_type === "instrument") {
        extractions.push(
          normalizeClaims(
            await extractFromInstrument(entry, { openai: client })
          )
        );
        continue;
      }
      if (classification.image_type === "label") {
        extractions.push(
          normalizeClaims(await extractFromLabel(entry, { openai: client }))
        );
        continue;
      }
      if (classification.image_type === "gem_macro") {
        extractions.push(
          normalizeClaims(await extractFromGemMacro(entry, { openai: client }))
        );
        continue;
      }

      extractions.push(
        normalizeClaims({
          image_id: entry.id,
          image_type: "unknown",
          claims: [],
        })
      );
    } catch (error) {
      console.error(
        `❌ Extraction failed for image ${entry.id}:`,
        error.message
      );
      throw error;
    }
  }

  await savePerImageExtractions(supabase, gemstoneId, extractions);

  const fused = fuseClaims(extractions);

  await saveFusedResult(supabase, gemstoneId, fused, images);
  await markGemstoneAnalyzed(supabase, gemstoneId);

  return {
    classifications: classified.map((entry) => entry.classification),
    extractions,
    fused,
  };
}

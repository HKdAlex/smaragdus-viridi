/**
 * AI Analysis v5 Configuration
 */

export const DEFAULT_CLASSIFIER_MODEL =
  process.env.OPENAI_V5_CLASSIFIER_MODEL || "gpt-4o";
export const DEFAULT_EXTRACTOR_MODEL =
  process.env.OPENAI_V5_EXTRACTOR_MODEL || "gpt-4o";

export const OPENAI_TIMEOUT_MS = Number.parseInt(
  process.env.OPENAI_V5_TIMEOUT_MS || "90000",
  10
);

export const DIMENSION_TOLERANCE_MM = Number.parseFloat(
  process.env.AI_V5_DIMENSION_TOLERANCE_MM || "0.25"
);
export const DIMENSION_REVIEW_THRESHOLD_MM = Number.parseFloat(
  process.env.AI_V5_DIMENSION_REVIEW_THRESHOLD_MM || "0.12"
);
export const WEIGHT_TOLERANCE_CT = Number.parseFloat(
  process.env.AI_V5_WEIGHT_TOLERANCE_CT || "0.02"
);

export const MIN_CONFIDENCE_THRESHOLD = Number.parseFloat(
  process.env.AI_V5_MIN_CONFIDENCE_THRESHOLD || "0.6"
);

export function withTimeout(promise, timeoutMs = OPENAI_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new Error(`OpenAI request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}


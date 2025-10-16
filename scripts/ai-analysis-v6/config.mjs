/**
 * Configuration for AI Text Generation v6
 */

export const DEFAULT_MODEL = process.env.V6_TEXT_MODEL || "gpt-4o";
// Temperature for creative content generation
export const DEFAULT_TEMPERATURE = 1.0; // Creative, varied outputs
export const MAX_TOKENS_OUTPUT = 4000; // Sufficient for all text fields

export const TIMEOUT_MS = {
  IMAGE_DOWNLOAD: 5000, // 5 seconds per image
  TEXT_GENERATION: 180000, // 180 seconds (3 minutes) - sufficient for complex generation with images
  IMAGE_ANALYSIS: 60000, // 60 seconds for image analysis (cut detection, primary selection)
};

export const CONFIDENCE_THRESHOLDS = {
  AUTO_APPROVE: 0.8,
  NEEDS_REVIEW: 0.7,
};

/**
 * Wraps a promise with a timeout
 * @param {Promise} promise - The promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} Promise that rejects on timeout
 */
export function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

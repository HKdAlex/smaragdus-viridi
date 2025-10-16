/**
 * Configuration for AI Text Generation v6
 */

export const DEFAULT_MODEL = "gpt-4o";
export const DEFAULT_TEMPERATURE = 0.85; // Higher for creative content
export const MAX_TOKENS_OUTPUT = 4000; // Sufficient for all text fields

export const TIMEOUT_MS = {
  IMAGE_DOWNLOAD: 5000, // 5 seconds per image
  TEXT_GENERATION: 60000, // 60 seconds for full generation
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


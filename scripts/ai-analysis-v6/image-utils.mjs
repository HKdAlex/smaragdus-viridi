/**
 * Image utilities for v6 text generation
 * Handles downloading images with fallback gracefully
 */

import { TIMEOUT_MS, withTimeout } from "./config.mjs";

/**
 * Download images with fallback - returns empty array on any failure
 * @param {Array<string>} imageUrls - Array of image URLs
 * @returns {Promise<Array<string>>} Array of base64 encoded images (empty if failed)
 */
export async function downloadImagesWithFallback(imageUrls) {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    imageUrls.map((url) => downloadImageAsBase64(url))
  );

  const successfulImages = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value)
    .filter(Boolean);

  if (successfulImages.length < imageUrls.length) {
    console.warn(
      `⚠️  Downloaded ${successfulImages.length}/${imageUrls.length} images (some failed/timed out)`
    );
  }

  return successfulImages;
}

/**
 * Download a single image as base64
 * @param {string} url - Image URL
 * @returns {Promise<string|null>} Base64 encoded image or null
 */
async function downloadImageAsBase64(url) {
  try {
    const response = await withTimeout(fetch(url), TIMEOUT_MS.IMAGE_DOWNLOAD);

    if (!response.ok) {
      console.warn(`Failed to download image: ${response.statusText}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return base64;
  } catch (error) {
    console.warn(`Image download failed: ${error.message}`);
    return null;
  }
}


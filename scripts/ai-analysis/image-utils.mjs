/**
 * 🖼️ Image Processing Utilities for AI Analysis
 *
 * Handles image downloading, conversion, and temporary file management
 * for multi-image AI analysis workflows.
 *
 * @author Crystallique Team
 * @version 3.0.0
 * @date 2025-01-19
 */

import { fileURLToPath } from "url";
import fs from "fs/promises";
import fsSync from "fs";
import https from "https";
import path from "path";
import sharp from "sharp";

// Setup temp directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, "..", "..", "temp", "ai-analysis");

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.access(TEMP_DIR);
  } catch {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    console.log(`📁 Created temp directory: ${TEMP_DIR}`);
  }
}

/**
 * Download image with retry logic
 */
export async function downloadImageAsBase64(
  imageUrl,
  optimize = true,
  maxRetries = 3
) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // On last attempt, allow insecure TLS as fallback for CDN issues
      const allowInsecure = attempt === maxRetries;
      return await downloadImageAsBase64Internal(
        imageUrl,
        optimize,
        allowInsecure
      );
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = 500 * attempt; // 500ms, 1000ms exponential backoff
        console.log(
          `    ⚠️ Download attempt ${attempt} failed, retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Internal function - single download attempt
 */
function downloadImageAsBase64Internal(
  imageUrl,
  optimize = true,
  allowInsecure = false
) {
  return new Promise((resolve, reject) => {
    const url = new URL(imageUrl);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "GET",
      rejectUnauthorized: !allowInsecure, // Allow insecure on last attempt
      timeout: 30000, // 30 second timeout
      headers: {
        "User-Agent": "Smaragdus-Viridi-AI-Analysis/3.1",
      },
    };

    https
      .get(options, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download image: HTTP ${response.statusCode}`)
          );
          return;
        }

        const chunks = [];

        response.on("data", (chunk) => {
          chunks.push(chunk);
        });

        response.on("end", async () => {
          try {
            let buffer = Buffer.concat(chunks);

            if (optimize) {
              buffer = await optimizeImageForAI(buffer);
            }

            // Determine MIME type from URL or default to JPEG
            const mimeType = imageUrl.toLowerCase().includes(".png")
              ? "image/png"
              : "image/jpeg";
            const base64String = buffer.toString("base64");
            const dataUrl = `data:${mimeType};base64,${base64String}`;

            resolve(dataUrl);
          } catch (error) {
            reject(
              new Error(`Failed to convert image to base64: ${error.message}`)
            );
          }
        });

        response.on("error", (error) => {
          reject(error);
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

export async function optimizeImageForAI(
  imageBuffer,
  maxDimension = 640, // Reduced from 1536 for cost savings
  quality = 75 // Reduced from 82 for smaller files
) {
  try {
    const optimized = await sharp(imageBuffer)
      .rotate()
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality })
      .toBuffer();

    const originalSize = (imageBuffer.length / 1024).toFixed(2);
    const optimizedSize = (optimized.length / 1024).toFixed(2);
    const savings = ((1 - optimized.length / imageBuffer.length) * 100).toFixed(
      1
    );

    console.log(
      `    📉 Optimized: ${originalSize}KB → ${optimizedSize}KB (${savings}% reduction)`
    );

    return optimized;
  } catch (error) {
    console.warn(
      `    ⚠️ Optimization failed, using original buffer: ${error.message}`
    );
    return imageBuffer;
  }
}

/**
 * Download image to temporary file (for legacy compatibility)
 */
export async function downloadImageToTemp(imageUrl, filename) {
  await ensureTempDir();

  const tempFilePath = path.join(TEMP_DIR, filename);

  return new Promise((resolve, reject) => {
    const file = fsSync.createWriteStream(tempFilePath);

    https
      .get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download image: HTTP ${response.statusCode}`)
          );
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          resolve(tempFilePath);
        });

        file.on("error", (error) => {
          fs.unlink(tempFilePath).catch(() => {}); // Clean up on error
          reject(error);
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

/**
 * Convert local image file to base64
 */
export async function imageFileToBase64(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64String = imageBuffer.toString("base64");
    const mimeType =
      path.extname(imagePath).toLowerCase() === ".png"
        ? "image/png"
        : "image/jpeg";
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    throw new Error(`Failed to convert image to base64: ${error.message}`);
  }
}

/**
 * Clean up temporary files
 */
export async function cleanupTempFiles(filePaths) {
  const cleanupPromises = filePaths.map(async (filePath) => {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore errors for files that don't exist
      if (error.code !== "ENOENT") {
        console.warn(
          `⚠️ Failed to cleanup temp file ${filePath}: ${error.message}`
        );
      }
    }
  });

  await Promise.all(cleanupPromises);
}

/**
 * Clean up entire temp directory
 */
export async function cleanupTempDirectory() {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const fullPaths = files.map((file) => path.join(TEMP_DIR, file));
    await cleanupTempFiles(fullPaths);
    console.log(`🧹 Cleaned up ${files.length} temporary files`);
  } catch (error) {
    console.warn(`⚠️ Failed to cleanup temp directory: ${error.message}`);
  }
}

/**
 * Validate image URL accessibility
 */
export async function validateImageUrl(imageUrl) {
  return new Promise((resolve) => {
    https
      .get(imageUrl, (response) => {
        resolve({
          accessible: response.statusCode === 200,
          statusCode: response.statusCode,
          contentType: response.headers["content-type"] || "unknown",
          contentLength: parseInt(response.headers["content-length"] || "0"),
        });
        response.resume(); // Consume response to free up connection
      })
      .on("error", () => {
        resolve({
          accessible: false,
          statusCode: 0,
          contentType: "unknown",
          contentLength: 0,
        });
      });
  });
}

/**
 * Batch validate multiple image URLs
 */
export async function validateImageUrls(imageUrls) {
  console.log(`🔍 Validating ${imageUrls.length} image URLs...`);

  const validationPromises = imageUrls.map(async (url, index) => {
    const result = await validateImageUrl(url);
    return {
      index,
      url,
      ...result,
    };
  });

  const results = await Promise.all(validationPromises);

  const summary = {
    total: results.length,
    accessible: results.filter((r) => r.accessible).length,
    failed: results.filter((r) => !r.accessible).length,
    totalSize: results.reduce((sum, r) => sum + r.contentLength, 0),
  };

  console.log(
    `✅ Validation complete: ${summary.accessible}/${
      summary.total
    } accessible, ${(summary.totalSize / 1024 / 1024).toFixed(2)}MB total`
  );

  return {
    summary,
    results,
  };
}

/**
 * Get optimal image batch size based on total size
 */
export function getOptimalBatchSize(images, maxBatchSizeMB = 20) {
  // Estimate average image size if not available
  const avgImageSizeMB = 2; // Conservative estimate
  const maxImagesPerBatch = Math.floor(maxBatchSizeMB / avgImageSizeMB);

  // Never exceed 10 images per batch (API limitations)
  return Math.min(maxImagesPerBatch, 10, images.length);
}

/**
 * Create batches of images for processing
 */
export function createImageBatches(images, batchSize) {
  const batches = [];
  for (let i = 0; i < images.length; i += batchSize) {
    batches.push(images.slice(i, i + batchSize));
  }
  return batches;
}

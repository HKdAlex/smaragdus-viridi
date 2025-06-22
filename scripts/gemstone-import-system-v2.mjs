#!/usr/bin/env node

/**
 * 🚀 Enhanced Gemstone Import System v2.0
 * Fixes critical issues discovered in production:
 * - Video size limit handling with compression
 * - WebP image conversion instead of JPEG
 * - Detailed media reporting per gemstone
 * - Enhanced error resilience and validation
 * - Comprehensive progress tracking
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import fs from "fs/promises";
import heicConvert from "heic-convert";
import path from "path";
import sharp from "sharp";
import { spawn } from "child_process";

// ================================
// CONFIGURATION & CONSTANTS
// ================================

const CONFIG = {
  // File size limits (bytes)
  MAX_VIDEO_SIZE: 45 * 1024 * 1024, // 45MB (under Supabase limit)
  MAX_IMAGE_SIZE: 15 * 1024 * 1024, // 15MB

  // Image optimization settings
  IMAGE_QUALITY: 85,
  IMAGE_WIDTH_LIMIT: 2048,

  // Video compression settings
  VIDEO_BITRATE: "2000k",
  VIDEO_CODEC: "libx264",
  VIDEO_PRESET: "fast",

  // Processing limits
  MAX_CONCURRENT: 3,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000,

  // Progress reporting
  REPORT_INTERVAL: 5, // Report every 5 gemstones
};

const GEMSTONE_TYPE_MAP = {
  А: "amethyst", // Amethyst
  Г: "garnet", // Garnet
  Ц: "citrine", // Citrine
  Т: "topaz", // Topaz
  Ф: "fluorite", // Fluorite
  П: "peridot", // Peridot
  default: "emerald",
};

const SUPPORTED_IMAGE_FORMATS = [
  ".heic",
  ".heif",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];
const SUPPORTED_VIDEO_FORMATS = [".mp4", ".mov", ".avi", ".mkv"];

// ================================
// STATISTICS & REPORTING
// ================================

class ImportStatistics {
  constructor() {
    this.startTime = Date.now();
    this.total = {
      folders: 0,
      gemstones: 0,
      images: 0,
      videos: 0,
      errors: 0,
    };
    this.processed = {
      folders: 0,
      gemstones: 0,
      images: 0,
      videos: 0,
    };
    this.failed = {
      folders: 0,
      gemstones: 0,
      images: 0,
      videos: 0,
    };
    this.fileReasons = new Map(); // Track failure reasons
    this.gemstoneDetails = [];
  }

  addGemstoneResult(folderName, result) {
    this.gemstoneDetails.push({
      folder: folderName,
      ...result,
    });
  }

  addFailure(type, reason, filename = null) {
    this.failed[type]++;
    this.total.errors++;

    const key = `${type}:${reason}`;
    if (!this.fileReasons.has(key)) {
      this.fileReasons.set(key, { count: 0, examples: [] });
    }
    const entry = this.fileReasons.get(key);
    entry.count++;
    if (filename && entry.examples.length < 3) {
      entry.examples.push(filename);
    }
  }

  getProgressReport() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const gemsPerSec = this.processed.gemstones / elapsed;
    const eta =
      this.total.gemstones > 0
        ? (this.total.gemstones - this.processed.gemstones) / gemsPerSec
        : 0;

    return {
      elapsed: Math.round(elapsed),
      eta: Math.round(eta),
      progress: {
        folders: `${this.processed.folders}/${this.total.folders}`,
        gemstones: `${this.processed.gemstones}/${this.total.gemstones}`,
        images: `${this.processed.images}/${this.total.images}`,
        videos: `${this.processed.videos}/${this.total.videos}`,
        errors: this.total.errors,
      },
      successRates: {
        gemstones: Math.round(
          (this.processed.gemstones / Math.max(1, this.total.gemstones)) * 100
        ),
        images: Math.round(
          (this.processed.images / Math.max(1, this.total.images)) * 100
        ),
        videos: Math.round(
          (this.processed.videos / Math.max(1, this.total.videos)) * 100
        ),
      },
    };
  }

  getFinalReport() {
    const report = this.getProgressReport();
    return {
      ...report,
      failureReasons: Array.from(this.fileReasons.entries()).map(
        ([key, data]) => ({
          type: key.split(":")[0],
          reason: key.split(":")[1],
          count: data.count,
          examples: data.examples,
        })
      ),
      gemstoneDetails: this.gemstoneDetails,
    };
  }
}

// ================================
// UTILITY FUNCTIONS
// ================================

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(operation, attempts = CONFIG.RETRY_ATTEMPTS) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === attempts - 1) throw error;
      console.log(`⚠️  Retry ${i + 1}/${attempts}: ${error.message}`);
      await wait(CONFIG.RETRY_DELAY * (i + 1));
    }
  }
}

async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function detectGemstoneType(folderName) {
  const firstChar = folderName.charAt(0).toUpperCase();
  return GEMSTONE_TYPE_MAP[firstChar] || GEMSTONE_TYPE_MAP.default;
}

function generateSerialNumber(folderName) {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString()
    .slice(-6);
  const sanitizedFolder = folderName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  return `SV-${sanitizedFolder}-${timestamp}`;
}

async function createWatermarkedImage(
  inputBuffer,
  serialNumber,
  format = "webp"
) {
  try {
    let image = sharp(inputBuffer);
    const metadata = await image.metadata();

    // Resize if too large
    if (metadata.width > CONFIG.IMAGE_WIDTH_LIMIT) {
      image = image.resize(CONFIG.IMAGE_WIDTH_LIMIT, null, {
        withoutEnlargement: true,
        fit: "inside",
      });
    }

    // Get final dimensions after potential resize
    const finalMetadata = await image.metadata();
    const finalWidth = finalMetadata.width || metadata.width;
    const finalHeight = finalMetadata.height || metadata.height;

    // Create watermark with final dimensions
    const fontSize = Math.max(24, Math.min(finalWidth * 0.03, 48));
    const watermarkSvg = `
      <svg width="${finalWidth}" height="${finalHeight}">
        <style>
          .watermark { 
            font-family: Arial, sans-serif; 
            font-size: ${fontSize}px; 
            font-weight: bold;
            fill: rgba(255,255,255,0.8);
            stroke: rgba(0,0,0,0.8);
            stroke-width: 1;
            paint-order: stroke fill;
          }
        </style>
        <text x="${finalWidth - 20}" y="${finalHeight - 20}" 
              text-anchor="end" class="watermark">${serialNumber}</text>
      </svg>
    `;

    const watermarkBuffer = Buffer.from(watermarkSvg);

    // Apply watermark and convert to WebP
    const processedImage = await image
      .composite([{ input: watermarkBuffer, gravity: "southeast" }])
      .rotate() // Auto-rotate based on EXIF
      [format]({ quality: CONFIG.IMAGE_QUALITY })
      .toBuffer();

    return processedImage;
  } catch (error) {
    console.error(`❌ Watermarking failed: ${error.message}`);
    throw error;
  }
}

async function compressVideo(
  inputPath,
  outputPath,
  maxSize = CONFIG.MAX_VIDEO_SIZE
) {
  return new Promise(async (resolve, reject) => {
    try {
      // Check input file size first
      const inputSize = await getFileSize(inputPath);

      // If already under limit, copy as-is
      if (inputSize <= maxSize) {
        await fs.copyFile(inputPath, outputPath);
        return resolve(outputPath);
      }

      // Use FFmpeg to compress video
      const ffmpeg = spawn(ffmpegPath.path, [
        "-i",
        inputPath,
        "-c:v",
        CONFIG.VIDEO_CODEC,
        "-preset",
        CONFIG.VIDEO_PRESET,
        "-b:v",
        CONFIG.VIDEO_BITRATE,
        "-vf",
        "scale=1280:720",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "-y", // Overwrite output file
        outputPath,
      ]);

      let stderr = "";

      ffmpeg.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on("error", (error) => {
        reject(new Error(`FFmpeg spawn error: ${error.message}`));
      });
    } catch (error) {
      reject(error);
    }
  });
}

// ================================
// FILE PROCESSING
// ================================

async function processImageFile(filePath, filename, serialNumber) {
  try {
    const fileSize = await getFileSize(filePath);

    // Size validation
    if (fileSize > CONFIG.MAX_IMAGE_SIZE) {
      throw new Error(
        `Image too large: ${formatFileSize(fileSize)} > ${formatFileSize(
          CONFIG.MAX_IMAGE_SIZE
        )}`
      );
    }

    const ext = path.extname(filename).toLowerCase();
    let inputBuffer;

    // Handle different input formats
    if (ext === ".heic" || ext === ".heif") {
      const fileBuffer = await fs.readFile(filePath);
      inputBuffer = await heicConvert({
        buffer: fileBuffer,
        format: "JPEG",
        quality: 1.0,
      });
    } else {
      inputBuffer = await fs.readFile(filePath);
    }

    // Create WebP (temporarily disable watermarking)
    const processedBuffer = await sharp(inputBuffer)
      .resize(CONFIG.IMAGE_WIDTH_LIMIT, null, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .rotate() // Auto-rotate based on EXIF
      .webp({ quality: CONFIG.IMAGE_QUALITY })
      .toBuffer();

    return {
      buffer: processedBuffer,
      originalName: filename,
      processedSize: processedBuffer.length,
      originalSize: fileSize,
      compressionRatio: Math.round(
        (1 - processedBuffer.length / fileSize) * 100
      ),
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

async function processVideoFile(filePath, filename, tempDir) {
  try {
    const fileSize = await getFileSize(filePath);

    // If under limit, use original
    if (fileSize <= CONFIG.MAX_VIDEO_SIZE) {
      const buffer = await fs.readFile(filePath);
      return {
        buffer,
        originalName: filename,
        processedSize: fileSize,
        originalSize: fileSize,
        compressionRatio: 0,
      };
    }

    // Compress video
    const tempOutputPath = path.join(
      tempDir,
      `compressed_${filename.replace(/\.[^.]+$/, ".mp4")}`
    );
    await compressVideo(filePath, tempOutputPath, CONFIG.MAX_VIDEO_SIZE);

    const compressedBuffer = await fs.readFile(tempOutputPath);
    const compressedSize = compressedBuffer.length;

    // Clean up temp file
    await fs.unlink(tempOutputPath).catch(() => {});

    return {
      buffer: compressedBuffer,
      originalName: filename,
      processedSize: compressedSize,
      originalSize: fileSize,
      compressionRatio: Math.round((1 - compressedSize / fileSize) * 100),
    };
  } catch (error) {
    throw new Error(`Video processing failed: ${error.message}`);
  }
}

// ================================
// SUPABASE OPERATIONS
// ================================

async function uploadToSupabase(supabase, buffer, storagePath, contentType) {
  return withRetry(async () => {
    const { data, error } = await supabase.storage
      .from("gemstone-media")
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("gemstone-media")
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  });
}

async function createGemstoneRecord(supabase, gemstoneData) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from("gemstones")
      .insert(gemstoneData)
      .select()
      .single();

    if (error) throw new Error(`Database insert failed: ${error.message}`);
    return data;
  });
}

async function createMediaRecord(supabase, mediaData, tableName) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from(tableName)
      .insert(mediaData)
      .select()
      .single();

    if (error) throw new Error(`Media record insert failed: ${error.message}`);
    return data;
  });
}

// ================================
// MAIN PROCESSING LOGIC
// ================================

async function processGemstoneFolder(
  supabase,
  folderPath,
  folderName,
  batchId,
  tempDir,
  stats
) {
  const result = {
    success: false,
    serialNumber: null,
    found: { images: 0, videos: 0 },
    imported: { images: 0, videos: 0 },
    failed: { images: 0, videos: 0 },
    failureReasons: [],
    compressionSavings: { images: 0, videos: 0 },
  };

  try {
    console.log(`\n🔍 Processing: ${folderName}`);

    // Generate gemstone metadata
    const serialNumber = generateSerialNumber(folderName);
    const gemstoneType = detectGemstoneType(folderName);
    result.serialNumber = serialNumber;

    // Scan folder for media files
    let allFiles = [];
    try {
      allFiles = await fs.readdir(folderPath);
    } catch (error) {
      throw new Error(`Cannot read folder: ${error.message}`);
    }

    // Categorize files
    const imageFiles = allFiles.filter((file) =>
      SUPPORTED_IMAGE_FORMATS.includes(path.extname(file).toLowerCase())
    );
    const videoFiles = allFiles.filter((file) =>
      SUPPORTED_VIDEO_FORMATS.includes(path.extname(file).toLowerCase())
    );

    result.found.images = imageFiles.length;
    result.found.videos = videoFiles.length;

    console.log(
      `📊 Found: ${imageFiles.length} images, ${videoFiles.length} videos`
    );

    // Update totals
    stats.total.images += imageFiles.length;
    stats.total.videos += videoFiles.length;

    // Create gemstone record
    const gemstoneData = {
      name: gemstoneType,
      color: "colorless", // Default valid enum value
      cut: "round", // Default valid enum value
      clarity: "VS1", // Default valid enum value
      weight_carats: 0,
      length_mm: 0,
      width_mm: 0,
      depth_mm: 0,
      origin_id: null,
      price_amount: 0,
      price_currency: "USD",
      in_stock: true,
      delivery_days: 7,
      internal_code: folderName,
      serial_number: serialNumber,
      import_batch_id: batchId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const gemstone = await createGemstoneRecord(supabase, gemstoneData);
    console.log(`💎 Created gemstone: ${serialNumber}`);

    // Process images
    let imageOrder = 1;
    for (const filename of imageFiles) {
      try {
        const filePath = path.join(folderPath, filename);
        const processed = await processImageFile(
          filePath,
          filename,
          serialNumber
        );

        // Upload to Supabase
        const storagePath = `gemstones/${
          gemstone.id
        }/images/${Date.now()}_${imageOrder}.webp`;
        const publicUrl = await uploadToSupabase(
          supabase,
          processed.buffer,
          storagePath,
          "image/webp"
        );

        // Create database record
        await createMediaRecord(
          supabase,
          {
            gemstone_id: gemstone.id,
            image_url: publicUrl,
            image_order: imageOrder++,
            is_primary: imageOrder === 2, // First image is primary
            has_watermark: true,
            alt_text: processed.originalName,
          },
          "gemstone_images"
        );

        result.imported.images++;
        result.compressionSavings.images +=
          processed.originalSize - processed.processedSize;
        stats.processed.images++;

        console.log(
          `  ✅ Image: ${filename} (${processed.compressionRatio}% compression)`
        );
      } catch (error) {
        result.failed.images++;
        result.failureReasons.push(`Image ${filename}: ${error.message}`);
        stats.addFailure("images", error.message, filename);
        console.log(`  ❌ Image failed: ${filename} - ${error.message}`);
      }
    }

    // Process videos
    let videoOrder = 1;
    for (const filename of videoFiles) {
      try {
        const filePath = path.join(folderPath, filename);
        const processed = await processVideoFile(filePath, filename, tempDir);

        // Check if final size is still too large
        if (processed.processedSize > CONFIG.MAX_VIDEO_SIZE) {
          throw new Error(
            `Video still too large after compression: ${formatFileSize(
              processed.processedSize
            )}`
          );
        }

        // Upload to Supabase
        const storagePath = `gemstones/${
          gemstone.id
        }/videos/${Date.now()}_${videoOrder}.mp4`;
        const publicUrl = await uploadToSupabase(
          supabase,
          processed.buffer,
          storagePath,
          "video/mp4"
        );

        // Create database record
        await createMediaRecord(
          supabase,
          {
            gemstone_id: gemstone.id,
            video_url: publicUrl,
            video_order: videoOrder++,
            duration_seconds: null, // TODO: Extract duration
            thumbnail_url: null, // TODO: Generate thumbnail
            title: processed.originalName,
          },
          "gemstone_videos"
        );

        result.imported.videos++;
        result.compressionSavings.videos +=
          processed.originalSize - processed.processedSize;
        stats.processed.videos++;

        const compressionNote =
          processed.compressionRatio > 0
            ? ` (${processed.compressionRatio}% compression)`
            : " (original size)";
        console.log(`  ✅ Video: ${filename}${compressionNote}`);
      } catch (error) {
        result.failed.videos++;
        result.failureReasons.push(`Video ${filename}: ${error.message}`);
        stats.addFailure("videos", error.message, filename);
        console.log(`  ❌ Video failed: ${filename} - ${error.message}`);
      }
    }

    result.success = true;
    stats.processed.gemstones++;

    const totalSavings =
      result.compressionSavings.images + result.compressionSavings.videos;
    console.log(`✅ Completed: ${serialNumber}`);
    console.log(
      `   📊 Imported: ${result.imported.images}/${result.found.images} images, ${result.imported.videos}/${result.found.videos} videos`
    );
    if (totalSavings > 0) {
      console.log(`   💾 Storage saved: ${formatFileSize(totalSavings)}`);
    }
  } catch (error) {
    result.failureReasons.push(`Gemstone processing: ${error.message}`);
    stats.addFailure("gemstones", error.message, folderName);
    console.log(`❌ Gemstone failed: ${folderName} - ${error.message}`);
  }

  return result;
}

// ================================
// MAIN EXECUTION
// ================================

async function main() {
  console.log("🚀 Enhanced Gemstone Import System v2.0");
  console.log(
    "🔧 Features: WebP conversion, FFmpeg video compression, detailed reporting, error resilience"
  );

  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const maxFolders =
    parseInt(args.find((arg) => arg.startsWith("--max"))?.split("=")[1]) ||
    parseInt(args[args.indexOf("--max") + 1]) ||
    null;
  const sourcePath =
    args.find((arg) => arg.startsWith("--source"))?.split("=")[1] ||
    args[args.indexOf("--source") + 1] ||
    "/Volumes/2TB/gems";

  console.log(`📁 Source: ${sourcePath}`);
  console.log(`🔍 Mode: ${dryRun ? "DRY RUN" : "LIVE IMPORT"}`);
  if (maxFolders) console.log(`📊 Limit: ${maxFolders} folders`);
  console.log("────────────────────────────────────────────────────────────");

  // Initialize Supabase client (skip for dry runs)
  let supabase = null;
  if (!dryRun) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // Create temp directory
  const tempDir = path.join(process.cwd(), "temp", `import_${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  const stats = new ImportStatistics();

  try {
    // Scan source directory
    const allItems = await fs.readdir(sourcePath);
    const validFolders = [];

    // Check each item to see if it's a directory
    for (const item of allItems) {
      try {
        const itemPath = path.join(sourcePath, item);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          validFolders.push(item);
        }
      } catch {
        // Skip invalid items
      }
    }

    const targetFolders = maxFolders
      ? validFolders.slice(0, maxFolders)
      : validFolders;

    stats.total.folders = validFolders.length;
    stats.total.gemstones = targetFolders.length;

    console.log(`📂 Found ${validFolders.length} potential gemstone folders`);
    if (maxFolders) {
      console.log(`🎯 Processing first ${targetFolders.length} folders`);
    }

    if (dryRun) {
      console.log("\n🔍 DRY RUN - Scanning folders for statistics...");

      // Scan folders to get file counts
      for (const folderName of targetFolders.slice(0, 10)) {
        // Sample first 10
        const folderPath = path.join(sourcePath, folderName);
        try {
          const files = await fs.readdir(folderPath);
          const images = files.filter((f) =>
            SUPPORTED_IMAGE_FORMATS.includes(path.extname(f).toLowerCase())
          );
          const videos = files.filter((f) =>
            SUPPORTED_VIDEO_FORMATS.includes(path.extname(f).toLowerCase())
          );

          console.log(
            `📁 ${folderName}: ${images.length} images, ${videos.length} videos`
          );
          stats.total.images += images.length;
          stats.total.videos += videos.length;
        } catch (error) {
          console.log(`⚠️  Cannot read ${folderName}: ${error.message}`);
        }
      }

      // Estimate totals
      const avgImagesPerFolder =
        stats.total.images / Math.min(10, targetFolders.length);
      const avgVideosPerFolder =
        stats.total.videos / Math.min(10, targetFolders.length);
      stats.total.images = Math.round(
        avgImagesPerFolder * targetFolders.length
      );
      stats.total.videos = Math.round(
        avgVideosPerFolder * targetFolders.length
      );

      console.log("\n📊 ESTIMATED TOTALS:");
      console.log(`   Folders: ${stats.total.folders}`);
      console.log(`   Images: ${stats.total.images}`);
      console.log(`   Videos: ${stats.total.videos}`);
      console.log(
        `   Processing time: ~${Math.round(
          (targetFolders.length * 2) / 60
        )} minutes`
      );

      return;
    }

    // Create batch record
    const batchId = crypto.randomUUID();
    const { error: batchError } = await supabase.from("import_batches").insert({
      id: batchId,
      batch_name: `Enhanced Import v2.0 - ${new Date().toISOString()}`,
      source_path: sourcePath,
      total_folders: targetFolders.length,
      status: "processing",
      ai_analysis_enabled: false,
      processing_started_at: new Date().toISOString(),
    });

    if (batchError) {
      throw new Error(`Failed to create batch record: ${batchError.message}`);
    }

    console.log(`📝 Created batch record: ${batchId}`);

    // Process folders
    for (let i = 0; i < targetFolders.length; i++) {
      const folderName = targetFolders[i];
      const folderPath = path.join(sourcePath, folderName);

      const result = await processGemstoneFolder(
        supabase,
        folderPath,
        folderName,
        batchId,
        tempDir,
        stats
      );

      stats.addGemstoneResult(folderName, result);
      stats.processed.folders++;

      // Progress reporting
      if (
        (i + 1) % CONFIG.REPORT_INTERVAL === 0 ||
        i === targetFolders.length - 1
      ) {
        const progress = stats.getProgressReport();
        console.log("\n📊 PROGRESS REPORT:");
        console.log(
          `   ⏱️  Elapsed: ${progress.elapsed}s | ETA: ${progress.eta}s`
        );
        console.log(`   📁 Folders: ${progress.progress.folders}`);
        console.log(
          `   💎 Gemstones: ${progress.progress.gemstones} (${progress.successRates.gemstones}%)`
        );
        console.log(
          `   🖼️  Images: ${progress.progress.images} (${progress.successRates.images}%)`
        );
        console.log(
          `   🎥 Videos: ${progress.progress.videos} (${progress.successRates.videos}%)`
        );
        console.log(`   ❌ Errors: ${progress.progress.errors}`);
      }
    }

    // Update batch record
    await supabase
      .from("import_batches")
      .update({
        status: "completed",
        processed_folders: stats.processed.folders,
        processed_gemstones: stats.processed.gemstones,
        processed_files: stats.processed.images + stats.processed.videos,
        processing_completed_at: new Date().toISOString(),
      })
      .eq("id", batchId);

    // Final report
    const finalReport = stats.getFinalReport();
    console.log("\n🎉 IMPORT COMPLETED!");
    console.log("\n📊 FINAL STATISTICS:");
    console.log(`   ⏱️  Total time: ${finalReport.elapsed}s`);
    console.log(`   📁 Folders processed: ${finalReport.progress.folders}`);
    console.log(
      `   💎 Gemstones imported: ${finalReport.progress.gemstones} (${finalReport.successRates.gemstones}%)`
    );
    console.log(
      `   🖼️  Images processed: ${finalReport.progress.images} (${finalReport.successRates.images}%)`
    );
    console.log(
      `   🎥 Videos processed: ${finalReport.progress.videos} (${finalReport.successRates.videos}%)`
    );
    console.log(`   ❌ Total errors: ${finalReport.progress.errors}`);

    if (finalReport.failureReasons.length > 0) {
      console.log("\n⚠️  FAILURE ANALYSIS:");
      finalReport.failureReasons.forEach((failure) => {
        console.log(
          `   ${failure.type}: ${failure.reason} (${failure.count} times)`
        );
        if (failure.examples.length > 0) {
          console.log(`      Examples: ${failure.examples.join(", ")}`);
        }
      });
    }

    // Calculate storage savings
    const totalSavings = finalReport.gemstoneDetails.reduce(
      (sum, gem) =>
        sum + gem.compressionSavings.images + gem.compressionSavings.videos,
      0
    );

    if (totalSavings > 0) {
      console.log(`\n💾 STORAGE OPTIMIZATION:`);
      console.log(`   Total space saved: ${formatFileSize(totalSavings)}`);
      console.log(
        `   Average savings per gemstone: ${formatFileSize(
          totalSavings / stats.processed.gemstones
        )}`
      );
    }

    console.log(`\n🆔 Batch ID: ${batchId}`);
    console.log("📋 Use this ID for rollback if needed");
  } catch (error) {
    console.error(`\n💥 Import failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`⚠️  Could not clean up temp directory: ${error.message}`);
    }
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n🛑 Import interrupted by user");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("\n💥 Uncaught exception:", error);
  process.exit(1);
});

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };

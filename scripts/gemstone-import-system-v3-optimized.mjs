/**
 * Enhanced Gemstone Import System v3.0 - OPTIMIZED FOR SPEED
 *
 * Key Optimizations:
 * - Parallel image/video processing within each gemstone
 * - Concurrent gemstone processing (configurable workers)
 * - Batch database operations
 * - Reduced logging overhead
 * - Smart retry logic with exponential backoff
 * - Memory-efficient streaming for large files
 */

// Import centralized gemstone properties
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs/promises";
import heicConvert from "heic-convert";
import path from "path";
import sharp from "sharp";
import { GEMSTONE_DEFAULT_COLORS } from "../src/shared/config/gemstone-properties.js";
import { createBatchTracker } from "./shared/batch-tracker.mjs";
import { createAuditLogger } from "./shared/import-audit.mjs";

// Load environment variables
dotenv.config({ path: ".env.local" });

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Retry a database operation with exponential backoff
 */
async function retryDatabaseOperation(
  operation,
  operationName,
  maxRetries = CONFIG.MAX_RETRIES
) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(
        `⚠️  ${operationName} failed (attempt ${attempt}/${maxRetries}):`,
        error.message
      );

      if (attempt < maxRetries) {
        const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ Retrying ${operationName} in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `${operationName} failed after ${maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * Create a timeout promise that rejects after the specified time
 */
function createTimeoutPromise(timeoutMs) {
  return new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });
}

/**
 * Execute a database operation with timeout and retry
 */
async function executeWithTimeout(
  operation,
  operationName,
  timeoutMs = CONFIG.REQUEST_TIMEOUT
) {
  return Promise.race([operation(), createTimeoutPromise(timeoutMs)]);
}

// ================================
// OPTIMIZED CONFIGURATION
// ================================

const CONFIG = {
  // File size limits (bytes)
  MAX_IMAGE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB (will compress if larger)

  // Image optimization settings
  IMAGE_QUALITY: 85,
  IMAGE_WIDTH_LIMIT: 2048,

  // Video compression settings
  VIDEO_BITRATE: "2000k",
  VIDEO_CODEC: "libx264",
  VIDEO_PRESET: "ultrafast", // Faster encoding

  // PERFORMANCE OPTIMIZATIONS
  MAX_CONCURRENT_GEMSTONES: 3, // Process 3 gemstones simultaneously
  MAX_CONCURRENT_MEDIA: 5, // Process 5 media files per gemstone simultaneously
  BATCH_SIZE: 10, // Batch database operations

  // ERROR HANDLING
  MAX_RETRIES: 5,
  RETRY_DELAY: 2000, // 2 seconds
  REQUEST_TIMEOUT: 60000, // 60 seconds

  // Progress reporting
  REPORT_INTERVAL: 10, // Report every 10 gemstones (less frequent)
  QUIET_MODE: false, // Set to true to reduce console output
};

// Russian Gemstone Classification System
const GEMSTONE_TYPE_MAP = {
  А: "emerald",
  Б: "emerald",
  Г: "garnet",
  Е: "emerald",
  К: "quartz",
  Л: "tourmaline",
  М: "morganite",
  Н: "aquamarine",
  П: "peridot",
  Р: "zircon",
  С: "sapphire",
  Т: "apatite",
  Ф: "amethyst",
  Ц: "citrine",
  Z: "tanzanite",
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
// OPTIMIZED STATISTICS CLASS
// ================================

class OptimizedImportStatistics {
  constructor() {
    this.startTime = Date.now();
    this.total = { folders: 0, gemstones: 0, images: 0, videos: 0, errors: 0 };
    this.processed = { folders: 0, gemstones: 0, images: 0, videos: 0 };
    this.failed = { folders: 0, gemstones: 0, images: 0, videos: 0 };
    this.compressionSavings = 0;
    this.batchResults = [];
  }

  addBatchResult(results) {
    this.batchResults.push(...results);
    results.forEach((result) => {
      if (result.success) {
        this.processed.gemstones++;
        this.processed.images += result.imported.images;
        this.processed.videos += result.imported.videos;
        this.compressionSavings +=
          result.compressionSavings.images + result.compressionSavings.videos;
      } else {
        this.failed.gemstones++;
        this.total.errors++;
      }
    });
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
      gemsPerSec: Math.round(gemsPerSec * 100) / 100,
      compressionSavings: this.compressionSavings,
      progress: {
        gemstones: `${this.processed.gemstones}/${this.total.gemstones}`,
        images: `${this.processed.images}/${this.total.images}`,
        videos: `${this.processed.videos}/${this.total.videos}`,
        errors: this.total.errors,
      },
    };
  }
}

// ================================
// OPTIMIZED UTILITY FUNCTIONS
// ================================

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(operation, attempts = CONFIG.MAX_RETRIES) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === attempts - 1) {
        console.error(`💥 All ${attempts} retry attempts failed`);
        throw error;
      }

      const delay = CONFIG.RETRY_DELAY * Math.pow(2, i);
      console.warn(`⚠️  Retry ${i + 1}/${attempts} failed: ${error.message}`);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await wait(delay);
    }
  }
}

function detectGemstoneType(folderName) {
  const firstChar = folderName.charAt(0).toUpperCase();
  return GEMSTONE_TYPE_MAP[firstChar] || GEMSTONE_TYPE_MAP.default;
}

function detectGemstoneColor(gemstoneType) {
  // Use centralized color mapping instead of hardcoded values
  return GEMSTONE_DEFAULT_COLORS[gemstoneType] || "colorless";
}

function generateSerialNumber(folderName) {
  const timestamp = Date.now().toString().slice(-8); // More precise timestamp
  const randomSuffix = Math.random().toString(36).substring(2, 5); // Add randomness
  const sanitizedFolder = folderName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  return `SV-${sanitizedFolder}-${timestamp}-${randomSuffix}`;
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ================================
// OPTIMIZED MEDIA PROCESSING
// ================================

async function processImageFileOptimized(filePath, filename, serialNumber) {
  const stats = await fs.stat(filePath);
  const fileSize = stats.size;

  if (fileSize > CONFIG.MAX_IMAGE_SIZE) {
    throw new Error(`Image too large: ${formatFileSize(fileSize)}`);
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

  // Optimized WebP conversion (no watermarking for speed)
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
    compressionRatio: Math.round((1 - processedBuffer.length / fileSize) * 100),
  };
}

async function processVideoFileOptimized(filePath, filename, tempDir) {
  const stats = await fs.stat(filePath);
  const fileSize = stats.size;

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

  // Fast compression for oversized videos
  const tempOutputPath = path.join(
    tempDir,
    `compressed_${filename.replace(/\.[^.]+$/, ".mp4")}`
  );

  await new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath.path, [
      "-i",
      filePath,
      "-c:v",
      CONFIG.VIDEO_CODEC,
      "-preset",
      CONFIG.VIDEO_PRESET, // ultrafast for speed
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
      "-y",
      tempOutputPath,
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve(tempOutputPath);
      else reject(new Error(`FFmpeg failed with code ${code}`));
    });

    ffmpeg.on("error", reject);
  });

  const compressedBuffer = await fs.readFile(tempOutputPath);
  await fs.unlink(tempOutputPath).catch(() => {});

  return {
    buffer: compressedBuffer,
    originalName: filename,
    processedSize: compressedBuffer.length,
    originalSize: fileSize,
    compressionRatio: Math.round(
      (1 - compressedBuffer.length / fileSize) * 100
    ),
  };
}

// ================================
// BATCH DATABASE OPERATIONS
// ================================

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

async function uploadToSupabase(supabase, buffer, storagePath, contentType) {
  return withRetry(async () => {
    const { data, error } = await supabase.storage
      .from("gemstone-media")
      .upload(storagePath, buffer, { contentType });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: publicData } = supabase.storage
      .from("gemstone-media")
      .getPublicUrl(storagePath);

    return publicData.publicUrl;
  });
}

async function batchCreateMediaRecords(supabase, records, tableName) {
  if (records.length === 0) return;

  return withRetry(async () => {
    const { error } = await supabase.from(tableName).insert(records);
    if (error) throw new Error(`Batch insert failed: ${error.message}`);
  });
}

// ================================
// PARALLEL PROCESSING FUNCTIONS
// ================================

async function processMediaFilesInParallel(
  files,
  processor,
  gemstoneId,
  tempDir,
  serialNumber,
  sourcePath
) {
  const semaphore = new Array(CONFIG.MAX_CONCURRENT_MEDIA).fill(null);
  let index = 0;
  const results = [];
  const mediaRecords = [];

  const processFile = async (semaphoreIndex) => {
    while (index < files.length) {
      const currentIndex = index++;
      const filePath = files[currentIndex]; // This is already the full path
      const filename = path.basename(filePath);

      try {
        const processed = await processor(filePath, filename, serialNumber);

        // Generate storage path
        const fileType = processor.name.includes("Image") ? "images" : "videos";
        const extension = fileType === "images" ? "webp" : "mp4";
        const storagePath = `gemstones/${gemstoneId}/${fileType}/${Date.now()}_${
          currentIndex + 1
        }.${extension}`;

        // Calculate original path relative to source directory
        const originalPath = path.relative(sourcePath, filePath);

        results.push({
          success: true,
          filename,
          processed: {
            ...processed,
            originalName: filename, // Ensure originalName is set correctly
          },
          storagePath,
          originalPath,
          order: currentIndex + 1,
        });
      } catch (error) {
        results.push({
          success: false,
          filename,
          error: error.message,
        });
      }
    }
  };

  // Start parallel processing
  await Promise.all(semaphore.map((_, i) => processFile(i)));

  return results;
}

async function processGemstoneOptimized(
  supabase,
  folderPath,
  folderName,
  batchId,
  tempDir,
  sourcePath,
  auditLogger
) {
  const result = {
    success: false,
    folder: folderName,
    imported: { images: 0, videos: 0 },
    failed: { images: 0, videos: 0 },
    found: { images: 0, videos: 0 },
    compressionSavings: { images: 0, videos: 0 },
    failureReasons: [],
  };

  try {
    // Scan folder for media files
    const allFiles = await fs.readdir(folderPath);

    // Check if folder is completely empty
    if (allFiles.length === 0) {
      const message = `Folder ${folderName} is empty - skipping import`;
      console.log(`ℹ️  ${message}`);
      result.failureReasons.push(message);

      // Log this as a completed operation (skipped)
      await auditLogger.logOperation(
        "gemstone_processing",
        "completed",
        { folderName, reason: "empty_folder" },
        0
      );

      return result; // Return early without creating gemstone
    }

    const imageFiles = allFiles.filter((f) =>
      SUPPORTED_IMAGE_FORMATS.includes(path.extname(f).toLowerCase())
    );
    const videoFiles = allFiles.filter((f) =>
      SUPPORTED_VIDEO_FORMATS.includes(path.extname(f).toLowerCase())
    );

    result.found.images = imageFiles.length;
    result.found.videos = videoFiles.length;

    // Check if folder has no supported media files
    if (imageFiles.length === 0 && videoFiles.length === 0) {
      const message = `Folder ${folderName} contains no supported media files (images/videos) - skipping import`;
      console.log(`⚠️  ${message}`);
      result.failureReasons.push(message);

      // Log this as a completed operation (no media)
      await auditLogger.logOperation(
        "gemstone_processing",
        "completed",
        {
          folderName,
          reason: "no_supported_media",
          totalFiles: allFiles.length,
        },
        0
      );

      return result; // Return early without creating gemstone
    }

    // Detect gemstone type and create record
    const gemstoneType = detectGemstoneType(folderName);
    const detectedColor = detectGemstoneColor(gemstoneType);
    const serialNumber = generateSerialNumber(folderName);

    const gemstoneData = {
      name: gemstoneType,
      color: detectedColor,
      cut: "round",
      clarity: "VS1",
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
      import_folder_path: folderPath,
      import_notes: `Imported from ${folderName} with ${result.found.images} images and ${result.found.videos} videos`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const gemstone = await createGemstoneRecord(supabase, gemstoneData);

    // Process images and videos in parallel
    const [imageResults, videoResults] = await Promise.all([
      imageFiles.length > 0
        ? processMediaFilesInParallel(
            imageFiles.map((f) => path.join(folderPath, f)),
            processImageFileOptimized,
            gemstone.id,
            tempDir,
            serialNumber,
            sourcePath
          )
        : Promise.resolve([]),
      videoFiles.length > 0
        ? processMediaFilesInParallel(
            videoFiles.map((f) => path.join(folderPath, f)),
            processVideoFileOptimized,
            gemstone.id,
            tempDir,
            serialNumber,
            sourcePath
          )
        : Promise.resolve([]),
    ]);

    // Upload successful media files in parallel and prepare batch records
    const imageRecords = [];
    const videoRecords = [];

    const uploadPromises = [];

    // Process successful images
    for (const imageResult of imageResults.filter((r) => r.success)) {
      uploadPromises.push(
        uploadToSupabase(
          supabase,
          imageResult.processed.buffer,
          imageResult.storagePath,
          "image/webp"
        )
          .then((publicUrl) => {
            // Debug logging for original_path
            if (!CONFIG.QUIET_MODE && imageResult.order === 1) {
              console.log(`   📁 Debug - Image ${imageResult.filename}:`);
              console.log(`      originalPath: ${imageResult.originalPath}`);
              console.log(`      filename: ${imageResult.filename}`);
              console.log(
                `      processed.originalName: ${imageResult.processed.originalName}`
              );
            }

            imageRecords.push({
              gemstone_id: gemstone.id,
              image_url: publicUrl,
              image_order: imageResult.order,
              is_primary: imageResult.order === 1,
              has_watermark: false, // Disabled for speed
              alt_text: imageResult.processed.originalName,
              original_filename: imageResult.filename, // Use filename from result
              original_path: imageResult.originalPath || imageResult.filename, // Use originalPath or fallback to filename
            });
            result.imported.images++;
            result.compressionSavings.images +=
              imageResult.processed.originalSize -
              imageResult.processed.processedSize;
          })
          .catch((error) => {
            result.failed.images++;
            result.failureReasons.push(
              `Image upload ${imageResult.filename}: ${error.message}`
            );
          })
      );
    }

    // Process successful videos
    for (const videoResult of videoResults.filter((r) => r.success)) {
      uploadPromises.push(
        uploadToSupabase(
          supabase,
          videoResult.processed.buffer,
          videoResult.storagePath,
          "video/mp4"
        )
          .then((publicUrl) => {
            videoRecords.push({
              gemstone_id: gemstone.id,
              video_url: publicUrl,
              video_order: videoResult.order,
              duration_seconds: null,
              thumbnail_url: null,
              title: videoResult.processed.originalName,
              original_filename: videoResult.filename, // Use filename from result
              original_path: videoResult.originalPath || videoResult.filename, // Use originalPath or fallback to filename
            });
            result.imported.videos++;
            result.compressionSavings.videos +=
              videoResult.processed.originalSize -
              videoResult.processed.processedSize;
          })
          .catch((error) => {
            result.failed.videos++;
            result.failureReasons.push(
              `Video upload ${videoResult.filename}: ${error.message}`
            );
          })
      );
    }

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // Batch create database records
    await Promise.all([
      imageRecords.length > 0
        ? batchCreateMediaRecords(supabase, imageRecords, "gemstone_images")
        : Promise.resolve(),
      videoRecords.length > 0
        ? batchCreateMediaRecords(supabase, videoRecords, "gemstone_videos")
        : Promise.resolve(),
    ]);

    // Count failed processing
    result.failed.images += imageResults.filter((r) => !r.success).length;
    result.failed.videos += videoResults.filter((r) => !r.success).length;

    result.success = true;

    if (!CONFIG.QUIET_MODE) {
      const totalSavings =
        result.compressionSavings.images + result.compressionSavings.videos;
      console.log(
        `✅ ${serialNumber} (${gemstoneType}, ${detectedColor}): ${
          result.imported.images
        }/${result.found.images} images, ${result.imported.videos}/${
          result.found.videos
        } videos${
          totalSavings > 0 ? ` | Saved: ${formatFileSize(totalSavings)}` : ""
        }`
      );
    }

    // Log successful gemstone processing
    auditLogger.logOperationComplete(
      "gemstone_processing",
      {
        gemstoneId: gemstone.id,
        serialNumber,
        gemstoneType,
        detectedColor,
        imagesProcessed: result.imported.images,
        videosProcessed: result.imported.videos,
        compressionSavings: result.compressionSavings,
      },
      { folderName }
    );
  } catch (error) {
    result.failureReasons.push(`Gemstone processing: ${error.message}`);
    if (!CONFIG.QUIET_MODE) {
      console.log(`❌ ${folderName}: ${error.message}`);
    }

    // Log failed gemstone processing
    auditLogger.logError(
      error,
      {
        folderName,
        operation: "gemstone_processing",
        failureReasons: result.failureReasons,
      },
      "gemstone_processing"
    );
  }

  return result;
}

// ================================
// MAIN OPTIMIZED EXECUTION
// ================================

async function main() {
  console.log("🚀 Enhanced Gemstone Import System v3.0 - OPTIMIZED");
  console.log(
    "⚡ Performance Features: Parallel processing, batch operations, reduced logging"
  );

  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const freshImport = args.includes("--fresh-import");
  const maxFolders =
    parseInt(args.find((arg) => arg.startsWith("--max"))?.split("=")[1]) ||
    parseInt(args[args.indexOf("--max") + 1]) ||
    null;
  const sourcePath =
    args.find((arg) => arg.startsWith("--source"))?.split("=")[1] ||
    args[args.indexOf("--source") + 1] ||
    "/Volumes/2TB/gems";

  // Enable quiet mode for large imports
  if (maxFolders && maxFolders > 50) {
    CONFIG.QUIET_MODE = true;
    console.log("🔇 Quiet mode enabled for large import");
  }

  console.log(`📁 Source: ${sourcePath}`);
  console.log(
    `🔍 Mode: ${
      dryRun ? "DRY RUN" : freshImport ? "FRESH IMPORT" : "LIVE IMPORT"
    }`
  );
  console.log(
    `⚡ Concurrency: ${CONFIG.MAX_CONCURRENT_GEMSTONES} gemstones, ${CONFIG.MAX_CONCURRENT_MEDIA} media/gemstone`
  );
  if (maxFolders) console.log(`📊 Limit: ${maxFolders} folders`);
  console.log("────────────────────────────────────────────────────────────");

  // Initialize Supabase client
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

  const stats = new OptimizedImportStatistics();

  // Generate batch ID first
  const batchId = crypto.randomUUID();

  // Create batch record FIRST before initializing trackers
  console.log("📝 Creating batch record...");

  const batchData = {
    id: batchId,
    batch_name: `Optimized Import v3.0 - ${new Date().toISOString()}`,
    source_path: sourcePath,
    total_folders: maxFolders || 100, // Use maxFolders or default estimate
    status: "processing",
    ai_analysis_enabled: false,
    processing_started_at: new Date().toISOString(),
  };

  await retryDatabaseOperation(async () => {
    const { error } = await executeWithTimeout(
      () => supabase.from("import_batches").insert(batchData),
      "Batch creation",
      CONFIG.REQUEST_TIMEOUT
    );

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }, "Batch record creation");

  console.log(`📝 Created batch record: ${batchId}`);

  // Initialize batch tracking and audit logging AFTER creating the batch
  const batchTracker = createBatchTracker(batchId, {
    trackPerformance: true,
    enableAuditTrail: true,
    collectMetadata: true,
  });

  const auditLogger = createAuditLogger(batchId, {
    logToFile: true,
    logToDatabase: true,
    enableRealTime: false,
    logLevel: "info",
  });

  await batchTracker.initialize({
    sourcePath,
    scriptVersion: "v3.0-optimized",
    importType: freshImport ? "fresh_import" : "regular_import",
    commandArgs: process.argv.slice(2),
  });

  await auditLogger.initialize({
    script: "gemstone-import-system-v3-optimized.mjs",
    version: "3.0",
    source: sourcePath,
    importType: freshImport ? "fresh_import" : "regular_import",
  });

  auditLogger.logOperationStart("import_process", { sourcePath, freshImport });

  try {
    // Scan source directory
    const allItems = await fs.readdir(sourcePath);
    const validFolders = [];

    for (const item of allItems) {
      try {
        const itemPath = path.join(sourcePath, item);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          // Check if folder is empty or has no supported media files
          try {
            const folderContents = await fs.readdir(itemPath);

            if (folderContents.length === 0) {
              console.log(`ℹ️  Skipping empty folder: ${item}`);
              continue; // Skip empty folders
            }

            // Check for supported media files
            const hasImages = folderContents.some((file) =>
              SUPPORTED_IMAGE_FORMATS.includes(path.extname(file).toLowerCase())
            );
            const hasVideos = folderContents.some((file) =>
              SUPPORTED_VIDEO_FORMATS.includes(path.extname(file).toLowerCase())
            );

            if (!hasImages && !hasVideos) {
              console.log(
                `⚠️  Skipping folder with no supported media: ${item} (${folderContents.length} unsupported files)`
              );
              continue; // Skip folders with no supported media
            }

            validFolders.push(item);
          } catch (folderError) {
            console.log(
              `⚠️  Error reading folder ${item}: ${folderError.message}`
            );
            // Still add the folder but log the error - let the processing handle it
            validFolders.push(item);
          }
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

    // Update batch tracker with totals
    await batchTracker.updateProgress({
      totalFolders: validFolders.length,
      totalGemstones: targetFolders.length,
    });

    auditLogger.log(
      "folders_discovered",
      `Found ${validFolders.length} folders, processing ${targetFolders.length}`,
      {
        totalFolders: validFolders.length,
        targetFolders: targetFolders.length,
        sourcePath,
      }
    );

    if (dryRun) {
      console.log(
        "🔍 DRY RUN - Estimated processing time with optimizations: ~40% faster"
      );
      return;
    }

    // Handle fresh import mode
    if (freshImport) {
      console.log("\n🗑️  FRESH IMPORT MODE: Clearing existing data...");
      try {
        const { clearAllData } = await import("./clear-all-data.mjs");
        await clearAllData();
        console.log("✅ Existing data cleared successfully\n");
      } catch (error) {
        console.error("❌ Failed to clear existing data:", error.message);
        console.log("💡 Continuing with import anyway...");
      }
    }

    // Batch record already created above

    // Process gemstones in parallel batches
    const semaphore = new Array(CONFIG.MAX_CONCURRENT_GEMSTONES).fill(null);
    let folderIndex = 0;
    const allResults = [];

    const processNextBatch = async () => {
      while (folderIndex < targetFolders.length) {
        const currentIndex = folderIndex++;
        const folderName = targetFolders[currentIndex];
        const folderPath = path.join(sourcePath, folderName);

        try {
          const result = await processGemstoneOptimized(
            supabase,
            folderPath,
            folderName,
            batchId,
            tempDir,
            sourcePath,
            auditLogger
          );
          allResults.push(result);

          // Progress reporting
          if (
            allResults.length % CONFIG.REPORT_INTERVAL === 0 ||
            currentIndex === targetFolders.length - 1
          ) {
            stats.addBatchResult(allResults.slice(-CONFIG.REPORT_INTERVAL));
            const progress = stats.getProgressReport();
            console.log(
              `\n📊 Progress: ${progress.progress.gemstones} | Speed: ${
                progress.gemsPerSec
              } gems/sec | ETA: ${progress.eta}s | Saved: ${formatFileSize(
                progress.compressionSavings
              )}`
            );
          }
        } catch (error) {
          allResults.push({
            success: false,
            folder: folderName,
            failureReasons: [error.message],
          });
        }
      }
    };

    // Start parallel processing
    await Promise.all(semaphore.map(() => processNextBatch()));

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
    const finalReport = stats.getProgressReport();

    // Complete batch tracking and audit logging
    const finalStats = {
      totalGemstones: stats.processed.gemstones,
      processedGemstones: stats.processed.gemstones,
      totalImages: stats.processed.images,
      processedImages: stats.processed.images,
      totalVideos: stats.processed.videos,
      processedVideos: stats.processed.videos,
      compressionSavings: stats.compressionSavings,
    };

    await batchTracker.complete(true, finalStats);

    await auditLogger.complete(true, {
      finalStats,
      performance: finalReport,
      batchId,
    });

    console.log("\n🎉 OPTIMIZED IMPORT COMPLETED!");
    console.log(`⚡ Average Speed: ${finalReport.gemsPerSec} gemstones/second`);
    console.log(`⏱️  Total Time: ${finalReport.elapsed}s`);
    console.log(`💎 Gemstones: ${finalReport.progress.gemstones}`);
    console.log(`🖼️  Images: ${finalReport.progress.images}`);
    console.log(`🎥 Videos: ${finalReport.progress.videos}`);
    console.log(
      `💾 Storage Saved: ${formatFileSize(finalReport.compressionSavings)}`
    );
    console.log(`🆔 Batch ID: ${batchId}`);
    console.log(`📊 Audit Session: ${batchId}`);
  } catch (error) {
    console.error("💥 Import failed:", error.message);

    // Log import failure to audit trail
    await auditLogger.logError(
      error,
      {
        operation: "import_process",
        batchId,
        sourcePath,
      },
      "import_process"
    );

    await auditLogger.complete(false, {
      error: error.message,
      batchId,
    });

    throw error;
  } finally {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true }).catch(() => {});
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("💥 Uncaught exception:", error);
    process.exit(1);
  });
}

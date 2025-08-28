#!/usr/bin/env node

/**
 * Gemstone Import System - Smaragdus Viridi
 *
 * Processes gemstone data from organized folder structure:
 * - Photos of gems
 * - Videos
 * - Label photos with attributes (cut, id, weight, count)
 * - Measurement photos showing dimensions
 */

import { dirname, join } from "path";

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import heicConvert from "heic-convert";
import path from "path";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from the project root
dotenv.config({ path: join(__dirname, "..", ".env.local") });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error(
    "Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  console.error(
    "Available vars:",
    Object.keys(process.env).filter((k) => k.includes("SUPABASE"))
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Gemstone type mappings from Russian abbreviations
const GEMSTONE_TYPE_MAP = {
  Ц: "citrine", // Цитрин
  Ф: "fluorite", // Флюорит
  Т: "topaz", // Топаз
  Э: "emerald", // Изумруд
  Ш: "spinel", // Шпинель
  А: "amethyst", // Аметист
  Р: "ruby", // Рубин
  С: "sapphire", // Сапфир
  Г: "garnet", // Гранат
  П: "peridot", // Перидот
  И: "emerald", // Alternative emerald
};

// File type patterns
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|tiff|bmp|webp|heic)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|mov|avi|mkv|webm)$/i;
const CERTIFICATE_PATTERNS =
  /(?:cert|certificate|сертификат|документ|паспорт|справка)/i;
const LABEL_PATTERNS = /(?:label|этикетка|бирка|tag|лейбл)/i;
const MEASUREMENT_PATTERNS =
  /(?:measure|размер|измер|scale|ruler|линейка|мера)/i;

// Color mappings for gemstones
const COLOR_MAPPINGS = {
  красный: "red",
  синий: "blue",
  зеленый: "green",
  желтый: "yellow",
  розовый: "pink",
  белый: "white",
  черный: "black",
  бесцветный: "colorless",
  прозрачный: "colorless",
};

class EnhancedGemstoneImporter {
  constructor(sourceDir, options = {}) {
    this.sourceDir = sourceDir || "/Volumes/2TB/gems";
    this.dryRun = options.dryRun || false;
    this.maxItems = options.maxItems || null;
    this.batchId = crypto.randomUUID(); // For rollback capability
    this.stats = {
      foldersProcessed: 0,
      gemstonesCreated: 0,
      imagesProcessed: 0,
      videosProcessed: 0,
      certificatesFound: 0,
      labelsFound: 0,
      measurementsFound: 0,
      errors: 0,
    };
    this.previewData = [];
    this.aiAnalysisQueue = [];
  }

  async createBatchRecord(totalFolders) {
    const { error } = await supabase.from("import_batches").insert({
      id: this.batchId,
      batch_name: `Import_${
        new Date().toISOString().split("T")[0]
      }_${totalFolders}_folders`,
      source_path: this.sourceDir,
      total_folders: this.maxItems || totalFolders,
      processed_folders: 0,
      total_gemstones: 0,
      processed_gemstones: 0,
      total_files: 0,
      processed_files: 0,
      status: "processing",
      ai_analysis_enabled: true,
      processing_started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    console.log(`📝 Created batch record: ${this.batchId}`);
  }

  async run() {
    console.log("🚀 Enhanced Gemstone Import System with AI Preparation");
    console.log(`📁 Source: ${this.sourceDir}`);
    console.log(`🔍 Mode: ${this.dryRun ? "DRY RUN" : "LIVE IMPORT"}`);
    if (this.maxItems) {
      console.log(`📊 Limit: ${this.maxItems} items`);
    }
    console.log("─".repeat(60));

    try {
      // Check if source directory exists
      await fs.access(this.sourceDir);

      // Get all folders
      const folders = await this.getGemstoneFolder();
      console.log(`📂 Found ${folders.length} potential gemstone folders`);

      // Create batch record for live imports
      if (!this.dryRun) {
        await this.createBatchRecord(folders.length);
      }

      // Process folders
      const foldersToProcess = this.maxItems
        ? folders.slice(0, this.maxItems)
        : folders;

      for (const folder of foldersToProcess) {
        await this.processGemstoneFolder(folder);

        if (this.dryRun && this.previewData.length >= 5) {
          console.log("\n📋 PREVIEW - First 5 items to be imported:");
          this.previewData.slice(0, 5).forEach((item, index) => {
            console.log(`\n--- Item ${index + 1} ---`);
            console.log(`Folder: ${item.folderName}`);
            console.log(`Serial: ${item.serialNumber}`);
            console.log(`Type: ${item.gemstoneType} (${item.typeSource})`);
            console.log(
              `Images: ${item.categorizedFiles.gemstonePhotos.length} gemstone photos`
            );
            console.log(
              `Videos: ${item.categorizedFiles.videos.length} videos`
            );
            console.log(
              `Certificates: ${item.categorizedFiles.certificates.length} found`
            );
            console.log(`Labels: ${item.categorizedFiles.labels.length} found`);
            console.log(
              `Measurements: ${item.categorizedFiles.measurements.length} found`
            );
            console.log(`AI Analysis Priority: ${item.aiAnalysisPriority}`);

            // Show file categorization
            if (item.categorizedFiles.certificates.length > 0) {
              console.log(
                `  📜 Certificates: ${item.categorizedFiles.certificates
                  .map((f) => path.basename(f.originalPath))
                  .join(", ")}`
              );
            }
            if (item.categorizedFiles.labels.length > 0) {
              console.log(
                `  🏷️  Labels: ${item.categorizedFiles.labels
                  .map((f) => path.basename(f.originalPath))
                  .join(", ")}`
              );
            }
            if (item.categorizedFiles.measurements.length > 0) {
              console.log(
                `  📏 Measurements: ${item.categorizedFiles.measurements
                  .map((f) => path.basename(f.originalPath))
                  .join(", ")}`
              );
            }
          });

          console.log("\n📊 ENHANCED SUMMARY:");
          console.log(`Total folders to process: ${foldersToProcess.length}`);
          console.log(
            `Total gemstone photos: ${this.previewData.reduce(
              (sum, item) => sum + item.categorizedFiles.gemstonePhotos.length,
              0
            )}`
          );
          console.log(
            `Total videos: ${this.previewData.reduce(
              (sum, item) => sum + item.categorizedFiles.videos.length,
              0
            )}`
          );
          console.log(
            `Total certificates: ${this.previewData.reduce(
              (sum, item) => sum + item.categorizedFiles.certificates.length,
              0
            )}`
          );
          console.log(
            `Total labels: ${this.previewData.reduce(
              (sum, item) => sum + item.categorizedFiles.labels.length,
              0
            )}`
          );
          console.log(
            `Total measurements: ${this.previewData.reduce(
              (sum, item) => sum + item.categorizedFiles.measurements.length,
              0
            )}`
          );
          console.log(
            `Items queued for AI analysis: ${this.aiAnalysisQueue.length}`
          );

          break; // Stop after preview in dry run
        }
      }

      this.printStats();

      if (this.dryRun) {
        console.log("\n🤖 AI ANALYSIS STRATEGY:");
        console.log("Phase 1: Import with enhanced metadata preservation");
        console.log("Phase 2: AI analysis pipeline for data extraction");
        console.log("- OpenAI Vision API for gemstone identification");
        console.log("- Certificate text extraction (Russian/Kazakh)");
        console.log("- Measurement analysis from ruler photos");
        console.log("- Quality assessment and validation");
      }
    } catch (error) {
      console.error("💥 Import failed:", error.message);
      process.exit(1);
    }
  }

  async getGemstoneFolder() {
    const entries = await fs.readdir(this.sourceDir, { withFileTypes: true });

    // Filter for directories that look like gemstone folders (numbered)
    const folders = entries
      .filter((entry) => entry.isDirectory())
      .filter((entry) => !entry.name.startsWith(".")) // Skip hidden folders
      .filter(
        (entry) => /^[\d\.]/.test(entry.name) || /^[А-Я]/.test(entry.name)
      ) // Numbers or Cyrillic
      .map((entry) => path.join(this.sourceDir, entry.name))
      .sort();

    return folders;
  }

  async processGemstoneFolder(folderPath) {
    const folderName = path.basename(folderPath);
    console.log(`\n🔍 Processing: ${folderName}`);

    try {
      this.stats.foldersProcessed++;

      // Read folder contents recursively
      const allFiles = await this.getAllFilesRecursively(folderPath);

      // Categorize files by type and purpose
      const categorizedFiles = this.categorizeFiles(allFiles);

      // Generate enhanced gemstone data
      const gemstoneData = this.generateEnhancedGemstoneData(
        folderName,
        categorizedFiles
      );

      // Add to AI analysis queue if has analyzable content
      if (this.shouldAnalyzeWithAI(categorizedFiles)) {
        this.aiAnalysisQueue.push({
          gemstoneId: gemstoneData.serialNumber,
          files: categorizedFiles,
          priority: this.calculateAIPriority(categorizedFiles),
        });
      }

      if (this.dryRun) {
        this.previewData.push(gemstoneData);
        console.log(
          `   📸 ${categorizedFiles.gemstonePhotos.length} photos, 🎥 ${categorizedFiles.videos.length} videos`
        );
        console.log(
          `   📜 ${categorizedFiles.certificates.length} certs, 🏷️ ${categorizedFiles.labels.length} labels, 📏 ${categorizedFiles.measurements.length} measurements`
        );
      } else {
        // Actually import the gemstone
        await this.importEnhancedGemstone(gemstoneData);
      }
    } catch (error) {
      console.error(`❌ Error processing ${folderName}:`, error.message);
      this.stats.errors++;
    }
  }

  async getAllFilesRecursively(dirPath) {
    const files = [];

    const processDirectory = async (currentPath, relativePath = "") => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          // Recursively process subdirectories
          await processDirectory(fullPath, relativeFilePath);
        } else if (entry.isFile()) {
          // Get file stats for metadata
          const stats = await fs.stat(fullPath);

          files.push({
            originalPath: fullPath,
            relativePath: relativeFilePath,
            fileName: entry.name,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            extension: path.extname(entry.name).toLowerCase(),
          });
        }
      }
    };

    await processDirectory(dirPath);
    return files;
  }

  categorizeFiles(files) {
    const categories = {
      gemstonePhotos: [],
      videos: [],
      certificates: [],
      labels: [],
      measurements: [],
      other: [],
    };

    for (const file of files) {
      const fileName = file.fileName.toLowerCase();
      const isImage = IMAGE_EXTENSIONS.test(file.fileName);
      const isVideo = VIDEO_EXTENSIONS.test(file.fileName);

      if (isImage) {
        if (CERTIFICATE_PATTERNS.test(fileName)) {
          categories.certificates.push({
            ...file,
            standardizedName: this.generateStandardizedName(file, "cert"),
            aiAnalysisType: "certificate_ocr",
          });
          this.stats.certificatesFound++;
        } else if (LABEL_PATTERNS.test(fileName)) {
          categories.labels.push({
            ...file,
            standardizedName: this.generateStandardizedName(file, "label"),
            aiAnalysisType: "label_ocr",
          });
          this.stats.labelsFound++;
        } else if (MEASUREMENT_PATTERNS.test(fileName)) {
          categories.measurements.push({
            ...file,
            standardizedName: this.generateStandardizedName(file, "measure"),
            aiAnalysisType: "measurement_analysis",
          });
          this.stats.measurementsFound++;
        } else {
          // Regular gemstone photo
          categories.gemstonePhotos.push({
            ...file,
            standardizedName: this.generateStandardizedName(file, "gem"),
            aiAnalysisType: "gemstone_identification",
          });
        }
      } else if (isVideo) {
        categories.videos.push({
          ...file,
          standardizedName: this.generateStandardizedName(file, "video"),
          aiAnalysisType: "video_analysis",
        });
      } else {
        categories.other.push(file);
      }
    }

    return categories;
  }

  generateStandardizedName(file, type) {
    const timestamp = Date.now();
    const hash = crypto
      .createHash("md5")
      .update(file.originalPath)
      .digest("hex")
      .slice(0, 8);
    const ext = type === "video" ? ".mp4" : ".jpg"; // Standardize extensions

    return `${type}_${timestamp}_${hash}${ext}`;
  }

  generateEnhancedGemstoneData(folderName, categorizedFiles) {
    // Generate unique serial number
    const timestamp = Date.now().toString().slice(-6);
    const serialNumber = `SV-${folderName.replace(/[^\w]/g, "")}-${timestamp}`;

    // Detect gemstone type with source tracking
    const { type: gemstoneType, source: typeSource } =
      this.detectGemstoneTypeWithSource(folderName);

    // Calculate AI analysis priority
    const aiAnalysisPriority = this.calculateAIPriority(categorizedFiles);

    return {
      folderName,
      serialNumber,
      gemstoneType,
      typeSource,
      categorizedFiles,
      aiAnalysisPriority,
      properties: {
        ...this.getEnhancedDefaultProperties(),
        name: gemstoneType,
        serial_number: serialNumber,
        internal_code: folderName,
        import_batch_id: this.batchId,
      },
    };
  }

  detectGemstoneTypeWithSource(folderName) {
    // Check for Cyrillic letter prefixes
    for (const [letter, type] of Object.entries(GEMSTONE_TYPE_MAP)) {
      if (folderName.startsWith(letter)) {
        return { type, source: `cyrillic_prefix_${letter}` };
      }
    }

    // Default to emerald as requested
    if (/^[\d\.]+$/.test(folderName)) {
      return { type: "emerald", source: "numeric_folder_default" };
    }

    return { type: "emerald", source: "fallback_default" };
  }

  getEnhancedDefaultProperties() {
    return {
      weight_carats: 1.0,
      length_mm: 10.0,
      width_mm: 10.0,
      depth_mm: 6.0,
      color: "green", // Default for emerald
      cut: "emerald",
      clarity: "VS1",
      price_amount: 150000, // $1500 in cents for emerald
      price_currency: "USD",
      delivery_days: 7,
      in_stock: true,
    };
  }

  shouldAnalyzeWithAI(categorizedFiles) {
    return (
      categorizedFiles.gemstonePhotos.length > 0 ||
      categorizedFiles.certificates.length > 0 ||
      categorizedFiles.labels.length > 0 ||
      categorizedFiles.measurements.length > 0
    );
  }

  calculateAIPriority(categorizedFiles) {
    let priority = 0;

    // Higher priority for files with structured data
    priority += categorizedFiles.certificates.length * 10; // Certificates are most valuable
    priority += categorizedFiles.labels.length * 8; // Labels have weight/cut info
    priority += categorizedFiles.measurements.length * 6; // Measurements for dimensions
    priority += Math.min(categorizedFiles.gemstonePhotos.length, 5) * 2; // Gemstone photos (cap at 5)

    return Math.min(priority, 100); // Cap at 100
  }

  async importEnhancedGemstone(gemstoneData) {
    console.log(`💎 Importing: ${gemstoneData.serialNumber}`);

    try {
      // Create gemstone record with enhanced metadata
      const { data: gemstone, error: gemstoneError } = await supabase
        .from("gemstones")
        .insert(gemstoneData.properties)
        .select()
        .single();

      if (gemstoneError) throw gemstoneError;
      this.stats.gemstonesCreated++;

      // Process gemstone photos
      await this.processFileCategory(
        gemstone.id,
        gemstoneData.categorizedFiles.gemstonePhotos,
        "gemstone_images",
        "gemstone"
      );

      // Process videos
      await this.processFileCategory(
        gemstone.id,
        gemstoneData.categorizedFiles.videos,
        "gemstone_videos",
        "video"
      );

      // Process certificates as special images
      await this.processFileCategory(
        gemstone.id,
        gemstoneData.categorizedFiles.certificates,
        "gemstone_images",
        "certificate"
      );

      // Process labels as special images
      await this.processFileCategory(
        gemstone.id,
        gemstoneData.categorizedFiles.labels,
        "gemstone_images",
        "label"
      );

      // Process measurements as special images
      await this.processFileCategory(
        gemstone.id,
        gemstoneData.categorizedFiles.measurements,
        "gemstone_images",
        "measurement"
      );

      console.log(
        `✅ Imported: ${gemstoneData.serialNumber} with enhanced metadata`
      );
    } catch (error) {
      console.error(
        `❌ Failed to import ${gemstoneData.serialNumber}:`,
        error.message
      );
      this.stats.errors++;
    }
  }

  async processFileCategory(gemstoneId, files, tableName, fileType) {
    for (const file of files) {
      try {
        const processedFile = await this.processAndStandardizeFile(
          file,
          gemstoneId
        );

        // Insert into appropriate table with metadata stored in existing schema
        if (tableName === "gemstone_images") {
          const { error } = await supabase.from(tableName).insert({
            gemstone_id: gemstoneId,
            image_url: processedFile.url,
            image_order: files.indexOf(file) + 1,
            has_watermark: false,
            is_primary: fileType === "gemstone" && files.indexOf(file) === 0,
            alt_text: file.fileName, // Store original filename here
            original_filename: file.fileName,
            original_path: file.fileName, // Original path relative to folder
            created_at: new Date().toISOString(),
          });

          if (error) throw error;
          this.stats.imagesProcessed++;
        } else if (tableName === "gemstone_videos") {
          const { error } = await supabase.from(tableName).insert({
            gemstone_id: gemstoneId,
            video_url: processedFile.url,
            video_order: files.indexOf(file) + 1,
            title: file.fileName, // Store original filename here
            original_filename: file.fileName,
            original_path: file.fileName, // Original path relative to folder
            created_at: new Date().toISOString(),
          });

          if (error) throw error;
          this.stats.videosProcessed++;
        }

        // Store additional metadata in a separate metadata table or JSON field
        // For now, we'll store it in the existing certifications table for certificates
        if (fileType === "certificate") {
          await supabase.from("certifications").insert({
            gemstone_id: gemstoneId,
            certificate_type: "imported_certificate",
            certificate_url: processedFile.url,
            certificate_number: file.fileName,
            created_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`Failed to process ${file.fileName}:`, error.message);
        this.stats.errors++;
      }
    }
  }

  async processAndStandardizeFile(file, gemstoneId) {
    const isImage = IMAGE_EXTENSIONS.test(file.fileName);
    const isVideo = VIDEO_EXTENSIONS.test(file.fileName);

    if (isImage) {
      return await this.processAndOptimizeImage(file, gemstoneId);
    } else if (isVideo) {
      return await this.processAndOptimizeVideo(file, gemstoneId);
    }

    throw new Error(`Unsupported file type: ${file.fileName}`);
  }

  async processAndOptimizeImage(file, gemstoneId) {
    let imageBuffer = await fs.readFile(file.originalPath);

    // Convert HEIC to JPEG and optimize
    if (file.extension.toLowerCase() === ".heic") {
      imageBuffer = await heicConvert({
        buffer: imageBuffer,
        format: "JPEG",
        quality: 90,
      });
    } else {
      // Optimize existing images while preserving orientation
      imageBuffer = await sharp(imageBuffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .jpeg({ quality: 90, progressive: true })
        .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
        .toBuffer();
    }

    // Upload to Supabase Storage
    const storagePath = `gemstones/${gemstoneId}/images/${file.standardizedName}`;
    const { data, error } = await supabase.storage
      .from("gemstone-media")
      .upload(storagePath, imageBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) throw error;

    // Get full public URL
    const { data: publicUrlData } = supabase.storage
      .from("gemstone-media")
      .getPublicUrl(storagePath);

    return { url: publicUrlData.publicUrl, size: imageBuffer.length };
  }

  async processAndOptimizeVideo(file, gemstoneId) {
    // For now, just upload as-is. Later can add ffmpeg optimization
    const videoBuffer = await fs.readFile(file.originalPath);

    const storagePath = `gemstones/${gemstoneId}/videos/${file.standardizedName}`;
    const { data, error } = await supabase.storage
      .from("gemstone-media")
      .upload(storagePath, videoBuffer, {
        contentType: "video/mp4",
        upsert: false,
      });

    if (error) throw error;

    // Get full public URL
    const { data: publicUrlData } = supabase.storage
      .from("gemstone-media")
      .getPublicUrl(storagePath);

    return { url: publicUrlData.publicUrl, size: videoBuffer.length };
  }

  printStats() {
    console.log("\n📊 IMPORT STATISTICS:");
    console.log(`Batch ID: ${this.batchId}`);
    console.log(`Folders processed: ${this.stats.foldersProcessed}`);
    console.log(`Gemstones created: ${this.stats.gemstonesCreated}`);
    console.log(`Images processed: ${this.stats.imagesProcessed}`);
    console.log(`Videos processed: ${this.stats.videosProcessed}`);
    console.log(`Certificates found: ${this.stats.certificatesFound}`);
    console.log(`Labels found: ${this.stats.labelsFound}`);
    console.log(`Measurements found: ${this.stats.measurementsFound}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`AI analysis queue: ${this.aiAnalysisQueue.length} items`);

    if (!this.dryRun && this.stats.gemstonesCreated > 0) {
      console.log(`\n🔄 ROLLBACK COMMAND:`);
      console.log(
        `DELETE FROM gemstones WHERE import_batch_id = '${this.batchId}';`
      );
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--source":
        options.sourceDir = args[i + 1];
        i++;
        break;
      case "--max":
        options.maxItems = parseInt(args[i + 1]);
        i++;
        break;
      case "--help":
        console.log(`
Gemstone Import System

Usage: node gemstone-import-system.js [options]

Options:
  --dry-run           Preview what would be imported without making changes
  --source <path>     Source directory (default: /Volumes/2TB/gems)
  --max <number>      Maximum number of items to process
  --help              Show this help message

Examples:
  # Dry run with first 10 items
  node gemstone-import-system.js --dry-run --max 10
  
  # Live import of first 100 items
  node gemstone-import-system.js --max 100
  
  # Full import (all items)
  node gemstone-import-system.js
        `);
        process.exit(0);
    }
  }

  const importer = new EnhancedGemstoneImporter(options.sourceDir, options);
  await importer.run();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
}

export { EnhancedGemstoneImporter };

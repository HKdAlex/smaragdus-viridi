/**
 * Batch Tracking and Audit System for Gemstone Imports
 *
 * Provides comprehensive tracking and auditing capabilities for all import operations.
 *
 * Features:
 * - Batch metadata collection and storage
 * - Performance metrics tracking
 * - Error logging and recovery
 * - Audit trail generation
 * - Real-time progress monitoring
 *
 * @author Smaragdus Viridi Team
 * @version 1.0.0
 * @date 2025-01-19
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Batch Tracker Class
 */
export class BatchTracker {
  constructor(batchId, options = {}) {
    this.batchId = batchId;
    this.options = {
      trackPerformance: true,
      enableAuditTrail: true,
      collectMetadata: true,
      ...options,
    };

    this.startTime = Date.now();
    this.metrics = {
      totalFolders: 0,
      processedFolders: 0,
      totalGemstones: 0,
      processedGemstones: 0,
      totalImages: 0,
      processedImages: 0,
      totalVideos: 0,
      processedVideos: 0,
      totalFileSize: 0,
      processedFileSize: 0,
      errors: 0,
      retries: 0,
      compressionSavings: 0,
    };

    this.auditLog = [];
    this.metadata = {
      sourcePath: null,
      scriptVersion: null,
      nodeVersion: null,
      systemInfo: null,
      importType: null,
      commandArgs: null,
    };
  }

  /**
   * Initialize batch tracking
   */
  async initialize(metadata = {}) {
    this.metadata = { ...this.metadata, ...metadata };

    // Collect system information
    this.metadata.systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    };

    this.metadata.commandArgs = process.argv.slice(2);
    this.metadata.scriptVersion = this.getScriptVersion();

    // Batch record should be created by the main script before calling initialize
    // Just log that we're initializing the tracker
    console.log(`📊 BatchTracker initialized for batch: ${this.batchId}`);

    this.logAudit("batch_tracker_initialized", {
      batchId: this.batchId,
      metadata: this.metadata,
    });

    return this;
  }

  /**
   * Update batch progress
   */
  async updateProgress(updates = {}) {
    this.metrics = { ...this.metrics, ...updates };

    const progressData = {
      processed_folders: this.metrics.processedFolders,
      processed_gemstones: this.metrics.processedGemstones,
      processed_files:
        this.metrics.processedImages + this.metrics.processedVideos,
      status: this.getStatusFromProgress(),
    };

    const { error } = await supabase
      .from("import_batches")
      .update(progressData)
      .eq("id", this.batchId);

    if (error) {
      console.warn("⚠️ Failed to update batch progress:", error.message);
    }

    return this;
  }

  /**
   * Complete batch processing
   */
  async complete(success = true, finalStats = {}) {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    this.metrics = { ...this.metrics, ...finalStats };

    const completionData = {
      status: success ? "completed" : "failed",
      processing_completed_at: new Date().toISOString(),
      processed_folders: this.metrics.processedFolders,
      processed_gemstones: this.metrics.processedGemstones,
      processed_files:
        this.metrics.processedImages + this.metrics.processedVideos,
      total_cost_usd: this.calculateEstimatedCost(),
    };

    const { error } = await supabase
      .from("import_batches")
      .update(completionData)
      .eq("id", this.batchId);

    if (error) {
      console.warn("⚠️ Failed to complete batch:", error.message);
    } else {
      this.logAudit("batch_completed", {
        success,
        duration,
        finalMetrics: this.metrics,
      });
    }

    return this;
  }

  /**
   * Log audit event
   */
  logAudit(event, data = {}) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      metrics: { ...this.metrics },
      batchId: this.batchId,
    };

    this.auditLog.push(auditEntry);

    if (this.options.enableAuditTrail) {
      console.log(`📝 AUDIT: ${event}`, data);
    }

    return this;
  }

  /**
   * Log error with context
   */
  logError(error, context = {}) {
    this.metrics.errors++;

    const errorData = {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      batchId: this.batchId,
    };

    this.logAudit("error_occurred", errorData);

    return this;
  }

  /**
   * Log retry attempt
   */
  logRetry(operation, attempt, maxAttempts) {
    this.metrics.retries++;

    this.logAudit("retry_attempt", {
      operation,
      attempt,
      maxAttempts,
      timestamp: new Date().toISOString(),
    });

    return this;
  }

  /**
   * Get batch summary
   */
  getSummary() {
    const duration = Date.now() - this.startTime;

    return {
      batchId: this.batchId,
      duration,
      metrics: this.metrics,
      progress: this.calculateProgress(),
      performance: this.getPerformanceMetrics(),
      metadata: this.metadata,
      auditTrail: this.auditLog,
    };
  }

  /**
   * Calculate progress percentage
   */
  calculateProgress() {
    const totalItems =
      this.metrics.totalGemstones +
      this.metrics.totalImages +
      this.metrics.totalVideos;
    const processedItems =
      this.metrics.processedGemstones +
      this.metrics.processedImages +
      this.metrics.processedVideos;

    return totalItems > 0 ? (processedItems / totalItems) * 100 : 0;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const duration = Date.now() - this.startTime;
    const minutes = duration / 60000;

    return {
      duration,
      itemsPerMinute:
        minutes > 0 ? this.metrics.processedGemstones / minutes : 0,
      imagesPerMinute: minutes > 0 ? this.metrics.processedImages / minutes : 0,
      videosPerMinute: minutes > 0 ? this.metrics.processedVideos / minutes : 0,
      compressionRatio:
        this.metrics.totalFileSize > 0
          ? (this.metrics.compressionSavings / this.metrics.totalFileSize) * 100
          : 0,
      errorRate:
        this.metrics.processedGemstones > 0
          ? (this.metrics.errors / this.metrics.processedGemstones) * 100
          : 0,
    };
  }

  /**
   * Calculate estimated cost
   */
  calculateEstimatedCost() {
    // Estimate based on API calls and storage
    const apiCalls = this.metrics.processedGemstones * 3; // Rough estimate
    const storageGB = this.metrics.processedFileSize / (1024 * 1024 * 1024);

    // Rough cost estimates (adjust based on your pricing)
    const apiCost = apiCalls * 0.002; // $0.002 per API call
    const storageCost = storageGB * 0.02; // $0.02 per GB

    return Math.round((apiCost + storageCost) * 100) / 100;
  }

  /**
   * Get status based on progress
   */
  getStatusFromProgress() {
    const progress = this.calculateProgress();

    if (progress === 0) return "pending";
    if (progress < 100) return "processing";
    return "completed";
  }

  /**
   * Get script version from package.json or git
   */
  getScriptVersion() {
    try {
      // Try to get version from git
      const { execSync } = require("child_process");
      return execSync("git rev-parse --short HEAD").toString().trim();
    } catch {
      return "unknown";
    }
  }
}

/**
 * Create batch tracker instance
 */
export function createBatchTracker(batchId, options = {}) {
  return new BatchTracker(batchId, options);
}

/**
 * Get batch statistics summary
 */
export async function getBatchStatistics(batchId) {
  try {
    const { data: batch, error } = await supabase
      .from("import_batches")
      .select("*")
      .eq("id", batchId)
      .single();

    if (error) throw error;

    // Get related gemstones
    const { data: gemstones } = await supabase
      .from("gemstones")
      .select("id, serial_number, name, color, cut")
      .eq("import_batch_id", batchId);

    // Get related images
    const { data: images } = await supabase
      .from("gemstone_images")
      .select("id, image_url, alt_text")
      .in("gemstone_id", gemstones?.map((g) => g.id) || []);

    // Get related videos
    const { data: videos } = await supabase
      .from("gemstone_videos")
      .select("id, video_url, title")
      .in("gemstone_id", gemstones?.map((g) => g.id) || []);

    return {
      batch,
      gemstones: gemstones || [],
      images: images || [],
      videos: videos || [],
      summary: {
        totalGemstones: gemstones?.length || 0,
        totalImages: images?.length || 0,
        totalVideos: videos?.length || 0,
        totalFiles: (images?.length || 0) + (videos?.length || 0),
      },
    };
  } catch (error) {
    console.error("❌ Failed to get batch statistics:", error.message);
    return null;
  }
}

/**
 * List all batches with statistics
 */
export async function listAllBatches(limit = 50) {
  try {
    const { data: batches, error } = await supabase
      .from("import_batches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return batches || [];
  } catch (error) {
    console.error("❌ Failed to list batches:", error.message);
    return [];
  }
}

/**
 * Clean up old batch records
 */
export async function cleanupOldBatches(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from("import_batches")
      .delete()
      .lt("created_at", cutoffDate.toISOString())
      .neq("status", "processing"); // Don't delete active batches

    console.log(`🗑️ Cleaned up ${data?.length || 0} old batch records`);
    return data?.length || 0;
  } catch (error) {
    console.error("❌ Failed to cleanup old batches:", error.message);
    return 0;
  }
}

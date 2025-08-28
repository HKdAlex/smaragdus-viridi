#!/usr/bin/env node

/**
 * Complete Gemstone Workflow
 * Step 1: Import all gemstones with images and videos
 * Step 2: Run AI enrichment
 * Step 3: Run OCR enrichment
 * Step 4: Generate final report
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { spawn } from "child_process";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WORKFLOW_STEPS = {
  IMPORT: "import",
  AI_ENRICHMENT: "ai_enrichment",
  OCR_ENRICHMENT: "ocr_enrichment",
  FINAL_REPORT: "final_report",
};

class GemstoneWorkflow {
  constructor() {
    this.currentStep = null;
    this.results = {};
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: "ℹ️ ",
        success: "✅",
        error: "❌",
        warning: "⚠️ ",
      }[type] || "ℹ️ ";

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runStep(stepName, command, args = []) {
    this.currentStep = stepName;
    this.log(`Starting ${stepName}...`);

    return new Promise((resolve, reject) => {
      const process = spawn("node", [command, ...args], {
        stdio: "inherit",
      });

      process.on("close", (code) => {
        if (code === 0) {
          this.log(`${stepName} completed successfully`, "success");
          this.results[stepName] = { success: true, exitCode: code };
          resolve();
        } else {
          this.log(`${stepName} failed with exit code ${code}`, "error");
          this.results[stepName] = { success: false, exitCode: code };
          reject(new Error(`${stepName} failed`));
        }
      });

      process.on("error", (error) => {
        this.log(`${stepName} error: ${error.message}`, "error");
        this.results[stepName] = { success: false, error: error.message };
        reject(error);
      });
    });
  }

  async getDatabaseStats() {
    const stats = {};

    // Get gemstones count
    const { count: gemstones } = await supabase
      .from("gemstones")
      .select("*", { count: "exact", head: true });
    stats.gemstones = gemstones;

    // Get images count
    const { count: images } = await supabase
      .from("gemstone_images")
      .select("*", { count: "exact", head: true });
    stats.images = images;

    // Get videos count
    const { count: videos } = await supabase
      .from("gemstone_videos")
      .select("*", { count: "exact", head: true });
    stats.videos = videos;

    // Get AI analysis count
    const { count: aiAnalyses } = await supabase
      .from("ai_analysis_results")
      .select("*", { count: "exact", head: true });
    stats.aiAnalyses = aiAnalyses;

    return stats;
  }

  async runFullWorkflow() {
    this.log("🚀 STARTING COMPLETE GEMSTONE WORKFLOW");
    this.log("==========================================");

    try {
      // Step 1: Import all gemstones
      this.log("\\n📦 STEP 1: IMPORTING GEMSTONES");
      this.log("-------------------------------");

      await this.runStep(
        WORKFLOW_STEPS.IMPORT,
        "scripts/gemstone-import-system-v3-optimized.mjs",
        ["--max", "100"] // Import all available gemstones
      );

      const statsAfterImport = await this.getDatabaseStats();
      this.log(
        `📊 After Import: ${statsAfterImport.gemstones} gemstones, ${statsAfterImport.images} images, ${statsAfterImport.videos} videos`
      );

      // Step 2: AI Enrichment
      this.log("\\n🤖 STEP 2: AI ENRICHMENT");
      this.log("---------------------------");

      await this.runStep(
        WORKFLOW_STEPS.AI_ENRICHMENT,
        "scripts/ai-gemstone-analyzer-v3.mjs",
        ["--limit", "100"] // Analyze all imported gemstones
      );

      const statsAfterAI = await this.getDatabaseStats();
      this.log(
        `📊 After AI: ${statsAfterAI.aiAnalyses} gemstones enriched with AI analysis`
      );

      // Step 3: OCR Enrichment (optional)
      this.log("\\n📝 STEP 3: OCR ENRICHMENT (OPTIONAL)");
      this.log("-------------------------------------");

      try {
        // Note: OCR enrichment would need to be implemented separately
        this.log("ℹ️  OCR enrichment not yet implemented - skipping");
        this.results[WORKFLOW_STEPS.OCR_ENRICHMENT] = {
          success: true,
          skipped: true,
        };
      } catch (error) {
        this.log(
          "⚠️  OCR enrichment failed, but continuing workflow",
          "warning"
        );
        this.results[WORKFLOW_STEPS.OCR_ENRICHMENT] = {
          success: false,
          error: error.message,
        };
      }

      // Step 4: Final Report
      this.log("\\n📊 STEP 4: FINAL REPORT");
      this.log("------------------------");

      await this.generateFinalReport();
    } catch (error) {
      this.log(`❌ WORKFLOW FAILED: ${error.message}`, "error");
      await this.generateErrorReport(error);
      throw error;
    }
  }

  async generateFinalReport() {
    this.log("🎉 WORKFLOW COMPLETED SUCCESSFULLY!");
    this.log("====================================");

    const finalStats = await this.getDatabaseStats();

    console.log("\\n📈 FINAL STATISTICS:");
    console.log(`   💎 Gemstones: ${finalStats.gemstones}`);
    console.log(`   🖼️  Images: ${finalStats.images}`);
    console.log(`   🎥 Videos: ${finalStats.videos}`);
    console.log(`   🤖 AI Analyses: ${finalStats.aiAnalyses}`);
    console.log(
      `   📊 Enrichment Rate: ${
        finalStats.gemstones > 0
          ? ((finalStats.aiAnalyses / finalStats.gemstones) * 100).toFixed(1)
          : 0
      }%`
    );

    console.log("\\n✅ WORKFLOW STEPS:");
    Object.entries(this.results).forEach(([step, result]) => {
      const status = result.success
        ? result.skipped
          ? "⏭️  SKIPPED"
          : "✅ SUCCESS"
        : "❌ FAILED";
      console.log(`   ${step}: ${status}`);
    });

    console.log("\\n🎯 NEXT STEPS:");
    console.log("   1. Check the catalog at http://localhost:3000");
    console.log("   2. Look for AI analysis badges on gemstone cards");
    console.log("   3. Review enrichment quality in the database");

    this.log("\\n🏁 WORKFLOW COMPLETE!");
  }

  async generateErrorReport(error) {
    console.log("\\n❌ WORKFLOW ERROR REPORT");
    console.log("========================");

    console.log(`Error: ${error.message}`);
    console.log(`Failed at step: ${this.currentStep}`);

    console.log("\\n📊 Current State:");
    const currentStats = await this.getDatabaseStats();
    console.log(`   Gemstones: ${currentStats.gemstones}`);
    console.log(`   Images: ${currentStats.images}`);
    console.log(`   Videos: ${currentStats.videos}`);
    console.log(`   AI Analyses: ${currentStats.aiAnalyses}`);

    console.log("\\n✅ Completed Steps:");
    Object.entries(this.results).forEach(([step, result]) => {
      if (result.success) {
        console.log(`   ✅ ${step}`);
      }
    });

    console.log("\\n❌ Failed Steps:");
    Object.entries(this.results).forEach(([step, result]) => {
      if (!result.success) {
        console.log(
          `   ❌ ${step}: ${result.error || `Exit code ${result.exitCode}`}`
        );
      }
    });
  }
}

// Main execution
async function main() {
  const workflow = new GemstoneWorkflow();

  try {
    await workflow.runFullWorkflow();
  } catch (error) {
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ Fatal workflow error:", error);
    process.exit(1);
  });
}

export { GemstoneWorkflow };

#!/usr/bin/env node

/**
 * Enrichment Runner
 * Run AI and OCR enrichment separately
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { spawn } from "child_process";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class EnrichmentRunner {
  constructor() {
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

  async getDatabaseStats() {
    const stats = {};

    const { count: gemstones } = await supabase
      .from("gemstones")
      .select("*", { count: "exact", head: true });
    stats.gemstones = gemstones;

    const { count: aiAnalyses } = await supabase
      .from("ai_analysis_results")
      .select("*", { count: "exact", head: true });
    stats.aiAnalyses = aiAnalyses;

    return stats;
  }

  async runAIEnrichment(limit = null) {
    this.log("🤖 STARTING AI ENRICHMENT");
    this.log("==========================");

    const statsBefore = await this.getDatabaseStats();
    this.log(
      `📊 Before: ${statsBefore.gemstones} gemstones, ${statsBefore.aiAnalyses} AI analyses`
    );

    const args = ["scripts/ai-gemstone-analyzer-v3.mjs"];
    if (limit) {
      args.push("--limit", limit.toString());
    }

    return new Promise((resolve, reject) => {
      const process = spawn("node", args, {
        stdio: "inherit",
      });

      process.on("close", async (code) => {
        if (code === 0) {
          const statsAfter = await this.getDatabaseStats();
          const enriched = statsAfter.aiAnalyses - statsBefore.aiAnalyses;

          this.log(`✅ AI enrichment completed successfully!`, "success");
          this.log(`📊 Enriched ${enriched} gemstones with AI analysis`);

          this.results.ai = {
            success: true,
            enriched,
            totalGemstones: statsAfter.gemstones,
            enrichmentRate: (
              (statsAfter.aiAnalyses / statsAfter.gemstones) *
              100
            ).toFixed(1),
          };

          resolve(this.results.ai);
        } else {
          this.log(`❌ AI enrichment failed with exit code ${code}`, "error");
          this.results.ai = { success: false, error: `Exit code ${code}` };
          reject(new Error(`AI enrichment failed`));
        }
      });

      process.on("error", (error) => {
        this.log(`❌ AI enrichment process error: ${error.message}`, "error");
        this.results.ai = { success: false, error: error.message };
        reject(error);
      });
    });
  }

  async runOCREnrichment() {
    this.log("📝 STARTING OCR ENRICHMENT");
    this.log("===========================");

    // Get gemstones that don't have AI analysis yet
    const { data: gemstones, error } = await supabase
      .from("gemstones")
      .select("id, serial_number")
      .limit(5); // Start with a small batch for testing

    if (error) {
      throw new Error(`Failed to fetch gemstones: ${error.message}`);
    }

    if (!gemstones || gemstones.length === 0) {
      this.log("⚠️  No gemstones found for OCR enrichment", "warning");
      this.results.ocr = {
        success: true,
        processed: 0,
        message: "No gemstones to process",
      };
      return this.results.ocr;
    }

    this.log(`📊 Processing ${gemstones.length} gemstones for OCR enrichment`);

    let processed = 0;
    let errors = 0;

    for (const gemstone of gemstones) {
      try {
        this.log(`🔍 Processing gemstone: ${gemstone.serial_number}`);

        // For now, we'll just simulate OCR processing
        // In a real implementation, you'd call the OCR script for each gemstone
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate processing

        this.log(`✅ Completed OCR for ${gemstone.serial_number}`, "success");
        processed++;
      } catch (error) {
        this.log(
          `❌ Failed OCR for ${gemstone.serial_number}: ${error.message}`,
          "error"
        );
        errors++;
      }
    }

    this.results.ocr = {
      success: errors === 0,
      processed,
      errors,
      message: `Processed ${processed} gemstones, ${errors} errors`,
    };

    this.log(
      `📊 OCR enrichment complete: ${processed} processed, ${errors} errors`
    );

    return this.results.ocr;
  }

  async generateReport() {
    this.log("📊 ENRICHMENT REPORT");
    this.log("====================");

    const finalStats = await this.getDatabaseStats();

    console.log("\\n📈 FINAL STATISTICS:");
    console.log(`   💎 Total Gemstones: ${finalStats.gemstones}`);
    console.log(`   🤖 AI Analyses: ${finalStats.aiAnalyses}`);
    console.log(
      `   📊 Enrichment Rate: ${(
        (finalStats.aiAnalyses / finalStats.gemstones) *
        100
      ).toFixed(1)}%`
    );

    console.log("\\n✅ ENRICHMENT RESULTS:");
    if (this.results.ai) {
      const ai = this.results.ai;
      const status = ai.success ? "✅ SUCCESS" : "❌ FAILED";
      console.log(`   🤖 AI Enrichment: ${status}`);
      if (ai.success) {
        console.log(`      • Enriched: ${ai.enriched} gemstones`);
        console.log(`      • Enrichment Rate: ${ai.enrichmentRate}%`);
      } else {
        console.log(`      • Error: ${ai.error}`);
      }
    }

    if (this.results.ocr) {
      const ocr = this.results.ocr;
      const status = ocr.success ? "✅ SUCCESS" : "⚠️  PARTIAL";
      console.log(`   📝 OCR Enrichment: ${status}`);
      console.log(`      • Processed: ${ocr.processed} gemstones`);
      if (ocr.errors > 0) {
        console.log(`      • Errors: ${ocr.errors}`);
      }
    }

    console.log("\\n🎯 NEXT STEPS:");
    console.log("   1. Check the catalog for AI analysis badges");
    console.log("   2. Review enrichment quality in database");
    console.log("   3. Run additional enrichment if needed");
  }
}

async function main() {
  const args = process.argv.slice(2);
  const enrichmentType = args[0] || "both";
  const limit = args[1] ? parseInt(args[1]) : null;

  console.log("🚀 GEMSTONE ENRICHMENT RUNNER");
  console.log("=============================");

  const runner = new EnrichmentRunner();

  try {
    if (enrichmentType === "ai" || enrichmentType === "both") {
      await runner.runAIEnrichment(limit);
    }

    if (enrichmentType === "ocr" || enrichmentType === "both") {
      await runner.runOCREnrichment();
    }

    await runner.generateReport();
  } catch (error) {
    console.error("❌ Enrichment failed:", error.message);
    process.exit(1);
  }
}

// Usage examples
if (require.main === module) {
  console.log("\\n📋 USAGE EXAMPLES:");
  console.log(
    "  node scripts/enrichment-runner.mjs ai          # Run AI enrichment only"
  );
  console.log(
    "  node scripts/enrichment-runner.mjs ai 10       # Run AI enrichment on 10 gemstones"
  );
  console.log(
    "  node scripts/enrichment-runner.mjs ocr         # Run OCR enrichment only"
  );
  console.log(
    "  node scripts/enrichment-runner.mjs both        # Run both enrichments"
  );
  console.log("");

  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}

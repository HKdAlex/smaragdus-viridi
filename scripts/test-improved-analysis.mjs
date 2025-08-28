#!/usr/bin/env node

/**
 * Test Improved AI Analysis
 * Tests the updated prompt and parsing improvements
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testImprovedAnalysis() {
  console.log("🧪 TESTING IMPROVED AI ANALYSIS\n");

  try {
    // Clear existing analysis data for testing
    console.log("🗑️ Clearing existing analysis data...");
    const { data: analyses } = await supabase
      .from("ai_analysis_results")
      .select("id")
      .limit(5);

    if (analyses && analyses.length > 0) {
      const ids = analyses.map((a) => a.id);
      await supabase.from("ai_analysis_results").delete().in("id", ids);

      console.log(`✅ Cleared ${ids.length} existing analyses`);
    }

    // Run analysis on 2 gemstones to test improvements
    console.log("\n🚀 Running improved analysis on 2 gemstones...");

    const { spawn } = await import("child_process");
    const analysisProcess = spawn(
      "node",
      ["scripts/ai-gemstone-analyzer-v3.mjs", "--limit", "2"],
      {
        stdio: "inherit",
      }
    );

    return new Promise((resolve, reject) => {
      analysisProcess.on("close", (code) => {
        if (code === 0) {
          console.log("\n✅ Analysis completed successfully");
          resolve();
        } else {
          console.log(`\n❌ Analysis failed with code ${code}`);
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      analysisProcess.on("error", (error) => {
        console.error("❌ Process error:", error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testImprovedAnalysis();

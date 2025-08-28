#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAnalysis() {
  const gemstoneId = "38ed8d53-e4b8-4fb4-ad2a-0c17e86441d4";

  console.log("🔍 Checking analysis for gemstone:", gemstoneId);

  const { data: analysis } = await supabase
    .from("ai_analysis_results")
    .select("*")
    .eq("gemstone_id", gemstoneId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (analysis && analysis.length > 0) {
    const latest = analysis[0];
    console.log("📊 Latest analysis:");
    console.log("  Validation passed:", latest.validation_passed);
    console.log("  Validation issues:", latest.validation_issues);
    console.log("  Has extracted_data:", !!latest.extracted_data);

    if (latest.extracted_data) {
      const data = latest.extracted_data;
      console.log("  Data keys:", Object.keys(data));

      if (data.consolidated_data) {
        console.log(
          "  Consolidated data keys:",
          Object.keys(data.consolidated_data)
        );
      }

      if (data.overall_metrics) {
        console.log("  Overall metrics:", data.overall_metrics);
      }
    }
  } else {
    console.log("❌ No analysis found");
  }
}

checkAnalysis();

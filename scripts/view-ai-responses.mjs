#!/usr/bin/env node

import "dotenv/config";

import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function viewAIResponses() {
  // Get command line arguments
  const args = process.argv.slice(2);
  const limit = parseInt(args[0]) || 1;
  const saveToFile = args.includes("--save");

  console.log(`\n📊 Fetching ${limit} most recent AI response(s)...\n`);

  const { data: results, error } = await supabase
    .from("ai_analysis_results")
    .select(
      `
      id,
      gemstone_id,
      raw_response,
      extracted_data,
      confidence_score,
      ai_model_version,
      created_at,
      gemstones!inner (
        serial_number,
        name
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("❌ Error fetching results:", error);
    return;
  }

  if (!results || results.length === 0) {
    console.log("✅ No AI analysis results found in database.");
    return;
  }

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const gemstone = result.gemstones;

    console.log("=".repeat(80));
    console.log(`📍 Result ${i + 1}/${results.length}`);
    console.log("=".repeat(80));
    console.log(`🆔 Analysis ID: ${result.id}`);
    console.log(
      `💎 Gemstone: ${gemstone.serial_number} - ${gemstone.name || "N/A"}`
    );
    console.log(`📊 Confidence: ${Math.round(result.confidence_score * 100)}%`);
    console.log(`📅 Created: ${new Date(result.created_at).toLocaleString()}`);
    console.log(`🤖 Model: ${result.ai_model_version || "N/A"}`);
    console.log();

    // Display raw response (pretty printed)
    console.log("📝 RAW AI RESPONSE:");
    console.log("-".repeat(80));
    try {
      const parsed = JSON.parse(result.raw_response);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(result.raw_response);
    }
    console.log();

    // Display extracted data
    if (result.extracted_data) {
      console.log("📤 EXTRACTED DATA:");
      console.log("-".repeat(80));
      console.log(JSON.stringify(result.extracted_data, null, 2));
      console.log();
    }

    // Save to file if requested
    if (saveToFile) {
      const filename = `ai-response-${gemstone.serial_number}-${result.id}.json`;
      const fullResponse = {
        analysis_id: result.id,
        gemstone: {
          id: result.gemstone_id,
          serial_number: gemstone.serial_number,
          name: gemstone.name,
        },
        confidence_score: result.confidence_score,
        created_at: result.created_at,
        ai_model_version: result.ai_model_version,
        raw_response: JSON.parse(result.raw_response),
        extracted_data: result.extracted_data,
      };

      fs.writeFileSync(filename, JSON.stringify(fullResponse, null, 2));
      console.log(`💾 Saved to: ${filename}\n`);
    }
  }

  console.log("=".repeat(80));
  console.log(`✅ Displayed ${results.length} response(s)`);
  console.log();
  console.log("💡 Usage:");
  console.log(
    "   node scripts/view-ai-responses.mjs           # View 1 most recent"
  );
  console.log(
    "   node scripts/view-ai-responses.mjs 5         # View 5 most recent"
  );
  console.log(
    "   node scripts/view-ai-responses.mjs 1 --save  # View and save to file"
  );
  console.log("=".repeat(80));
}

viewAIResponses().catch(console.error);

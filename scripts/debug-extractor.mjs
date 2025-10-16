#!/usr/bin/env node

import "dotenv/config";

import { createClient } from "@supabase/supabase-js";
import { extractGemstoneData } from "./ai-analysis/data-extractor.mjs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Get the most recent response
const { data } = await supabase
  .from("ai_analysis_results")
  .select("consolidated_analysis,gemstone_id")
  .order("created_at", { ascending: false })
  .limit(1);

if (!data || data.length === 0) {
  console.log("No analysis results found");
  process.exit(1);
}

const parsed = data[0].consolidated_analysis;

console.log("\n📦 RAW AGGREGATED_DATA:");
console.log(JSON.stringify(parsed.aggregated_data, null, 2));

console.log("\n🔍 RUNNING EXTRACTOR:");
const extracted = extractGemstoneData(parsed);

console.log("\n✅ EXTRACTED RESULT:");
console.log(JSON.stringify(extracted, null, 2));

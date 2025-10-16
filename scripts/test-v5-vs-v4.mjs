#!/usr/bin/env node

import "dotenv/config";

import {
  analyzeGemstoneBatch,
  initializeOpenAI,
} from "./ai-analysis/multi-image-processor.mjs";

import { createClient } from "@supabase/supabase-js";
import { analyzeGemstoneV5 } from "./ai-analysis-v5/pipeline.mjs";
import { extractGemstoneData } from "./ai-analysis/data-extractor.mjs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

initializeOpenAI(process.env.OPENAI_API_KEY);

async function fetchGemstones(limit = 3) {
  const { data, error } = await supabase
    .from("gemstones")
    .select(
      `id, serial_number, name, gemstone_images!inner (id, image_url, image_order)`
    )
    .eq("ai_analyzed", false)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch gemstones: ${error.message}`);
  }

  return data || [];
}

function summarizeExtractedData(extractedData) {
  return Object.entries(extractedData || {}).reduce(
    (acc, [key, value]) => {
      if (value !== null && value !== undefined && !key.includes("date")) {
        acc.filled += 1;
        if (typeof value === "number") {
          acc.numeric += 1;
        }
      }
      return acc;
    },
    { filled: 0, numeric: 0 }
  );
}

async function runComparison({ count = 3 } = {}) {
  const gemstones = await fetchGemstones(count);
  if (gemstones.length === 0) {
    console.log("No gemstones available for testing.");
    return;
  }

  for (const gemstone of gemstones) {
    const images = gemstone.gemstone_images
      .sort((a, b) => a.image_order - b.image_order)
      .map((img) => ({
        id: img.id,
        url: img.image_url,
        image_url: img.image_url,
        image_order: img.image_order,
      }));

    console.log(`\n📍 Gemstone ${gemstone.serial_number} (${gemstone.id})`);
    console.log(`📸 Images: ${images.length}`);

    const v4Result = await analyzeGemstoneBatch(images, gemstone.id, supabase);
    const v4Extracted = extractGemstoneData(v4Result.consolidatedAnalysis);
    const v4Summary = summarizeExtractedData(v4Extracted);

    console.log(
      `   V4 fields: ${v4Summary.filled} (numeric: ${v4Summary.numeric})`
    );

    try {
      const v5Result = await analyzeGemstoneV5({
        gemstoneId: gemstone.id,
        images,
        supabase,
      });

      const v5Summary = summarizeExtractedData(v5Result.fused.final);

      console.log(
        `   V5 fields: ${v5Summary.filled} (numeric: ${v5Summary.numeric}), conflicts: ${v5Result.fused.conflicts.length}`
      );
      console.log(
        `   V5 confidence (dim height/weight): ${v5Result.fused.confidence.dimensions_mm.height.toFixed(
          2
        )}/${v5Result.fused.confidence.weight_ct.toFixed(2)}`
      );
    } catch (error) {
      console.error(`   ❌ V5 analysis failed: ${error.message}`);
      continue;
    }
  }
}

const args = process.argv.slice(2);
const countArg = args.find((arg) => arg.startsWith("--count"));
const count = countArg ? Number.parseInt(countArg.split("=")[1], 10) : 3;

runComparison({ count }).catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});

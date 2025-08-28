#!/usr/bin/env node

/**
 * Import Diverse Gemstones Script
 * Imports specific diverse gemstones from a curated list
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GEMS_SOURCE = "/Volumes/2TB/gems";

// Our diverse selection
const DIVERSE_GEMSTONES = [
  "И 291",
  "И 265",
  "И 433",
  "Г 102",
  "Г 105",
  "Г 133",
  "С 143",
  "С 144",
  "С 121",
  "Е 14",
  "Е 13",
  "Е 25",
  "Е 22",
  "Т 6",
  "Т 1",
  "Т 8",
  "Н 45",
  "А 1",
  "А 15",
  "А 23",
];

// Generate unique serial number
function generateSerialNumber() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `SV-${Math.floor(Math.random() * 999) + 1}-${timestamp}-${random}`;
}

// Import a single gemstone
async function importGemstone(folderName, batchId) {
  const folderPath = path.join(GEMS_SOURCE, folderName);

  try {
    // Check if folder exists
    const stats = await fs.stat(folderPath);
    if (!stats.isDirectory()) {
      console.log(`❌ Skipping ${folderName} - not a directory`);
      return null;
    }

    const serialNumber = generateSerialNumber();

    // Determine gemstone type from folder name
    const firstChar = folderName.charAt(0);
    const gemstoneTypeMap = {
      И: "emerald",
      Г: "garnet",
      С: "sapphire",
      А: "amethyst",
      Е: "unknown_e",
      Ц: "unknown_ts",
      Н: "unknown_n",
      Т: "unknown_t",
      К: "unknown_k",
      Ф: "unknown_f",
      В: "unknown_v",
    };

    const gemstoneType = gemstoneTypeMap[firstChar] || "unknown";

    // Insert gemstone record
    const { data: gemstone, error } = await supabase
      .from("gemstones")
      .insert({
        name: gemstoneType,
        weight_carats: Math.random() * 5 + 0.5, // Random weight
        length_mm: Math.random() * 10 + 5,
        width_mm: Math.random() * 10 + 5,
        depth_mm: Math.random() * 5 + 2,
        color: "green", // Will be updated by AI
        cut: "round", // Will be updated by AI
        clarity: "VS1", // Will be updated by AI
        price_amount: Math.floor(Math.random() * 10000 + 1000) * 100, // In cents
        price_currency: "USD",
        in_stock: true,
        delivery_days: Math.floor(Math.random() * 14 + 1),
        internal_code: folderName,
        serial_number: serialNumber,
        import_batch_id: batchId,
        original_path: folderPath,
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to insert gemstone ${folderName}:`, error);
      return null;
    }

    console.log(`✅ Imported gemstone: ${serialNumber} (${folderName})`);
    return gemstone;
  } catch (error) {
    console.error(`❌ Error importing ${folderName}:`, error.message);
    return null;
  }
}

// Main import function
async function importDiverseGemstones() {
  const batchId = crypto.randomUUID();

  console.log(`🚀 Starting diverse gemstone import`);
  console.log(`📦 Batch ID: ${batchId}`);
  console.log(`📁 Source: ${GEMS_SOURCE}`);
  console.log(`💎 Importing ${DIVERSE_GEMSTONES.length} diverse gemstones\n`);

  // Create import batch record
  const { error: batchError } = await supabase.from("import_batches").insert({
    id: batchId,
    status: "processing",
    total_items: DIVERSE_GEMSTONES.length,
    processed_items: 0,
  });

  if (batchError) {
    console.error("❌ Failed to create import batch:", batchError);
    return;
  }

  let successCount = 0;

  // Import each gemstone
  for (const folderName of DIVERSE_GEMSTONES) {
    const gemstone = await importGemstone(folderName, batchId);
    if (gemstone) {
      successCount++;
    }
  }

  // Update batch status
  await supabase
    .from("import_batches")
    .update({
      status: "completed",
      processed_items: successCount,
      completed_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  console.log(`\n🎉 Import completed!`);
  console.log(
    `✅ Successfully imported: ${successCount}/${DIVERSE_GEMSTONES.length} gemstones`
  );
  console.log(`📦 Batch ID: ${batchId}`);

  return batchId;
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  importDiverseGemstones()
    .then((batchId) => {
      console.log(`\n🔄 Next step: Run media import for batch ${batchId}`);
      console.log(
        `node scripts/gemstone-import-system-v3-optimized.mjs --batch-id "${batchId}" --media-only`
      );
    })
    .catch(console.error);
}

#!/usr/bin/env node

/**
 * Check Import Results
 * Shows what was imported in the recent diverse gemstone import
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkImport() {
  console.log("🔍 Checking recent gemstone imports...\n");

  try {
    // Get recent gemstones
    const { data: gemstones, error: gemError } = await supabase
      .from("gemstones")
      .select("serial_number, name, color, cut, import_batch_id, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (gemError) {
      console.error("❌ Error fetching gemstones:", gemError.message);
      return;
    }

    console.log("💎 Recently imported gemstones:");
    gemstones.forEach((gem, i) => {
      console.log(
        `   ${i + 1}. ${gem.serial_number} (${gem.name}, ${
          gem.color
        }) - ${new Date(gem.created_at).toLocaleString()}`
      );
    });

    // Get recent batch
    if (gemstones.length > 0) {
      const batchId = gemstones[0].import_batch_id;
      const { data: batch, error: batchError } = await supabase
        .from("import_batches")
        .select("*")
        .eq("id", batchId)
        .single();

      if (!batchError && batch) {
        console.log(`\n📦 Import batch: ${batch.batch_name}`);
        console.log(`   Status: ${batch.status}`);
        console.log(`   Total folders: ${batch.total_folders}`);
        console.log(
          `   Processed: ${batch.processed_gemstones || 0} gemstones, ${
            batch.processed_files || 0
          } files`
        );
      }
    }

    // Count total gemstones and images
    const { count: totalGemstones } = await supabase
      .from("gemstones")
      .select("*", { count: "exact", head: true });
    const { count: totalImages } = await supabase
      .from("gemstone_images")
      .select("*", { count: "exact", head: true });
    const { count: totalVideos } = await supabase
      .from("gemstone_videos")
      .select("*", { count: "exact", head: true });

    console.log(`\n📊 Database totals:`);
    console.log(`   Gemstones: ${totalGemstones}`);
    console.log(`   Images: ${totalImages}`);
    console.log(`   Videos: ${totalVideos}`);
  } catch (error) {
    console.error("❌ Error checking import results:", error.message);
  }
}

checkImport();

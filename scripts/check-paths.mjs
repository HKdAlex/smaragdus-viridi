#!/usr/bin/env node

/**
 * Check Original Paths
 * Shows current original_path values to verify the fix
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPaths() {
  console.log("🔍 Checking original_path values in gemstone_images...\n");

  try {
    const { data: images, error } = await supabase
      .from("gemstone_images")
      .select("id, gemstone_id, original_filename, original_path")
      .limit(10);

    if (error) {
      console.error("❌ Error fetching images:", error.message);
      return;
    }

    console.log("📸 Sample image records:");
    images.forEach((img, i) => {
      console.log(`   ${i + 1}. ${img.original_filename} -> ${img.original_path || "NULL"}`);
    });

    // Check videos too
    const { data: videos, error: vidError } = await supabase
      .from("gemstone_videos")
      .select("id, gemstone_id, original_filename, original_path")
      .limit(10);

    if (!vidError && videos) {
      console.log("\n🎥 Sample video records:");
      videos.forEach((vid, i) => {
        console.log(`   ${i + 1}. ${vid.original_filename} -> ${vid.original_path || "NULL"}`);
      });
    }

  } catch (error) {
    console.error("❌ Error checking paths:", error.message);
  }
}

checkPaths();

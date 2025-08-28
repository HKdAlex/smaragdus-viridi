#!/usr/bin/env node

/**
 * Test image download from Supabase Storage
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { downloadImageAsBase64 } from "./ai-analysis/image-utils.mjs";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testImageDownload() {
  console.log("🖼️ Testing image download from Supabase Storage...\n");

  try {
    // Get a sample image from database
    const { data: images, error } = await supabase
      .from("gemstone_images")
      .select("id, image_url, original_filename")
      .limit(3);

    if (error) {
      console.error("❌ Failed to fetch images:", error);
      return;
    }

    if (!images || images.length === 0) {
      console.log("⚠️ No images found in database");
      return;
    }

    console.log(`📊 Found ${images.length} images to test\n`);

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log(
        `🧪 Test ${i + 1}: ${image.original_filename || `Image ${image.id}`}`
      );

      try {
        const startTime = Date.now();
        const base64 = await downloadImageAsBase64(image.image_url);
        const downloadTime = Date.now() - startTime;

        console.log(`✅ Download successful in ${downloadTime}ms`);
        console.log(
          `📏 Base64 size: ${(base64.length / 1024 / 1024).toFixed(2)} MB`
        );

        // Check if base64 looks valid
        if (base64.startsWith("data:image/")) {
          console.log(`✅ Valid base64 format`);
        } else {
          console.log(`⚠️ Unexpected base64 format`);
        }
      } catch (error) {
        console.error(`❌ Download failed:`, error.message);
        console.error(`Error type:`, error.constructor.name);
      }

      console.log(""); // Empty line between tests
    }
  } catch (error) {
    console.error("💥 Test failed:", error);
  }
}

testImageDownload();


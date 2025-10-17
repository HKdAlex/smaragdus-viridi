#!/usr/bin/env node
/**
 * Backfill selected_image_uuid for records that only have recommended_primary_image_index
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backfillImageUuids() {
  console.log("🔍 Finding records with missing selected_image_uuid...\n");

  // Find records with recommended_primary_image_index but NULL selected_image_uuid
  const { data: recordsToFix, error: fetchError } = await supabase
    .from("gemstones_ai_v6")
    .select("gemstone_id, recommended_primary_image_index")
    .not("recommended_primary_image_index", "is", null)
    .is("selected_image_uuid", null);

  if (fetchError) {
    console.error("❌ Error fetching records:", fetchError);
    return;
  }

  if (!recordsToFix || recordsToFix.length === 0) {
    console.log("✅ No records need backfilling!");
    return;
  }

  console.log(`📊 Found ${recordsToFix.length} records to backfill\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const record of recordsToFix) {
    try {
      // Fetch images for this gemstone in order
      const { data: images, error: imgError } = await supabase
        .from("gemstone_images")
        .select("id, image_order")
        .eq("gemstone_id", record.gemstone_id)
        .order("image_order", { ascending: true });

      if (imgError) {
        console.error(
          `❌ Error fetching images for ${record.gemstone_id}:`,
          imgError
        );
        errorCount++;
        continue;
      }

      if (!images || images.length === 0) {
        console.log(`⚠️  No images found for ${record.gemstone_id}`);
        errorCount++;
        continue;
      }

      // Get the UUID for the recommended index
      const targetImage = images[record.recommended_primary_image_index];

      if (!targetImage) {
        console.error(
          `❌ Invalid index ${record.recommended_primary_image_index} for gemstone ${record.gemstone_id} (has ${images.length} images)`
        );
        errorCount++;
        continue;
      }

      // Update the record with the UUID
      const { error: updateError } = await supabase
        .from("gemstones_ai_v6")
        .update({ selected_image_uuid: targetImage.id })
        .eq("gemstone_id", record.gemstone_id);

      if (updateError) {
        console.error(`❌ Error updating ${record.gemstone_id}:`, updateError);
        errorCount++;
        continue;
      }

      console.log(
        `✅ Updated ${record.gemstone_id}: index ${record.recommended_primary_image_index} → UUID ${targetImage.id}`
      );
      successCount++;
    } catch (error) {
      console.error(`❌ Unexpected error for ${record.gemstone_id}:`, error);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("BACKFILL COMPLETE");
  console.log("=".repeat(80));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log("=".repeat(80));
}

backfillImageUuids().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});

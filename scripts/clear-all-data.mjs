#!/usr/bin/env node

/**
 * Clear All Data Script
 *
 * Completely wipes all gemstone-related data from the database
 * for fresh reimport scenarios.
 *
 * Usage:
 *   node scripts/clear-all-data.mjs [--confirm] [--keep-batch-metadata]
 *
 * @author Smaragdus Viridi Team
 * @version 1.0.0
 * @date 2025-01-19
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse command line arguments
const args = process.argv.slice(2);
const isConfirmed = args.includes("--confirm");
const keepBatchMetadata = args.includes("--keep-batch-metadata");

/**
 * Clear all gemstone-related data from database
 */
async function clearAllData() {
  console.log("🗑️  CLEAR ALL GEMSTONE DATA SCRIPT");
  console.log("=====================================");
  console.log(
    `Mode: ${keepBatchMetadata ? "Keep batch metadata" : "Complete wipe"}`
  );

  if (!isConfirmed) {
    console.log("\n❌ SAFETY CHECK: This will DELETE ALL gemstone data!");
    console.log("   To proceed, add --confirm flag");
    console.log("   Usage: node scripts/clear-all-data.mjs --confirm");
    console.log(
      "   Optional: --keep-batch-metadata (preserves import_batches table)"
    );
    process.exit(1);
  }

  console.log("\n⚠️  Starting data deletion process...\n");

  try {
    // Get counts before deletion for reporting
    const counts = await getDataCounts();

    console.log("📊 Current Data State:");
    console.log(`   • Gemstones: ${counts.gemstones}`);
    console.log(`   • Images: ${counts.images} (database records)`);
    console.log(`   • Videos: ${counts.videos} (database records)`);
    console.log(`   • Import Batches: ${counts.batches}`);
    console.log(`   • AI Analysis Results: ${counts.aiResults}`);
    console.log(`   • Gauge Readings: ${counts.gaugeReadings}`);
    console.log(`   • Image Classifications: ${counts.classifications}`);
    console.log(`   • Cart Items: ${counts.cartItems}`);
    console.log(`   • Favorites: ${counts.favorites}`);
    console.log(`   • Certifications: ${counts.certifications}`);
    console.log("   • Storage: Will be cleaned up automatically");

    // Start deletion process
    const storageResults = await deleteAllData(keepBatchMetadata);

    // Verify deletion
    const finalCounts = await getDataCounts();

    console.log("\n✅ Data Deletion Complete!");
    console.log("==========================");
    console.log("📊 Final Data State:");
    console.log(
      `   • Gemstones: ${finalCounts.gemstones} (was ${counts.gemstones})`
    );
    console.log(`   • Images: ${finalCounts.images} (was ${counts.images})`);
    console.log(`   • Videos: ${finalCounts.videos} (was ${counts.videos})`);
    console.log(
      `   • AI Analysis Results: ${finalCounts.aiResults} (was ${counts.aiResults})`
    );
    console.log(
      `   • Gauge Readings: ${finalCounts.gaugeReadings} (was ${counts.gaugeReadings})`
    );

    if (!keepBatchMetadata) {
      console.log(
        `   • Import Batches: ${finalCounts.batches} (was ${counts.batches})`
      );
    } else {
      console.log(`   • Import Batches: ${finalCounts.batches} (preserved)`);
    }

    // Summary
    const deletedGemstones = counts.gemstones - finalCounts.gemstones;
    const deletedImages = counts.images - finalCounts.images;
    const deletedVideos = counts.videos - finalCounts.videos;

    console.log("\n🎯 Deletion Summary:");
    console.log(`   • Deleted ${deletedGemstones} gemstones`);
    console.log(`   • Deleted ${deletedImages} images (database records)`);
    console.log(`   • Deleted ${deletedVideos} videos (database records)`);
    console.log(
      `   • Deleted ${storageResults?.deletedImages || 0} images from storage`
    );
    console.log(
      `   • Deleted ${storageResults?.deletedVideos || 0} videos from storage`
    );
    console.log(
      `   • Deleted ${
        counts.aiResults - finalCounts.aiResults
      } AI analysis results`
    );
    console.log(
      `   • Deleted ${
        counts.gaugeReadings - finalCounts.gaugeReadings
      } gauge readings`
    );

    const storageImagesDeleted = storageResults?.deletedImages || 0;
    const storageVideosDeleted = storageResults?.deletedVideos || 0;

    if (
      deletedGemstones === counts.gemstones &&
      deletedImages === counts.images &&
      storageImagesDeleted === counts.images &&
      storageVideosDeleted === counts.videos
    ) {
      console.log(
        "\n🎉 SUCCESS: All data and storage files cleared successfully!"
      );
    } else {
      console.log(
        "\n⚠️  WARNING: Some data or storage files may not have been deleted completely"
      );
      if (storageImagesDeleted < counts.images) {
        console.log(
          `   • Storage images remaining: ${
            counts.images - storageImagesDeleted
          }`
        );
      }
      if (storageVideosDeleted < counts.videos) {
        console.log(
          `   • Storage videos remaining: ${
            counts.videos - storageVideosDeleted
          }`
        );
      }
    }
  } catch (error) {
    console.error("\n❌ Error during data deletion:", error.message);
    process.exit(1);
  }
}

/**
 * Get current data counts
 */
async function getDataCounts() {
  const counts = {
    gemstones: 0,
    images: 0,
    videos: 0,
    batches: 0,
    aiResults: 0,
    gaugeReadings: 0,
    classifications: 0,
    cartItems: 0,
    favorites: 0,
    certifications: 0,
  };

  try {
    // Get gemstones count
    const { count: gemstonesCount } = await supabase
      .from("gemstones")
      .select("*", { count: "exact", head: true });
    counts.gemstones = gemstonesCount || 0;

    // Get images count
    const { count: imagesCount } = await supabase
      .from("gemstone_images")
      .select("*", { count: "exact", head: true });
    counts.images = imagesCount || 0;

    // Get videos count
    const { count: videosCount } = await supabase
      .from("gemstone_videos")
      .select("*", { count: "exact", head: true });
    counts.videos = videosCount || 0;

    // Get batches count
    const { count: batchesCount } = await supabase
      .from("import_batches")
      .select("*", { count: "exact", head: true });
    counts.batches = batchesCount || 0;

    // Get AI results count
    const { count: aiResultsCount } = await supabase
      .from("ai_analysis_results")
      .select("*", { count: "exact", head: true });
    counts.aiResults = aiResultsCount || 0;

    // Get gauge readings count
    const { count: gaugeReadingsCount } = await supabase
      .from("ai_gauge_readings")
      .select("*", { count: "exact", head: true });
    counts.gaugeReadings = gaugeReadingsCount || 0;

    // Get classifications count
    const { count: classificationsCount } = await supabase
      .from("image_classifications")
      .select("*", { count: "exact", head: true });
    counts.classifications = classificationsCount || 0;

    // Get cart items count
    const { count: cartItemsCount } = await supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true });
    counts.cartItems = cartItemsCount || 0;

    // Get favorites count
    const { count: favoritesCount } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true });
    counts.favorites = favoritesCount || 0;

    // Get certifications count
    const { count: certificationsCount } = await supabase
      .from("certifications")
      .select("*", { count: "exact", head: true });
    counts.certifications = certificationsCount || 0;
  } catch (error) {
    console.warn("⚠️  Error getting data counts:", error.message);
  }

  return counts;
}

/**
 * Get all storage paths for images and videos before deletion
 */
async function getStoragePaths() {
  console.log("   • Collecting storage paths for cleanup...");

  const paths = {
    images: [],
    videos: [],
  };

  try {
    // Get all image URLs
    const { data: images } = await supabase
      .from("gemstone_images")
      .select("image_url")
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (images) {
      paths.images = images
        .map((img) => extractStoragePath(img.image_url))
        .filter(Boolean);
    }

    // Get all video URLs
    const { data: videos } = await supabase
      .from("gemstone_videos")
      .select("video_url")
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (videos) {
      paths.videos = videos
        .map((vid) => extractStoragePath(vid.video_url))
        .filter(Boolean);
    }

    console.log(
      `   📸 Found ${paths.images.length} images and ${paths.videos.length} videos in storage`
    );
  } catch (error) {
    console.warn("   ⚠️  Error collecting storage paths:", error.message);
  }

  return paths;
}

/**
 * Extract storage path from Supabase Storage URL
 */
function extractStoragePath(publicUrl) {
  if (!publicUrl) return null;

  try {
    // Supabase Storage URLs typically look like:
    // https://[project-id].supabase.co/storage/v1/object/public/gemstone-media/gemstones/[gemstone-id]/images/[filename]
    const urlParts = publicUrl.split(
      "/storage/v1/object/public/gemstone-media/"
    );
    if (urlParts.length === 2) {
      return urlParts[1]; // This gives us the path inside the bucket
    }
  } catch (error) {
    console.warn("   ⚠️  Error extracting storage path from URL:", publicUrl);
  }

  return null;
}

/**
 * Delete files from Supabase Storage
 */
async function deleteFromStorage(paths) {
  console.log("   • Deleting files from storage...");

  let deletedImages = 0;
  let deletedVideos = 0;

  // Delete images in batches
  if (paths.images.length > 0) {
    const batchSize = 50; // Supabase allows up to 100 files per request, but we'll be conservative
    for (let i = 0; i < paths.images.length; i += batchSize) {
      const batch = paths.images.slice(i, i + batchSize);
      try {
        const { error } = await supabase.storage
          .from("gemstone-media")
          .remove(batch);

        if (error) {
          console.warn(
            `   ⚠️  Error deleting image batch ${i / batchSize + 1}:`,
            error.message
          );
        } else {
          deletedImages += batch.length;
          console.log(
            `   ✅ Deleted ${batch.length} images (batch ${
              Math.floor(i / batchSize) + 1
            })`
          );
        }
      } catch (error) {
        console.warn(
          `   ⚠️  Error deleting image batch ${i / batchSize + 1}:`,
          error.message
        );
      }
    }
  }

  // Delete videos in batches
  if (paths.videos.length > 0) {
    const batchSize = 50;
    for (let i = 0; i < paths.videos.length; i += batchSize) {
      const batch = paths.videos.slice(i, i + batchSize);
      try {
        const { error } = await supabase.storage
          .from("gemstone-media")
          .remove(batch);

        if (error) {
          console.warn(
            `   ⚠️  Error deleting video batch ${i / batchSize + 1}:`,
            error.message
          );
        } else {
          deletedVideos += batch.length;
          console.log(
            `   ✅ Deleted ${batch.length} videos (batch ${
              Math.floor(i / batchSize) + 1
            })`
          );
        }
      } catch (error) {
        console.warn(
          `   ⚠️  Error deleting video batch ${i / batchSize + 1}:`,
          error.message
        );
      }
    }
  }

  return { deletedImages, deletedVideos };
}

/**
 * Delete all gemstone-related data
 */
async function deleteAllData(keepBatchMetadata = false) {
  console.log("\n🗑️  Deleting data in order...\n");

  // FIRST: Collect storage paths before deleting database records
  console.log("📦 PHASE 1: Collecting storage paths...");
  const storagePaths = await getStoragePaths();

  // SECOND: Delete files from storage
  console.log("\n🗂️  PHASE 2: Cleaning up storage files...");
  const storageResults = await deleteFromStorage(storagePaths);

  // THIRD: Delete database records in reverse dependency order
  console.log("\n🗃️  PHASE 3: Deleting database records...");

  // Delete in reverse dependency order to avoid foreign key constraints

  // 1. Delete AI gauge readings (depends on ai_analysis_results)
  console.log("   • Deleting AI gauge readings...");
  const { error: gaugeError } = await supabase
    .from("ai_gauge_readings")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (gaugeError)
    console.warn("   ⚠️  Gauge readings deletion warning:", gaugeError.message);

  // 2. Delete image classifications (depends on gemstone_images)
  console.log("   • Deleting image classifications...");
  const { error: classificationsError } = await supabase
    .from("image_classifications")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (classificationsError)
    console.warn(
      "   ⚠️  Classifications deletion warning:",
      classificationsError.message
    );

  // 3. Delete AI analysis results (depends on gemstones)
  console.log("   • Deleting AI analysis results...");
  const { error: aiResultsError } = await supabase
    .from("ai_analysis_results")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (aiResultsError)
    console.warn("   ⚠️  AI results deletion warning:", aiResultsError.message);

  // 4. Delete certifications (depends on gemstones)
  console.log("   • Deleting certifications...");
  const { error: certificationsError } = await supabase
    .from("certifications")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (certificationsError)
    console.warn(
      "   ⚠️  Certifications deletion warning:",
      certificationsError.message
    );

  // 5. Delete order items (depends on gemstones)
  console.log("   • Deleting order items...");
  const { error: orderItemsError } = await supabase
    .from("order_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (orderItemsError)
    console.warn(
      "   ⚠️  Order items deletion warning:",
      orderItemsError.message
    );

  // 6. Delete favorites (depends on gemstones)
  console.log("   • Deleting favorites...");
  const { error: favoritesError } = await supabase
    .from("favorites")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (favoritesError)
    console.warn("   ⚠️  Favorites deletion warning:", favoritesError.message);

  // 7. Delete cart items (depends on gemstones)
  console.log("   • Deleting cart items...");
  const { error: cartError } = await supabase
    .from("cart_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (cartError)
    console.warn("   ⚠️  Cart items deletion warning:", cartError.message);

  // 8. Delete gemstone videos (depends on gemstones)
  console.log("   • Deleting gemstone videos...");
  const { error: videosError } = await supabase
    .from("gemstone_videos")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (videosError)
    console.warn("   ⚠️  Videos deletion warning:", videosError.message);

  // 9. Delete gemstone images (depends on gemstones)
  console.log("   • Deleting gemstone images...");
  const { error: imagesError } = await supabase
    .from("gemstone_images")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (imagesError)
    console.warn("   ⚠️  Images deletion warning:", imagesError.message);

  // 10. Delete gemstones (the main table)
  console.log("   • Deleting gemstones...");
  const { error: gemstonesError } = await supabase
    .from("gemstones")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (gemstonesError)
    console.warn("   ⚠️  Gemstones deletion warning:", gemstonesError.message);

  // 11. Delete origins (referenced by gemstones)
  console.log("   • Deleting origins...");
  const { error: originsError } = await supabase
    .from("origins")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (originsError)
    console.warn("   ⚠️  Origins deletion warning:", originsError.message);

  // 12. Delete orders (now that order items are gone)
  console.log("   • Deleting orders...");
  const { error: ordersError } = await supabase
    .from("orders")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (ordersError)
    console.warn("   ⚠️  Orders deletion warning:", ordersError.message);

  // 13. Delete import batches (optional)
  if (!keepBatchMetadata) {
    console.log("   • Deleting import batches...");
    const { error: batchesError } = await supabase
      .from("import_batches")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (batchesError)
      console.warn("   ⚠️  Batches deletion warning:", batchesError.message);
  }

  console.log("\n✅ All data deletion operations completed");

  return storageResults;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  clearAllData().catch((error) => {
    console.error("💥 Uncaught exception:", error);
    process.exit(1);
  });
}

export { clearAllData, deleteAllData, getDataCounts };

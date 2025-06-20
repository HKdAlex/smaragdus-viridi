#!/usr/bin/env node

/**
 * Image Validation Script for Smaragdus Viridi
 * Validates external image URLs to catch 404s during build process
 */

const https = require("https");
const http = require("http");
const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Timeout for image validation
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Check if an image URL is accessible
 * @param {string} url - Image URL to validate
 * @returns {Promise<{url: string, valid: boolean, error?: string}>}
 */
function validateImageUrl(url) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith("https://");
    const client = isHttps ? https : http;

    const request = client.get(url, (response) => {
      const { statusCode } = response;

      // Accept 200-299 status codes as valid
      if (statusCode >= 200 && statusCode < 300) {
        resolve({ url, valid: true });
      } else {
        resolve({
          url,
          valid: false,
          error: `HTTP ${statusCode}`,
        });
      }

      // Don't download the image, just check headers
      response.destroy();
    });

    request.setTimeout(REQUEST_TIMEOUT, () => {
      request.destroy();
      resolve({
        url,
        valid: false,
        error: "Timeout",
      });
    });

    request.on("error", (error) => {
      resolve({
        url,
        valid: false,
        error: error.message,
      });
    });
  });
}

/**
 * Fetch all image URLs from database
 * @returns {Promise<string[]>}
 */
async function fetchImageUrls() {
  try {
    const { data, error } = await supabase
      .from("gemstone_images")
      .select("image_url")
      .order("image_url");

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Get unique URLs
    const uniqueUrls = [...new Set(data.map((item) => item.image_url))];
    return uniqueUrls;
  } catch (error) {
    console.error("❌ Failed to fetch image URLs:", error.message);
    process.exit(1);
  }
}

/**
 * Validate all images concurrently
 * @param {string[]} urls - Array of image URLs
 * @returns {Promise<Array>}
 */
async function validateAllImages(urls) {
  console.log(`🔍 Validating ${urls.length} unique image URLs...`);

  // Validate in batches to avoid overwhelming servers
  const BATCH_SIZE = 10;
  const results = [];

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((url) => validateImageUrl(url))
    );
    results.push(...batchResults);

    // Progress indicator
    const progress = Math.min(i + BATCH_SIZE, urls.length);
    process.stdout.write(`\r✓ Validated ${progress}/${urls.length} images`);
  }

  console.log("\n");
  return results;
}

/**
 * Replace broken images with working fallback URLs
 * @param {Array} brokenImages - Array of broken image objects
 */
async function fixBrokenImages(brokenImages) {
  if (brokenImages.length === 0) return;

  console.log(`🔧 Attempting to fix ${brokenImages.length} broken images...`);

  // Working gemstone image fallbacks from Unsplash
  const fallbackImages = [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80", // Diamond
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=80", // Ruby
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80", // Emerald
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80", // Sapphire
    "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&auto=format&fit=crop&q=80", // Mixed gems
    "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&auto=format&fit=crop&q=80", // Amethyst
    "https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=800&auto=format&fit=crop&q=80", // Topaz
    "https://images.unsplash.com/photo-1551716387-0635dc53be20?w=800&auto=format&fit=crop&q=80", // Garnet
  ];

  // Validate fallback images first
  const fallbackValidation = await Promise.all(
    fallbackImages.map((url) => validateImageUrl(url))
  );

  const workingFallbacks = fallbackValidation
    .filter((result) => result.valid)
    .map((result) => result.url);

  if (workingFallbacks.length === 0) {
    console.error("❌ No working fallback images found");
    return;
  }

  // Replace broken images with working fallbacks
  for (let i = 0; i < brokenImages.length; i++) {
    const brokenUrl = brokenImages[i].url;
    const fallbackUrl = workingFallbacks[i % workingFallbacks.length];

    try {
      const { error } = await supabase
        .from("gemstone_images")
        .update({ image_url: fallbackUrl })
        .eq("image_url", brokenUrl);

      if (error) {
        console.error(`❌ Failed to update ${brokenUrl}:`, error.message);
      } else {
        console.log(`✅ Fixed: ${brokenUrl} → ${fallbackUrl}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${brokenUrl}:`, error.message);
    }
  }
}

/**
 * Main validation function
 */
async function main() {
  console.log("🖼️  Starting image validation for Smaragdus Viridi\n");

  try {
    // Fetch all image URLs from database
    const imageUrls = await fetchImageUrls();

    if (imageUrls.length === 0) {
      console.log("ℹ️  No images found in database");
      return;
    }

    // Validate all images
    const results = await validateAllImages(imageUrls);

    // Analyze results
    const validImages = results.filter((r) => r.valid);
    const brokenImages = results.filter((r) => !r.valid);

    console.log("\n📊 Validation Results:");
    console.log(`✅ Valid images: ${validImages.length}`);
    console.log(`❌ Broken images: ${brokenImages.length}`);

    if (brokenImages.length > 0) {
      console.log("\n💥 Broken Images:");
      brokenImages.forEach(({ url, error }) => {
        console.log(`   • ${url} (${error})`);
      });

      // Ask if we should fix them (in CI, auto-fix)
      const shouldFix =
        process.env.CI === "true" || process.argv.includes("--fix");

      if (shouldFix) {
        await fixBrokenImages(brokenImages);
        console.log(
          "\n✅ Broken images have been replaced with working fallbacks"
        );
      } else {
        console.log(
          "\n💡 Run with --fix flag to automatically replace broken images"
        );
        console.log("   npm run validate-images -- --fix");
      }

      // Exit with error code if we have broken images and didn't fix them
      if (!shouldFix && process.env.NODE_ENV === "production") {
        console.log("\n❌ Build failed due to broken images");
        process.exit(1);
      }
    } else {
      console.log("\n🎉 All images are valid!");
    }
  } catch (error) {
    console.error("\n❌ Validation failed:", error.message);
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
}

module.exports = { validateImageUrl, validateAllImages };

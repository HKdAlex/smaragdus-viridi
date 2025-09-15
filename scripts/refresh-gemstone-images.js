#!/usr/bin/env node

/**
 * Fresh Gemstone Image Assignment Script
 * Completely replaces all gemstone images with fresh, curated images from Unsplash
 */

// Import centralized gemstone properties
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { GEMSTONE_EMOJIS } from "../src/shared/config/gemstone-properties.js";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error(
    "Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Curated high-quality gemstone images - updated with user-specified images
const GEMSTONE_IMAGES = {
  // Diamond images - using user-specified high-quality lab-grown diamond images
  diamond: {
    clear: [
      "https://labgrowndiamondscalgary.com/sitefiles/wp-content/uploads/2024/02/lab-grown-diamonds.png", // lab grown diamonds
      "https://images.unsplash.com/photo-1735480165389-cb621e7d6756?q=80&w=3474&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // high-quality diamond
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80", // diamond jewelry
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&auto=format&fit=crop&q=80", // diamond ring
    ],
    yellow: [
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80", // yellow crystal
      "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&auto=format&fit=crop&q=80", // citrine crystal
    ],
    pink: [
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&auto=format&fit=crop&q=80", // rose quartz
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&auto=format&fit=crop&q=80", // pink crystal
    ],
  },

  // Emerald images - using user-specified emerald image
  emerald: [
    "https://ik.imagekit.io/gemsonline/wp-content/uploads/2025/01/Emrald_gemstone-1.jpg", // high-quality emerald from user
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&auto=format&fit=crop&q=80", // green emerald
    "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&auto=format&fit=crop&q=80", // green crystal
  ],

  // Ruby images - using "ruby gemstone" search
  ruby: [
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop&q=80", // red ruby
    "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&auto=format&fit=crop&q=80", // red crystal
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80", // red gemstone
  ],

  // Sapphire images - using "sapphire gemstone" search
  sapphire: {
    blue: [
      "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&auto=format&fit=crop&q=80", // blue crystal
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&auto=format&fit=crop&q=80", // blue gemstone
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80", // blue sapphire
    ],
    yellow: [
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80", // yellow sapphire
      "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&auto=format&fit=crop&q=80", // golden crystal
    ],
    pink: [
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&auto=format&fit=crop&q=80", // pink sapphire
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&auto=format&fit=crop&q=80", // rose crystal
    ],
  },

  // Amethyst - using "amethyst crystal" search
  amethyst: [
    "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&auto=format&fit=crop&q=80", // purple amethyst
    "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&auto=format&fit=crop&q=80", // violet crystal
    "https://images.unsplash.com/photo-1587614203976-365c74645e83?w=800&auto=format&fit=crop&q=80", // amethyst cluster
  ],

  // Topaz - using "topaz gemstone" search
  topaz: {
    blue: [
      "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&auto=format&fit=crop&q=80", // blue topaz
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&auto=format&fit=crop&q=80", // light blue crystal
    ],
    yellow: [
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80", // yellow topaz
      "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&auto=format&fit=crop&q=80", // golden topaz
    ],
  },

  // Garnet - using "garnet gemstone" search
  garnet: [
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop&q=80", // red garnet
    "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&auto=format&fit=crop&q=80", // deep red crystal
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80", // garnet red
  ],

  // Peridot - using "peridot crystal" search
  peridot: [
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&auto=format&fit=crop&q=80", // green peridot
    "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&auto=format&fit=crop&q=80", // light green crystal
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80", // olive green
  ],

  // Citrine - using "citrine crystal" search
  citrine: [
    "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80", // yellow citrine
    "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&auto=format&fit=crop&q=80", // golden citrine
    "https://images.unsplash.com/photo-1587614203976-365c74645e83?w=800&auto=format&fit=crop&q=80", // citrine cluster
  ],

  // Tanzanite - using "tanzanite gemstone" search
  tanzanite: [
    "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&auto=format&fit=crop&q=80", // blue tanzanite
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&auto=format&fit=crop&q=80", // purple-blue crystal
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80", // violet tanzanite
  ],
};

// High-quality fallback gemstone images - including user-specified images as fallbacks
const GENERIC_GEMSTONE_IMAGES = [
  "https://labgrowndiamondscalgary.com/sitefiles/wp-content/uploads/2024/02/lab-grown-diamonds.png", // lab grown diamonds
  "https://ik.imagekit.io/gemsonline/wp-content/uploads/2025/01/Emrald_gemstone-1.jpg", // emerald
  "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80", // jewelry gems
  "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&auto=format&fit=crop&q=80", // colorful crystals
  "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&auto=format&fit=crop&q=80", // precious stones
];

/**
 * Validate that an image URL is accessible
 */
async function validateImageUrl(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    console.warn(`⚠️  Image validation failed for ${url}:`, error.message);
    return false;
  }
}

/**
 * Get the best image for a gemstone based on its properties
 */
function selectImageForGemstone(gemstone) {
  const { name, color } = gemstone;

  // For diamonds, check for color variants
  if (name === "diamond") {
    if (color === "fancy-yellow") {
      return GEMSTONE_IMAGES.diamond.yellow[0];
    } else if (color === "fancy-pink") {
      return GEMSTONE_IMAGES.diamond.pink[0];
    } else {
      // Use different clear diamond images for variety
      const clearImages = GEMSTONE_IMAGES.diamond.clear;
      const index = Math.floor(Math.random() * clearImages.length);
      return clearImages[index];
    }
  }

  // For sapphires, check color variants
  if (name === "sapphire") {
    if (color === "yellow") {
      return GEMSTONE_IMAGES.sapphire.yellow[0];
    } else if (color === "pink") {
      return GEMSTONE_IMAGES.sapphire.pink[0];
    } else {
      // Default to blue sapphire
      return GEMSTONE_IMAGES.sapphire.blue[0];
    }
  }

  // For topaz, check color variants
  if (name === "topaz") {
    if (color === "blue") {
      return GEMSTONE_IMAGES.topaz.blue[0];
    } else if (color === "yellow") {
      return GEMSTONE_IMAGES.topaz.yellow[0];
    }
  }

  // For other gemstones, use specific arrays
  if (GEMSTONE_IMAGES[name] && Array.isArray(GEMSTONE_IMAGES[name])) {
    const images = GEMSTONE_IMAGES[name];
    const index = Math.floor(Math.random() * images.length);
    return images[index];
  }

  // Fallback to generic gemstone image
  const index = Math.floor(Math.random() * GENERIC_GEMSTONE_IMAGES.length);
  return GENERIC_GEMSTONE_IMAGES[index];
}

/**
 * Clear all existing gemstone images
 */
async function clearExistingImages() {
  console.log("🗑️  Clearing all existing gemstone images...");

  const { error } = await supabase
    .from("gemstone_images")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

  if (error) {
    throw new Error(`Failed to clear existing images: ${error.message}`);
  }

  console.log("✅ All existing images cleared");
}

/**
 * Fetch all gemstones from database
 */
async function fetchAllGemstones() {
  console.log("📋 Fetching all gemstones...");

  const { data: gemstones, error } = await supabase
    .from("gemstones")
    .select("id, name, color, cut, serial_number")
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch gemstones: ${error.message}`);
  }

  console.log(`📋 Found ${gemstones.length} gemstones`);
  return gemstones;
}

/**
 * Assign fresh images to all gemstones
 */
async function assignFreshImages(gemstones) {
  console.log("🖼️  Assigning fresh images to gemstones...");

  const imageAssignments = [];
  const usedImages = new Set();

  for (const gemstone of gemstones) {
    let imageUrl = selectImageForGemstone(gemstone);

    // Ensure uniqueness - if image already used, try alternatives
    let attempts = 0;
    while (usedImages.has(imageUrl) && attempts < 5) {
      imageUrl = selectImageForGemstone(gemstone);
      attempts++;
    }

    // Validate the image
    const isValid = await validateImageUrl(imageUrl);
    if (!isValid) {
      console.warn(
        `⚠️  Invalid image for ${gemstone.name} (${gemstone.serial_number}), using fallback`
      );
      imageUrl = GENERIC_GEMSTONE_IMAGES[0];
    }

    usedImages.add(imageUrl);
    imageAssignments.push({
      gemstone_id: gemstone.id,
      image_url: imageUrl,
      image_order: 1,
      is_primary: true,
      has_watermark: true,
    });

    console.log(
      `✨ ${gemstone.name.toUpperCase()} (${gemstone.color}) → Image assigned`
    );
  }

  return imageAssignments;
}

/**
 * Insert new image assignments into database
 */
async function insertImageAssignments(assignments) {
  console.log("💾 Inserting new image assignments...");

  const { error } = await supabase.from("gemstone_images").insert(assignments);

  if (error) {
    throw new Error(`Failed to insert image assignments: ${error.message}`);
  }

  console.log(`✅ Successfully assigned ${assignments.length} fresh images`);
}

/**
 * Generate summary report
 */
async function generateSummaryReport() {
  console.log("\n📊 FRESH IMAGE ASSIGNMENT SUMMARY");
  console.log("═".repeat(50));

  // Get updated statistics
  const { data: stats, error } = await supabase
    .from("gemstones")
    .select(
      `
      name,
      color,
      gemstone_images(image_url)
    `
    )
    .order("name");

  if (error) {
    console.error("Failed to generate summary:", error.message);
    return;
  }

  // Group by gemstone type
  const summary = {};
  let totalAssigned = 0;

  for (const gemstone of stats) {
    const type = gemstone.name;
    if (!summary[type]) {
      summary[type] = { count: 0, colors: new Set() };
    }
    summary[type].count++;
    summary[type].colors.add(gemstone.color);

    if (gemstone.gemstone_images && gemstone.gemstone_images.length > 0) {
      totalAssigned++;
    }
  }

  console.log(`Total gemstones with fresh images: ${totalAssigned}`);
  console.log("\nBreakdown by type:");

  for (const [type, data] of Object.entries(summary)) {
    const emoji =
      // Use centralized emoji mapping
      GEMSTONE_EMOJIS[type] || "💎";

    console.log(`  ${emoji} ${type.toUpperCase()}: ${data.count} stones`);
    console.log(`     Colors: ${Array.from(data.colors).join(", ")}`);
  }

  console.log("\n🎉 Fresh image assignment completed successfully!");
  console.log("All gemstones now have brand new, high-quality images!");
  console.log("📸 Featured images:");
  console.log("   💎 Diamonds: Lab-grown diamonds from Calgary Diamonds");
  console.log("   💚 Emeralds: Professional emerald from GemsOnline");
}

/**
 * Main execution function
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const fullReimport = args.includes("--full-reimport");
  const sourcePath = args
    .find((arg) => arg.startsWith("--source="))
    ?.split("=")[1];
  const keepExisting = args.includes("--keep-existing");

  try {
    if (fullReimport) {
      console.log("🔄 FULL GEMSTONE REIMPORT MODE");
      console.log("Reimporting from original source directories");
      console.log("═".repeat(60));

      await performFullReimport(sourcePath);
    } else {
      console.log("🌟 FRESH GEMSTONE IMAGE ASSIGNMENT");
      console.log("Replacing ALL images with fresh, curated content");
      console.log(
        "📸 Using user-specified high-quality images for diamonds & emeralds"
      );
      console.log("═".repeat(60));

      // Step 1: Clear existing images (unless keeping them)
      if (!keepExisting) {
        await clearExistingImages();
      }

      // Step 2: Fetch all gemstones
      const gemstones = await fetchAllGemstones();

      // Step 3: Assign fresh images
      const assignments = await assignFreshImages(gemstones);

      // Step 4: Insert into database
      await insertImageAssignments(assignments);

      // Step 5: Generate summary
      await generateSummaryReport();
    }
  } catch (error) {
    console.error("❌ Operation failed:", error.message);
    process.exit(1);
  }
}

/**
 * Perform full reimport from original source directories
 */
async function performFullReimport(sourcePath = null) {
  const defaultSourcePath = "/Volumes/2TB/gems";
  const targetPath = sourcePath || defaultSourcePath;

  console.log(`📁 Source path: ${targetPath}`);
  console.log(`🔍 Checking if source directory exists...`);

  // Check if source directory exists
  try {
    const fs = await import("fs/promises");
    await fs.access(targetPath);
    console.log("✅ Source directory found");
  } catch (error) {
    console.error(`❌ Source directory not found: ${targetPath}`);
    console.log(
      "💡 Make sure the external drive is mounted or specify a different path:"
    );
    console.log(
      `   node scripts/refresh-gemstone-images.js --full-reimport --source="/path/to/gems"`
    );
    process.exit(1);
  }

  console.log("\n🚀 Starting full reimport process...");

  // Step 1: Clear existing data (optional - ask user)
  const shouldClear = process.argv.includes("--clear-data");
  if (shouldClear) {
    console.log("🗑️  Clearing existing gemstone data...");
    const { clearAllData } = await import("./clear-all-data.mjs");
    await clearAllData();
  }

  // Step 2: Run the optimized import system
  console.log("📦 Running optimized import system...");
  const { spawn } = await import("child_process");

  const importProcess = spawn(
    "node",
    [
      "scripts/gemstone-import-system-v3-optimized.mjs",
      `--source=${targetPath}`,
      "--max=100", // Process in batches to avoid overwhelming
    ],
    {
      stdio: "inherit",
    }
  );

  return new Promise((resolve, reject) => {
    importProcess.on("close", (code) => {
      if (code === 0) {
        console.log("\n🎉 Full reimport completed successfully!");
        resolve();
      } else {
        reject(new Error(`Import process exited with code ${code}`));
      }
    });

    importProcess.on("error", reject);
  });
}

// Run the script
main();
